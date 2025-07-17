import React, { useState } from 'react'
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
  Grid,
  Chip
} from '@mui/material'
import {
  Restore,
  Visibility,
  VisibilityOff
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { walletService } from '../services/WalletService'
import { validatePasswordStrength } from '../utils/crypto'
import { validateMnemonic } from 'bip39'

interface WalletRecoveryProps {
  open: boolean
  onClose: () => void
}

const WalletRecovery: React.FC<WalletRecoveryProps> = ({ open, onClose }) => {
  const { connectWallet, isLoading } = useWallet()
  const [step, setStep] = useState(0)
  const [mnemonic, setMnemonic] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(Array(12).fill(''))

  const steps = ['Enter Mnemonic', 'Set New Password', 'Recovery Complete']

  const handleClose = () => {
    setStep(0)
    setMnemonic('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setMnemonicWords(Array(12).fill(''))
    onClose()
  }

  const handleMnemonicChange = (index: number, value: string) => {
    const newWords = [...mnemonicWords]
    newWords[index] = value.toLowerCase().trim()
    setMnemonicWords(newWords)
    setMnemonic(newWords.join(' ').trim())
  }

  const validateMnemonicPhrase = () => {
    const phrase = mnemonic.trim()
    
    if (!phrase) {
      setError('Please enter your mnemonic phrase')
      return false
    }

    const words = phrase.split(/\s+/)
    if (words.length !== 12 && words.length !== 24) {
      setError('Mnemonic phrase must be 12 or 24 words')
      return false
    }

    if (!validateMnemonic(phrase)) {
      setError('Invalid mnemonic phrase. Please check your words and try again.')
      return false
    }

    return true
  }

  const handleMnemonicNext = () => {
    setError(null)
    
    if (!validateMnemonicPhrase()) {
      return
    }

    setStep(1)
  }

  const handlePasswordNext = () => {
    setError(null)

    const validation = validatePasswordStrength(password)
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    handleRecovery()
  }

  const handleRecovery = async () => {
    setError(null)

    try {
      // Recover wallet using the mnemonic and new password
      await walletService.recoverFromMnemonic(mnemonic.trim(), password)
      
      // Connect the recovered wallet
      await connectWallet('recovered_wallet', { mnemonic: mnemonic.trim(), password })
      
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery failed')
    }
  }

  const pasteMnemonicFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const words = text.trim().split(/\s+/)
      
      if (words.length === 12 || words.length === 24) {
        const newWords = [...mnemonicWords]
        words.forEach((word, index) => {
          if (index < newWords.length) {
            newWords[index] = word.toLowerCase()
          }
        })
        setMnemonicWords(newWords)
        setMnemonic(words.join(' '))
      } else {
        setError('Clipboard does not contain a valid mnemonic phrase')
      }
    } catch (err) {
      setError('Failed to read from clipboard')
    }
  }

  const renderMnemonicStep = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Enter your 12-word mnemonic phrase to recover your wallet. Make sure you enter the words in the correct order.
      </Alert>

      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          onClick={pasteMnemonicFromClipboard}
          size="small"
          sx={{ mb: 2 }}
        >
          Paste from Clipboard
        </Button>
      </Box>

      <Grid container spacing={1} sx={{ mb: 3 }}>
        {mnemonicWords.map((word, index) => (
          <Grid item xs={4} key={index}>
            <TextField
              size="small"
              label={`${index + 1}`}
              value={word}
              onChange={(e) => handleMnemonicChange(index, e.target.value)}
              autoComplete="off"
              sx={{ width: '100%' }}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="caption" color="textSecondary">
        Or enter as a single phrase:
      </Typography>
      
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Mnemonic Phrase"
        value={mnemonic}
        onChange={(e) => {
          const phrase = e.target.value
          setMnemonic(phrase)
          const words = phrase.trim().split(/\s+/)
          const newWords = Array(12).fill('')
          words.forEach((word, index) => {
            if (index < 12) {
              newWords[index] = word.toLowerCase()
            }
          })
          setMnemonicWords(newWords)
        }}
        margin="normal"
        placeholder="Enter your 12 or 24 word mnemonic phrase separated by spaces"
        helperText="Your mnemonic phrase should be the words you wrote down when creating your wallet"
      />

      {mnemonic && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="textSecondary">
            Word count: {mnemonic.trim().split(/\s+/).filter(w => w).length}
          </Typography>
        </Box>
      )}
    </Box>
  )

  const renderPasswordStep = () => (
    <Box>
      <Alert severity="warning" sx={{ mb: 3 }}>
        Set a new password for your recovered wallet. This password will be used to encrypt your wallet data.
      </Alert>

      <TextField
        fullWidth
        label="New Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        required
        InputProps={{
          endAdornment: (
            <Button
              onClick={() => setShowPassword(!showPassword)}
              size="small"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </Button>
          )
        }}
      />
      
      <TextField
        fullWidth
        label="Confirm New Password"
        type={showPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        margin="normal"
        required
      />

      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Password must be at least 8 characters with uppercase, lowercase, number, and special character
      </Typography>

      {password && (
        <Box sx={{ mt: 2 }}>
          <Chip
            label={validatePasswordStrength(password).isValid ? 'Strong Password' : 'Weak Password'}
            color={validatePasswordStrength(password).isValid ? 'success' : 'error'}
            size="small"
          />
        </Box>
      )}
    </Box>
  )

  const renderCompleteStep = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Restore sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Wallet Recovered Successfully!
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Your wallet has been recovered and is now ready to use. You can now access your funds and transaction history.
      </Typography>
    </Box>
  )

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Restore sx={{ mr: 1 }} />
          Recover Wallet
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

        {step === 0 && renderMnemonicStep()}
        {step === 1 && renderPasswordStep()}
        {step === 2 && renderCompleteStep()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {step === 2 ? 'Close' : 'Cancel'}
        </Button>
        
        {step === 0 && (
          <Button
            onClick={handleMnemonicNext}
            disabled={!mnemonic.trim()}
            variant="contained"
          >
            Next
          </Button>
        )}
        
        {step === 1 && (
          <Button
            onClick={handlePasswordNext}
            disabled={isLoading || !password || !confirmPassword}
            variant="contained"
          >
            {isLoading ? <CircularProgress size={20} /> : 'Recover Wallet'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default WalletRecovery