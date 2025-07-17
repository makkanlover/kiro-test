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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import {
  ExpandMore,
  Code,
  Delete,
  Launch,
  Verified,
  Warning
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { contractService, ContractDeployment, CompilationResult } from '../services/ContractService'
import { formatEther } from 'ethers'

interface ContractDeploymentProps {
  open: boolean
  onClose: () => void
}

const ContractDeploymentComponent: React.FC<ContractDeploymentProps> = ({ open, onClose }) => {
  const { wallet, currentNetwork } = useWallet()
  const [step, setStep] = useState(0)
  const [sourceCode, setSourceCode] = useState('')
  const [contractName, setContractName] = useState('SimpleStorage')
  const [constructorArgs, setConstructorArgs] = useState('')
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null)
  const [deployment, setDeployment] = useState<ContractDeployment | null>(null)
  const [deployments, setDeployments] = useState<ContractDeployment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gasEstimate, setGasEstimate] = useState<string>('')

  const steps = ['Write/Paste Contract', 'Compile', 'Deploy', 'Deployed']

  useEffect(() => {
    loadDeployments()
  }, [currentNetwork])

  useEffect(() => {
    // Load sample contract
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
  }, [])

  const loadDeployments = () => {
    const allDeployments = contractService.getDeploymentsByNetwork(currentNetwork)
    setDeployments(allDeployments)
  }

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
      setStep(1)

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
      setStep(2)
      loadDeployments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep(0)
    setSourceCode('')
    setContractName('SimpleStorage')
    setConstructorArgs('')
    setCompilationResult(null)
    setDeployment(null)
    setError(null)
    setGasEstimate('')
    onClose()
  }

  const handleDeleteDeployment = (id: string) => {
    contractService.deleteDeployment(id)
    loadDeployments()
  }

  const renderStep0 = () => (
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

  const renderStep1 = () => (
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

  const renderStep2 = () => (
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

  const renderDeploymentsList = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Previous Deployments
      </Typography>
      
      {deployments.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          No contracts deployed on {currentNetwork} yet.
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
                    <IconButton size="small" title="View on Explorer">
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
  )

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Code sx={{ mr: 1 }} />
          Deploy Smart Contract
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!wallet || wallet.isLocked ? (
          <Alert severity="warning">
            Please connect and unlock your wallet to deploy contracts.
          </Alert>
        ) : (
          <>
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

            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}

            {renderDeploymentsList()}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {step === 2 ? 'Close' : 'Cancel'}
        </Button>
        
        {step === 0 && (
          <Button
            onClick={handleCompile}
            disabled={isLoading || !sourceCode.trim()}
            variant="contained"
          >
            {isLoading ? <CircularProgress size={20} /> : 'Compile'}
          </Button>
        )}
        
        {step === 1 && (
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
  )
}

export default ContractDeploymentComponent