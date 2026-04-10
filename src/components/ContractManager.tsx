import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material'
import {
  Code,
  Verified,
  Add,
  Refresh,
  Delete,
  Launch,
  ExpandMore,
  CheckCircle,
  Error as ErrorIcon,
  Compare,
  Warning
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { contractService, ContractDeployment, CompilationResult, VerificationRequest, VerificationResult } from '../services/ContractService'
import { formatEther } from 'ethers'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contract-tabpanel-${index}`}
      aria-labelledby={`contract-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

const ContractManager: React.FC = () => {
  const { wallet, currentNetwork } = useWallet()
  
  // Common state
  const [activeTab, setActiveTab] = useState(0)
  const [deployments, setDeployments] = useState<ContractDeployment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Deployment state
  const [deployDialogOpen, setDeployDialogOpen] = useState(false)
  const [deployStep, setDeployStep] = useState(0)
  const [sourceCode, setSourceCode] = useState('')
  const [contractName, setContractName] = useState('SimpleStorage')
  const [constructorArgs, setConstructorArgs] = useState('')
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null)
  const [deployment, setDeployment] = useState<ContractDeployment | null>(null)
  const [gasEstimate, setGasEstimate] = useState<string>('')
  
  // Verification state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [verifyStep, setVerifyStep] = useState(0)
  const [verifyAddress, setVerifyAddress] = useState('')
  const [verifySourceCode, setVerifySourceCode] = useState('')
  const [verifyContractName, setVerifyContractName] = useState('')
  const [compilerVersion, setCompilerVersion] = useState('0.8.19')
  const [optimizationEnabled, setOptimizationEnabled] = useState(true)
  const [optimizationRuns, setOptimizationRuns] = useState(200)
  const [verifyConstructorArgs, setVerifyConstructorArgs] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [selectedDeployment, setSelectedDeployment] = useState<ContractDeployment | null>(null)
  const [compiledBytecode, setCompiledBytecode] = useState('')
  const [deployedBytecode, setDeployedBytecode] = useState('')
  const [bytecodeMatch, setBytecodeMatch] = useState<boolean | null>(null)

  const deploySteps = useMemo(() => 
    ['Write/Paste Contract', 'Compile', 'Deploy', 'Deployed'], []
  )
  const verifySteps = useMemo(() => 
    ['Contract Details', 'Compile & Compare', 'Verify on Explorer', 'Verification Complete'], []
  )

  useEffect(() => {
    loadDeployments()
  }, [currentNetwork])

  useEffect(() => {
    // Load sample contract for deployment
    const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private value;
    address public owner;
    
    event ValueChanged(uint256 indexed oldValue, uint256 indexed newValue, address indexed changer);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor(uint256 _initialValue) {
        owner = msg.sender;
        value = _initialValue;
        emit ValueChanged(0, _initialValue, msg.sender);
    }
    
    function setValue(uint256 _value) public onlyOwner {
        uint256 oldValue = value;
        value = _value;
        emit ValueChanged(oldValue, _value, msg.sender);
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
    
    function increment() public onlyOwner {
        uint256 oldValue = value;
        value += 1;
        emit ValueChanged(oldValue, value, msg.sender);
    }
}`
    setSourceCode(sampleContract)
    setVerifySourceCode(sampleContract)
  }, [])

  const loadDeployments = () => {
    const allDeployments = contractService.getDeploymentsByNetwork(currentNetwork)
    setDeployments(allDeployments)
  }

  const refreshData = () => {
    loadDeployments()
    setError(null)
  }

  // Deployment functions
  const handleCompile = async () => {
    if (!sourceCode.trim()) {
      setError('Please enter contract source code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await contractService.compileContract(sourceCode, contractName)
      
      if (result.errors.length > 0) {
        setError(`Compilation errors: ${result.errors.join(', ')}`)
        return
      }

      setCompilationResult(result)
      setDeployStep(1)

      // Estimate gas
      try {
        const args = constructorArgs ? JSON.parse(`[${constructorArgs}]`) : []
        const gasEstimate = await contractService.estimateDeploymentGas(result.bytecode, args)
        setGasEstimate(formatEther(gasEstimate))
      } catch (gasError) {
        console.warn('Gas estimation failed:', gasError)
        setGasEstimate('Unable to estimate')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compilation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeploy = async () => {
    if (!compilationResult) return

    setIsLoading(true)
    setError(null)

    try {
      const args = constructorArgs ? JSON.parse(`[${constructorArgs}]`) : []
      const result = await contractService.deployContract(
        compilationResult.bytecode,
        compilationResult.abi,
        args,
        contractName
      )
      
      setDeployment(result)
      setDeployStep(2)
      loadDeployments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeployClose = () => {
    setDeployStep(0)
    setSourceCode('')
    setContractName('SimpleStorage')
    setConstructorArgs('')
    setCompilationResult(null)
    setDeployment(null)
    setError(null)
    setGasEstimate('')
    setDeployDialogOpen(false)
  }

  // Verification functions
  const handleDeploymentSelect = (deployment: ContractDeployment) => {
    setSelectedDeployment(deployment)
    setVerifyAddress(deployment.address)
    setVerifyContractName(deployment.name)
    if (deployment.sourceCode) {
      setVerifySourceCode(deployment.sourceCode)
    }
  }

  const handleCompileAndCompare = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Compile the source code
      const compilation = await contractService.compileContract(verifySourceCode, verifyContractName)
      
      if (compilation.errors.length > 0) {
        setError(`Compilation errors: ${compilation.errors.join(', ')}`)
        return
      }

      setCompiledBytecode(compilation.bytecode)

      // Fetch deployed bytecode
      const deployedCode = await contractService.getBytecodeFromExplorer(
        currentNetwork,
        verifyAddress
      )
      setDeployedBytecode(deployedCode)

      // Compare bytecodes
      const match = contractService.compareBytecode(compilation.bytecode, deployedCode)
      setBytecodeMatch(match)

      setVerifyStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compilation or comparison failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOnExplorer = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const request: VerificationRequest = {
        contractAddress: verifyAddress,
        sourceCode: verifySourceCode,
        contractName: verifyContractName,
        compilerVersion,
        optimizationEnabled,
        optimizationRuns,
        constructorArguments: verifyConstructorArgs
      }

      const result = await contractService.verifyContractOnExplorer(currentNetwork, request)
      setVerificationResult(result)

      if (result.success) {
        setVerifyStep(2)
        loadDeployments() // Refresh deployments to show updated verification status
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyClose = () => {
    setVerifyStep(0)
    setVerifyAddress('')
    setVerifySourceCode('')
    setVerifyContractName('')
    setError(null)
    setVerificationResult(null)
    setSelectedDeployment(null)
    setCompiledBytecode('')
    setDeployedBytecode('')
    setBytecodeMatch(null)
    setVerifyDialogOpen(false)
  }

  const handleDeleteDeployment = (id: string) => {
    contractService.deleteDeployment(id)
    loadDeployments()
  }

  const openInExplorer = (address: string) => {
    const url = contractService.getExplorerUrl(currentNetwork, address)
    window.open(url, '_blank')
  }

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setError(null)
  }, [])

  // Render functions for deployment dialog steps
  const renderDeployStep0 = () => (
    <Box>
      <TextField
        fullWidth
        label="Contract Name"
        value={contractName}
        onChange={(e) => setContractName(e.target.value)}
        margin="normal"
        helperText="Enter the name of your contract"
      />
      <TextField
        fullWidth
        multiline
        rows={15}
        label="Solidity Source Code"
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
        margin="normal"
        sx={{ fontFamily: 'monospace' }}
        helperText="Paste your Solidity contract source code here"
      />
      <TextField
        fullWidth
        label="Constructor Arguments (comma-separated)"
        value={constructorArgs}
        onChange={(e) => setConstructorArgs(e.target.value)}
        margin="normal"
        placeholder="100, 'Hello World', 0x1234..."
        helperText="Enter constructor arguments separated by commas (optional)"
      />
    </Box>
  )

  const renderDeployStep1 = () => (
    <Box>
      <Alert severity="success" sx={{ mb: 2 }}>
        Contract compiled successfully!
      </Alert>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Compilation Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            Bytecode Length: {compilationResult?.bytecode.length} characters
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            ABI Functions: {compilationResult?.abi.length}
          </Typography>
          {gasEstimate && (
            <Typography variant="subtitle2" gutterBottom>
              Estimated Gas Cost: {gasEstimate} ETH
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        Ready to Deploy
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Review the compilation results above and click Deploy to deploy your contract to the {currentNetwork} network.
      </Typography>
    </Box>
  )

  const renderDeployStep2 = () => (
    <Box>
      <Alert severity="success" sx={{ mb: 2 }}>
        Contract deployed successfully!
      </Alert>
      
      {deployment && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Deployment Details
          </Typography>
          <Typography variant="body2">
            <strong>Contract Address:</strong> {deployment.address}
          </Typography>
          <Typography variant="body2">
            <strong>Transaction Hash:</strong> {deployment.transactionHash}
          </Typography>
          <Typography variant="body2">
            <strong>Block Number:</strong> {deployment.blockNumber}
          </Typography>
          <Typography variant="body2">
            <strong>Network:</strong> {currentNetwork}
          </Typography>
        </Box>
      )}
    </Box>
  )

  // Render functions for verification dialog steps
  const renderVerifyStep0 = () => (
    <Box>
      {deployments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select from Your Deployments
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deployments.map((deployment) => (
                  <TableRow 
                    key={deployment.id}
                    selected={selectedDeployment?.id === deployment.id}
                    hover
                    onClick={() => handleDeploymentSelect(deployment)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{deployment.name}</TableCell>
                    <TableCell>
                      {deployment.address.slice(0, 6)}...{deployment.address.slice(-4)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={deployment.verified ? <Verified /> : <Code />}
                        label={deployment.verified ? 'Verified' : 'Unverified'}
                        color={deployment.verified ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation()
                          openInExplorer(deployment.address)
                        }}
                        title="View on Explorer"
                      >
                        <Launch />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Typography variant="h6" gutterBottom>
        Contract Information
      </Typography>

      <TextField
        fullWidth
        label="Contract Address"
        value={verifyAddress}
        onChange={(e) => setVerifyAddress(e.target.value)}
        margin="normal"
        placeholder="0x..."
        helperText="Enter the deployed contract address to verify"
      />

      <TextField
        fullWidth
        label="Contract Name"
        value={verifyContractName}
        onChange={(e) => setVerifyContractName(e.target.value)}
        margin="normal"
        helperText="The main contract name (e.g., SimpleStorage)"
      />

      <TextField
        fullWidth
        multiline
        rows={12}
        label="Source Code"
        value={verifySourceCode}
        onChange={(e) => setVerifySourceCode(e.target.value)}
        margin="normal"
        sx={{ fontFamily: 'monospace' }}
        helperText="Paste the complete Solidity source code"
      />

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Compiler Version</InputLabel>
          <Select
            value={compilerVersion}
            label="Compiler Version"
            onChange={(e) => setCompilerVersion(e.target.value)}
          >
            <MenuItem value="0.8.19">0.8.19</MenuItem>
            <MenuItem value="0.8.18">0.8.18</MenuItem>
            <MenuItem value="0.8.17">0.8.17</MenuItem>
            <MenuItem value="0.8.16">0.8.16</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={optimizationEnabled}
              onChange={(e) => setOptimizationEnabled(e.target.checked)}
            />
          }
          label="Optimization"
        />

        {optimizationEnabled && (
          <TextField
            label="Runs"
            type="number"
            value={optimizationRuns}
            onChange={(e) => setOptimizationRuns(parseInt(e.target.value))}
            sx={{ width: 100 }}
          />
        )}
      </Box>

      <TextField
        fullWidth
        label="Constructor Arguments (optional)"
        value={verifyConstructorArgs}
        onChange={(e) => setVerifyConstructorArgs(e.target.value)}
        margin="normal"
        placeholder="ABI-encoded constructor arguments"
        helperText="Only needed if the contract has constructor parameters"
      />
    </Box>
  )

  const renderVerifyStep1 = () => (
    <Box>
      <Alert severity="success" sx={{ mb: 2 }}>
        Contract compiled successfully! Bytecode comparison results:
      </Alert>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Compare sx={{ mr: 1 }} />
        <Typography variant="h6">
          Bytecode Comparison
        </Typography>
        {bytecodeMatch !== null && (
          <Chip
            icon={bytecodeMatch ? <CheckCircle /> : <ErrorIcon />}
            label={bytecodeMatch ? 'Bytecode Match' : 'Bytecode Mismatch'}
            color={bytecodeMatch ? 'success' : 'error'}
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Compiled Bytecode ({compiledBytecode.length} chars)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace', 
              wordBreak: 'break-all',
              maxHeight: 200,
              overflow: 'auto',
              bgcolor: 'grey.100',
              p: 1,
              borderRadius: 1
            }}
          >
            {compiledBytecode}
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Deployed Bytecode ({deployedBytecode.length} chars)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace', 
              wordBreak: 'break-all',
              maxHeight: 200,
              overflow: 'auto',
              bgcolor: 'grey.100',
              p: 1,
              borderRadius: 1
            }}
          >
            {deployedBytecode}
          </Typography>
        </AccordionDetails>
      </Accordion>

      {bytecodeMatch === false && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Bytecode mismatch detected. This may be due to:
          <ul>
            <li>Different compiler version or settings</li>
            <li>Missing constructor arguments</li>
            <li>Different source code than deployed</li>
            <li>Metadata differences (safe to ignore)</li>
          </ul>
        </Alert>
      )}

      {bytecodeMatch === true && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Bytecode matches! The contract is ready for verification on the block explorer.
        </Alert>
      )}
    </Box>
  )

  const renderVerifyStep2 = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Verified sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Contract Verified Successfully!
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Your contract has been successfully verified on the block explorer.
      </Typography>
      
      {verificationResult && (
        <Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Status:</strong> {verificationResult.status}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Message:</strong> {verificationResult.message}
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<Launch />}
            onClick={() => openInExplorer(verifyAddress)}
            sx={{ mt: 2 }}
          >
            View Verified Contract
          </Button>
        </Box>
      )}
    </Box>
  )

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="contract manager tabs">
              <Tab 
                icon={<Code />} 
                label="Deploy Contracts" 
                id="contract-tab-0"
                aria-controls="contract-tabpanel-0"
              />
              <Tab 
                icon={<Verified />} 
                label="Verify Contracts" 
                id="contract-tab-1"
                aria-controls="contract-tabpanel-1"
              />
            </Tabs>
          </Box>

          {/* Deploy Contracts Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Deploy Smart Contracts
              </Typography>
              <Box>
                <IconButton onClick={refreshData} disabled={isLoading} size="small">
                  {isLoading ? <CircularProgress size={20} /> : <Refresh />}
                </IconButton>
                <IconButton onClick={() => setDeployDialogOpen(true)} size="small">
                  <Add />
                </IconButton>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!wallet || wallet.isLocked ? (
              <Alert severity="warning">
                Please connect and unlock your wallet to deploy contracts.
              </Alert>
            ) : (
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Deploy and manage your smart contracts on the {currentNetwork} network.
                </Typography>

                {deployments.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                    No contracts deployed yet. Click the + button to deploy your first contract.
                  </Typography>
                ) : (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Address</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {deployments.map((deployment) => (
                          <TableRow key={deployment.id}>
                            <TableCell>{deployment.name}</TableCell>
                            <TableCell>
                              {deployment.address.slice(0, 6)}...{deployment.address.slice(-4)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={deployment.verified ? <Verified /> : <Warning />}
                                label={deployment.verified ? 'Verified' : 'Unverified'}
                                color={deployment.verified ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => openInExplorer(deployment.address)} title="View on Explorer">
                                <Launch />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteDeployment(deployment.id)}
                                title="Delete"
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </TabPanel>

          {/* Verify Contracts Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Verify Smart Contracts
              </Typography>
              <Box>
                <IconButton onClick={refreshData} disabled={isLoading} size="small">
                  {isLoading ? <CircularProgress size={20} /> : <Refresh />}
                </IconButton>
                <IconButton onClick={() => setVerifyDialogOpen(true)} size="small">
                  <Verified />
                </IconButton>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Verify your deployed contracts on block explorers for transparency and trust.
              </Typography>

              {deployments.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  No contracts available for verification. Deploy contracts first.
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deployments.map((deployment) => (
                        <TableRow key={deployment.id}>
                          <TableCell>{deployment.name}</TableCell>
                          <TableCell>
                            {deployment.address.slice(0, 6)}...{deployment.address.slice(-4)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={deployment.verified ? <Verified /> : <Code />}
                              label={deployment.verified ? 'Verified' : 'Unverified'}
                              color={deployment.verified ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => openInExplorer(deployment.address)} title="View on Explorer">
                              <Launch />
                            </IconButton>
                            {!deployment.verified && (
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => {
                                  handleDeploymentSelect(deployment)
                                  setVerifyDialogOpen(true)
                                }}
                                title="Verify Contract"
                              >
                                <Verified />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Deploy Contract Dialog */}
      <Dialog open={deployDialogOpen} onClose={handleDeployClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Code sx={{ mr: 1 }} />
            Deploy Smart Contract
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Stepper activeStep={deployStep} sx={{ mb: 3 }}>
            {deploySteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {deployStep === 0 && renderDeployStep0()}
          {deployStep === 1 && renderDeployStep1()}
          {deployStep === 2 && renderDeployStep2()}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleDeployClose}>
            {deployStep === 2 ? 'Close' : 'Cancel'}
          </Button>
          
          {deployStep === 0 && (
            <Button
              onClick={handleCompile}
              disabled={isLoading || !sourceCode.trim()}
              variant="contained"
            >
              {isLoading ? <CircularProgress size={20} /> : 'Compile'}
            </Button>
          )}
          
          {deployStep === 1 && (
            <Button
              onClick={handleDeploy}
              disabled={isLoading || !compilationResult}
              variant="contained"
            >
              {isLoading ? <CircularProgress size={20} /> : 'Deploy'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Verify Contract Dialog */}
      <Dialog open={verifyDialogOpen} onClose={handleVerifyClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Verified sx={{ mr: 1 }} />
            Verify Smart Contract
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Stepper activeStep={verifyStep} sx={{ mb: 3 }}>
            {verifySteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {verifyStep === 0 && renderVerifyStep0()}
          {verifyStep === 1 && renderVerifyStep1()}
          {verifyStep === 2 && renderVerifyStep2()}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleVerifyClose}>
            {verifyStep === 2 ? 'Close' : 'Cancel'}
          </Button>
          
          {verifyStep === 0 && (
            <Button
              onClick={handleCompileAndCompare}
              disabled={isLoading || !verifyAddress || !verifySourceCode || !verifyContractName}
              variant="contained"
            >
              {isLoading ? <CircularProgress size={20} /> : 'Compile & Compare'}
            </Button>
          )}
          
          {verifyStep === 1 && (
            <Button
              onClick={handleVerifyOnExplorer}
              disabled={isLoading}
              variant="contained"
            >
              {isLoading ? <CircularProgress size={20} /> : 'Verify on Explorer'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}

export default React.memo(ContractManager)