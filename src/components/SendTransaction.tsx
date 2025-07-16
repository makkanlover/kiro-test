import React, { useState } from 'react'
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
  Divider
} from '@mui/material'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import { useBalance } from '../hooks/useBalance'
import { SendTransactionParams, GasEstimate } from '../types'
import { transactionService } from '../services/TransactionService'

interface SendTransactionProps {
  open: boolean
  onClose: () => void
}

const SendTransaction: React.FC<SendTransactionProps> = ({ open, onClose }) => {
  const { wallet } = useWallet()
  const { balance, refreshBalance } = useBalance()
  
  const [step, setStep] = useState(0)
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const validateAddress = (address: string): boolean => {
    try {
      ethers.getAddress(address)
      return true
    } catch {
      return false
    }
  }

  const validateAmount = (amount: string): boolean => {
    try {
      const value = parseFloat(amount)
      return value > 0 && value <= parseFloat(balance?.balance || '0')
    } catch {
      return false
    }
  }

  const estimateGas = async () => {
    if (!wallet || !validateAddress(toAddress) || !validateAmount(amount)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params: SendTransactionParams = {
        to: toAddress,
        value: amount
      }
      
      const estimate = await transactionService.estimateGas(params)
      setGasEstimate(estimate)
      setStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate gas')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTransaction = async () => {
    if (!wallet || !gasEstimate) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params: SendTransactionParams = {
        to: toAddress,
        value: amount,
        gasLimit: gasEstimate.gasLimit,
        gasPrice: gasEstimate.gasPrice
      }
      
      const hash = await transactionService.sendTransaction(params, password)
      setTxHash(hash)
      setStep(2)
      
      // Refresh balance after transaction
      setTimeout(() => {
        refreshBalance()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transaction')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep(0)
    setToAddress('')
    setAmount('')
    setGasEstimate(null)
    setPassword('')
    setError(null)
    setTxHash(null)
    onClose()
  }

  const isAddressValid = validateAddress(toAddress)
  const isAmountValid = validateAmount(amount)

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Send Transaction</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Transaction Details</StepLabel>
          </Step>
          <Step>
            <StepLabel>Confirm & Sign</StepLabel>
          </Step>
          <Step>
            <StepLabel>Complete</StepLabel>
          </Step>
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 0 && (
          <Box>
            <TextField
              fullWidth
              label="Recipient Address"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              margin="normal"
              error={toAddress !== '' && !isAddressValid}
              helperText={toAddress !== '' && !isAddressValid ? 'Invalid address format' : ''}
            />
            
            <TextField
              fullWidth
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              margin="normal"
              type="number"
              error={amount !== '' && !isAmountValid}
              helperText={
                amount !== '' && !isAmountValid 
                  ? `Invalid amount. Available: ${balance?.balance || '0'} ${balance?.symbol || 'ETH'}`
                  : ''
              }
            />
            
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              Available Balance: {balance?.balance || '0'} {balance?.symbol || 'ETH'}
            </Typography>
          </Box>
        )}

        {step === 1 && gasEstimate && (
          <Box>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transaction Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>To:</Typography>
                  <Typography sx={{ fontFamily: 'monospace' }}>
                    {toAddress.slice(0, 6)}...{toAddress.slice(-4)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Amount:</Typography>
                  <Typography>{amount} {balance?.symbol || 'ETH'}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Gas Limit:</Typography>
                  <Typography>{gasEstimate.gasLimit}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Gas Price:</Typography>
                  <Typography>{ethers.formatUnits(gasEstimate.gasPrice, 'gwei')} Gwei</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Est. Gas Fee:</Typography>
                  <Typography>{gasEstimate.totalCost} ETH</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1">Total:</Typography>
                  <Typography variant="subtitle1">
                    {(parseFloat(amount) + parseFloat(gasEstimate.totalCost)).toFixed(6)} ETH
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              helperText="Enter your wallet password to sign the transaction"
            />
          </Box>
        )}

        {step === 2 && txHash && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Transaction sent successfully!
            </Alert>
            <Typography variant="body1" gutterBottom>
              Transaction Hash:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace', 
                wordBreak: 'break-all',
                bgcolor: 'grey.100',
                p: 1,
                borderRadius: 1
              }}
            >
              {txHash}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          {step === 2 ? 'Close' : 'Cancel'}
        </Button>
        
        {step === 0 && (
          <Button
            onClick={estimateGas}
            disabled={!isAddressValid || !isAmountValid || isLoading}
            variant="contained"
          >
            {isLoading ? <CircularProgress size={20} /> : 'Next'}
          </Button>
        )}
        
        {step === 1 && (
          <Button
            onClick={sendTransaction}
            disabled={!password || isLoading}
            variant="contained"
          >
            {isLoading ? <CircularProgress size={20} /> : 'Send Transaction'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default SendTransaction