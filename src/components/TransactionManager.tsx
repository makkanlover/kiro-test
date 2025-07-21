import React, { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  IconButton,
  Snackbar,
  Chip,
  Tabs,
  Tab
} from '@mui/material'
import {
  Send,
  CallReceived,
  ContentCopy,
  QrCode2
} from '@mui/icons-material'
import { ethers } from 'ethers'
import QRCode from 'qrcode'
import { useWallet } from '../contexts/WalletContext'
import { useBalance } from '../hooks/useBalance'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useI18n } from '../utils/i18n-optimized'
import { ErrorDisplay } from './ErrorDisplay'
import { ERROR_CODES } from '../utils'
import { SendTransactionParams, GasEstimate } from '../types'
import { blockchainService } from '../services/BlockchainService'
import { SUPPORTED_NETWORKS } from '../utils'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transaction-tabpanel-${index}`}
      aria-labelledby={`transaction-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface TransactionManagerProps {
  open: boolean
  onClose: () => void
  initialTab?: 'send' | 'receive'
}

const TransactionManager: React.FC<TransactionManagerProps> = React.memo(({ 
  open, 
  onClose, 
  initialTab = 'send' 
}) => {
  const { wallet, currentNetwork } = useWallet()
  const { balance, refreshBalance } = useBalance()
  const { currentError, handleValidationError, handleTransactionError, clearError } = useErrorHandler()
  const { t } = useI18n()
  
  // Tab management
  const [currentTab, setCurrentTab] = useState(initialTab === 'send' ? 0 : 1)
  
  // Send transaction states
  const [sendStep, setSendStep] = useState(0)
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  
  // Receive transaction states
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [copySuccess, setCopySuccess] = useState(false)
  
  const network = SUPPORTED_NETWORKS[currentNetwork]
  const sendSteps = ['Enter Details', 'Review & Gas', 'Confirm', 'Complete']

  // Reset all states when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSendStep(0)
      setToAddress('')
      setAmount('')
      setGasEstimate(null)
      setPassword('')
      setTxHash(null)
      setIsLoading(false)
      clearError()
      if (currentTab === 1) {
        generateQRCode()
      }
    }
  }, [open, currentTab, clearError])

  // Validation functions
  const validateAddress = useCallback((address: string): boolean => {
    try {
      ethers.getAddress(address)
      return true
    } catch {
      return false
    }
  }, [])

  const validateAmount = useCallback((amount: string): boolean => {
    try {
      const value = parseFloat(amount)
      return value > 0 && value <= parseFloat(balance)
    } catch {
      return false
    }
  }, [balance])

  // Send transaction handlers
  const handleNextStep = useCallback(async () => {
    if (sendStep === 0) {
      // Validate inputs
      if (!validateAddress(toAddress)) {
        handleValidationError(new Error('Invalid recipient address'), ERROR_CODES.INVALID_INPUT)
        return
      }
      
      if (!validateAmount(amount)) {
        handleValidationError(new Error('Invalid amount'), ERROR_CODES.INVALID_INPUT)
        return
      }
      
      setSendStep(1)
      
      // Estimate gas
      try {
        setIsLoading(true)
        const params: SendTransactionParams = {
          to: toAddress,
          value: amount
        }
        const estimate = await blockchainService.estimateGas(params)
        setGasEstimate(estimate)
      } catch (err) {
        handleTransactionError(err, ERROR_CODES.GAS_ESTIMATION_FAILED)
      } finally {
        setIsLoading(false)
      }
    } else if (sendStep === 1) {
      setSendStep(2)
    } else if (sendStep === 2) {
      // Send transaction
      try {
        setIsLoading(true)
        const params: SendTransactionParams = {
          to: toAddress,
          value: amount,
          gasLimit: gasEstimate?.gasLimit,
          gasPrice: gasEstimate?.gasPrice
        }
        const result = await blockchainService.sendTransaction(params.to, params.value)
        const hash = result.hash
        setTxHash(hash)
        setSendStep(3)
        await refreshBalance()
      } catch (err) {
        handleTransactionError(err, ERROR_CODES.TRANSACTION_FAILED)
      } finally {
        setIsLoading(false)
      }
    }
  }, [sendStep, toAddress, amount, password, gasEstimate, validateAddress, validateAmount, handleValidationError, handleTransactionError, refreshBalance])

  const handlePreviousStep = useCallback(() => {
    if (sendStep > 0) {
      setSendStep(sendStep - 1)
    }
  }, [sendStep])

  // Receive transaction handlers
  const generateQRCode = async () => {
    if (!wallet) return

    try {
      const dataUrl = await QRCode.toDataURL(wallet.address, {
        width: 256,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  const copyToClipboard = async () => {
    if (!wallet) return

    try {
      await navigator.clipboard.writeText(wallet.address)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  const handleClose = () => {
    setSendStep(0)
    setToAddress('')
    setAmount('')
    setGasEstimate(null)
    setPassword('')
    setTxHash(null)
    setIsLoading(false)
    clearError()
    onClose()
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
    clearError()
    if (newValue === 1) {
      generateQRCode()
    }
  }

  // Render functions
  const renderSendStep0 = () => (
    <Box>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Current Balance: {balance} ETH
      </Typography>
      <TextField
        fullWidth
        label="Recipient Address"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
        margin="normal"
        placeholder="0x..."
        error={toAddress && !validateAddress(toAddress)}
        helperText={toAddress && !validateAddress(toAddress) ? 'Invalid address format' : ''}
      />
      <TextField
        fullWidth
        label="Amount (ETH)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        margin="normal"
        placeholder="0.0"
        error={amount && !validateAmount(amount)}
        helperText={amount && !validateAmount(amount) ? 'Invalid amount or insufficient balance' : ''}
        inputProps={{ step: '0.000001', min: '0' }}
      />
    </Box>
  )

  const renderSendStep1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Transaction Details</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="textSecondary">To</Typography>
          <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {toAddress}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" color="textSecondary">Amount</Typography>
          <Typography variant="body1">{amount} ETH</Typography>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 1 }}>Estimating gas...</Typography>
        </Box>
      ) : gasEstimate && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Gas Estimate</Typography>
            <Typography variant="body2" color="textSecondary">Gas Limit</Typography>
            <Typography variant="body1">{gasEstimate.gasLimit}</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="textSecondary">Gas Price</Typography>
            <Typography variant="body1">{parseFloat(gasEstimate.gasPrice) / 1e9} Gwei</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="textSecondary">Total Cost</Typography>
            <Typography variant="body1">{gasEstimate.totalCost} ETH</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )

  const renderSendStep2 = () => (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>
        Please confirm this transaction. This action cannot be undone.
      </Alert>
      <TextField
        fullWidth
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        required
      />
    </Box>
  )

  const renderSendStep3 = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Send sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>Transaction Sent!</Typography>
      {txHash && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">Transaction Hash</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {txHash}
          </Typography>
        </Box>
      )}
    </Box>
  )

  const renderReceiveContent = () => (
    <Box sx={{ textAlign: 'center' }}>
      <CallReceived sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Receive {network?.nativeCurrency.symbol || 'ETH'}
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Network: {network?.name || 'Unknown'}
          </Typography>
          <Chip 
            label={`Chain ID: ${network?.chainId || 'Unknown'}`} 
            size="small" 
            sx={{ mb: 2 }} 
          />
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Your Wallet Address:
          </Typography>
          
          <Box sx={{ 
            p: 2, 
            border: '1px solid', 
            borderColor: 'grey.300', 
            borderRadius: 1,
            bgcolor: 'grey.50',
            mb: 2
          }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {wallet?.address}
            </Typography>
          </Box>
          
          <Button
            startIcon={<ContentCopy />}
            onClick={copyToClipboard}
            variant="outlined"
            size="small"
            sx={{ mr: 1 }}
          >
            Copy Address
          </Button>
        </CardContent>
      </Card>

      {qrCodeDataUrl && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              QR Code:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img src={qrCodeDataUrl} alt="Wallet Address QR Code" style={{ maxWidth: '256px' }} />
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Scan this QR code to send {network?.nativeCurrency.symbol || 'ETH'} to your wallet
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab icon={<Send />} label="Send" />
            <Tab icon={<CallReceived />} label="Receive" />
          </Tabs>
        </DialogTitle>
        
        <DialogContent>
          <ErrorDisplay error={currentError} onClose={clearError} />
          
          <TabPanel value={currentTab} index={0}>
            <Stepper activeStep={sendStep} sx={{ mb: 3 }}>
              {sendSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {sendStep === 0 && renderSendStep0()}
            {sendStep === 1 && renderSendStep1()}
            {sendStep === 2 && renderSendStep2()}
            {sendStep === 3 && renderSendStep3()}
          </TabPanel>
          
          <TabPanel value={currentTab} index={1}>
            {renderReceiveContent()}
          </TabPanel>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>
            {sendStep === 3 ? 'Close' : 'Cancel'}
          </Button>
          
          {currentTab === 0 && sendStep < 3 && (
            <>
              {sendStep > 0 && (
                <Button onClick={handlePreviousStep} disabled={isLoading}>
                  Previous
                </Button>
              )}
              <Button
                onClick={handleNextStep}
                disabled={
                  isLoading ||
                  (sendStep === 0 && (!toAddress || !amount || !validateAddress(toAddress) || !validateAmount(amount))) ||
                  (sendStep === 1 && !gasEstimate) ||
                  (sendStep === 2 && !password)
                }
                variant="contained"
              >
                {isLoading ? <CircularProgress size={20} /> : 
                 sendStep === 2 ? 'Send Transaction' : 'Next'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Address copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  )
})

export default TransactionManager