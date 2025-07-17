import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
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
  IconButton
} from '@mui/material'
import {
  ExpandMore,
  Verified,
  Code,
  Launch,
  Compare,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { contractService, ContractDeployment } from '../services/ContractService'
import { contractVerificationService, VerificationRequest, VerificationResult } from '../services/ContractVerificationService'

interface ContractVerificationProps {
  open: boolean
  onClose: () => void
}

const ContractVerification: React.FC<ContractVerificationProps> = ({ open, onClose }) => {
  const { currentNetwork } = useWallet()
  const [step, setStep] = useState(0)
  const [contractAddress, setContractAddress] = useState('')
  const [sourceCode, setSourceCode] = useState('')
  const [contractName, setContractName] = useState('')
  const [compilerVersion, setCompilerVersion] = useState('0.8.19')
  const [optimizationEnabled, setOptimizationEnabled] = useState(true)
  const [optimizationRuns, setOptimizationRuns] = useState(200)
  const [constructorArgs, setConstructorArgs] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [deployments, setDeployments] = useState<ContractDeployment[]>([])
  const [selectedDeployment, setSelectedDeployment] = useState<ContractDeployment | null>(null)
  const [compiledBytecode, setCompiledBytecode] = useState('')
  const [deployedBytecode, setDeployedBytecode] = useState('')
  const [bytecodeMatch, setBytecodeMatch] = useState<boolean | null>(null)

  const steps = ['Contract Details', 'Compile & Compare', 'Verify on Explorer', 'Verification Complete']

  useEffect(() => {
    loadDeployments()
  }, [currentNetwork])

  useEffect(() => {
    // Load sample contract code
    const sampleCode = `// SPDX-License-Identifier: MIT
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
    setSourceCode(sampleCode)
  }, [])

  const loadDeployments = () => {
    const allDeployments = contractService.getDeploymentsByNetwork(currentNetwork)
    setDeployments(allDeployments)
  }

  const handleDeploymentSelect = (deployment: ContractDeployment) => {
    setSelectedDeployment(deployment)
    setContractAddress(deployment.address)
    setContractName(deployment.name)
    if (deployment.sourceCode) {
      setSourceCode(deployment.sourceCode)
    }
  }

  const handleCompileAndCompare = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Compile the source code
      const compilation = await contractService.compileContract(sourceCode, contractName)
      
      if (compilation.errors.length > 0) {
        setError(`Compilation errors: ${compilation.errors.join(', ')}`)
        return
      }

      setCompiledBytecode(compilation.bytecode)

      // Fetch deployed bytecode
      const deployedCode = await contractVerificationService.getBytecodeFromExplorer(
        currentNetwork,
        contractAddress
      )
      setDeployedBytecode(deployedCode)

      // Compare bytecodes
      const match = contractVerificationService.compareBytecode(compilation.bytecode, deployedCode)
      setBytecodeMatch(match)

      setStep(1)
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
        contractAddress,
        sourceCode,
        contractName,
        compilerVersion,
        optimizationEnabled,
        optimizationRuns,
        constructorArguments: constructorArgs
      }

      const result = await contractVerificationService.verifyContract(currentNetwork, request)
      setVerificationResult(result)

      if (result.success) {
        setStep(2)
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

  const handleClose = () => {
    setStep(0)
    setContractAddress('')
    setSourceCode('')
    setContractName('')
    setError(null)
    setVerificationResult(null)
    setSelectedDeployment(null)
    setCompiledBytecode('')
    setDeployedBytecode('')
    setBytecodeMatch(null)
    onClose()
  }

  const openInExplorer = (address: string) => {
    const url = contractVerificationService.getExplorerUrl(currentNetwork, address)
    window.open(url, '_blank')
  }

  const renderContractDetailsStep = () => (
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
        value={contractAddress}
        onChange={(e) => setContractAddress(e.target.value)}
        margin="normal"
        placeholder="0x..."
        helperText="Enter the deployed contract address to verify"
      />

      <TextField
        fullWidth
        label="Contract Name"
        value={contractName}
        onChange={(e) => setContractName(e.target.value)}
        margin="normal"
        helperText="The main contract name (e.g., SimpleStorage)"
      />

      <TextField
        fullWidth
        multiline
        rows={12}
        label="Source Code"
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
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
        value={constructorArgs}
        onChange={(e) => setConstructorArgs(e.target.value)}
        margin="normal"
        placeholder="ABI-encoded constructor arguments"
        helperText="Only needed if the contract has constructor parameters"
      />
    </Box>
  )

  const renderCompileCompareStep = () => (
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

  const renderVerificationResultStep = () => (
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
            onClick={() => openInExplorer(contractAddress)}
            sx={{ mt: 2 }}
          >
            View Verified Contract
          </Button>
        </Box>
      )}
    </Box>
  )

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Verified sx={{ mr: 1 }} />
          Verify Smart Contract
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {steps.map((label) => (
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

        {step === 0 && renderContractDetailsStep()}
        {step === 1 && renderCompileCompareStep()}
        {step === 2 && renderVerificationResultStep()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {step === 2 ? 'Close' : 'Cancel'}
        </Button>
        
        {step === 0 && (
          <Button
            onClick={handleCompileAndCompare}
            disabled={isLoading || !contractAddress || !sourceCode || !contractName}
            variant="contained"
          >
            {isLoading ? <CircularProgress size={20} /> : 'Compile & Compare'}
          </Button>
        )}
        
        {step === 1 && (
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
  )
}

export default ContractVerification