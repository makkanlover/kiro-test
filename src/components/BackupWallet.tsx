import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper
} from '@mui/material'
import {
  Backup,
  Visibility,
  VisibilityOff,
  Warning,
  CheckCircle
} from '@mui/icons-material'
import { decryptData } from '../utils/crypto'

interface BackupWalletProps {
  open: boolean
  onClose: () => void
}

const BackupWallet: React.FC<BackupWalletProps> = ({ open, onClose }) => {
  
  const [step, setStep] = useState(0)
  const [password, setPassword] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [mnemonic, setMnemonic] = useState('')
  const [confirmationWords, setConfirmationWords] = useState<string[]>(['', '', ''])
  const [selectedIndices] = useState<number[]>([2, 5, 8]) // Indices to verify (3rd, 6th, 9th words)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [agreements, setAgreements] = useState({
    savedSecurely: false,
    neverShare: false,
    responsibility: false
  })

  const handlePasswordSubmit = async () => {
    if (!password) {
      setError('Password is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get encrypted mnemonic from storage
      const walletData = await window.electronAPI.store.get('wallet')
      
      if (!walletData || !walletData.mnemonic) {
        setError('No backup data found. This wallet may not have been created with a mnemonic phrase.')
        setIsLoading(false)
        return
      }

      // Decrypt the mnemonic
      const decryptedMnemonic = decryptData(walletData.mnemonic, password)
      setMnemonic(decryptedMnemonic)
      setStep(1)
    } catch (err) {
      setError('Invalid password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowMnemonic = () => {
    setShowMnemonic(true)
    setStep(2)
  }

  const handleVerifyWords = () => {
    const mnemonicWords = mnemonic.split(' ')
    const isValid = selectedIndices.every((index, i) => {
      return confirmationWords[i].trim().toLowerCase() === mnemonicWords[index].toLowerCase()
    })

    if (isValid) {
      setStep(3)
      setError(null)
    } else {
      setError('Verification failed. Please check the words and try again.')
    }
  }

  const handleClose = () => {
    setStep(0)
    setPassword('')
    setShowMnemonic(false)
    setMnemonic('')
    setConfirmationWords(['', '', ''])
    setError(null)
    setAgreements({
      savedSecurely: false,
      neverShare: false,
      responsibility: false
    })
    onClose()
  }

  const allAgreementsChecked = Object.values(agreements).every(Boolean)

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Backup />
          Backup Wallet
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Authentication</StepLabel>
          </Step>
          <Step>
            <StepLabel>Security Warning</StepLabel>
          </Step>
          <Step>
            <StepLabel>Backup Phrase</StepLabel>
          </Step>
          <Step>
            <StepLabel>Verification</StepLabel>
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
            <Typography variant="h6" gutterBottom>
              Enter Password
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Please enter your wallet password to access your backup phrase.
            </Typography>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit()
                }
              }}
            />
          </Box>
        )}

        {step === 1 && (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Warning />
                <Typography variant="h6">
                  IMPORTANT SECURITY WARNINGS
                </Typography>
              </Box>
              <Typography variant="body2" paragraph>
                • Your recovery phrase is the key to your wallet. Anyone with access to it can steal your funds.
              </Typography>
              <Typography variant="body2" paragraph>
                • Never share your recovery phrase with anyone.
              </Typography>
              <Typography variant="body2" paragraph>
                • Store it in a secure, offline location.
              </Typography>
              <Typography variant="body2" paragraph>
                • Write it down on paper and store it in a safe place.
              </Typography>
              <Typography variant="body2">
                • Never store it digitally (screenshots, cloud storage, etc.).
              </Typography>
            </Alert>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreements.savedSecurely}
                  onChange={(e) => setAgreements(prev => ({ ...prev, savedSecurely: e.target.checked }))}
                />
              }
              label="I will save my recovery phrase securely"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreements.neverShare}
                  onChange={(e) => setAgreements(prev => ({ ...prev, neverShare: e.target.checked }))}
                />
              }
              label="I will never share my recovery phrase with anyone"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreements.responsibility}
                  onChange={(e) => setAgreements(prev => ({ ...prev, responsibility: e.target.checked }))}
                />
              }
              label="I understand that I am responsible for keeping my recovery phrase safe"
            />
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Your Recovery Phrase
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Write down these 12 words in order. You will need them to recover your wallet.
            </Typography>
            
            <Paper sx={{ 
              p: 2, 
              mb: 2,
              bgcolor: showMnemonic ? 'grey.50' : 'action.hover',
              border: '2px solid',
              borderColor: 'warning.main'
            }}>
              {!showMnemonic ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <VisibilityOff sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body2" color="textSecondary">
                    Click "Show Phrase" to reveal your recovery phrase
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {mnemonic.split(' ').map((word, index) => (
                    <Grid item xs={6} md={4} key={index}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        p: 1,
                        bgcolor: 'white',
                        border: '1px solid',
                        borderColor: 'grey.300',
                        borderRadius: 1
                      }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mr: 1, minWidth: 20 }}>
                          {index + 1}.
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                          {word}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
            
            {!showMnemonic && (
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Visibility />}
                  onClick={handleShowMnemonic}
                  color="warning"
                >
                  Show Phrase
                </Button>
              </Box>
            )}
          </Box>
        )}

        {step === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Verify Your Recovery Phrase
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Please enter the following words from your recovery phrase to verify you've saved it correctly.
            </Typography>
            
            {selectedIndices.map((wordIndex, i) => (
              <TextField
                key={i}
                fullWidth
                label={`Word ${wordIndex + 1}`}
                value={confirmationWords[i]}
                onChange={(e) => {
                  const newConfirmationWords = [...confirmationWords]
                  newConfirmationWords[i] = e.target.value
                  setConfirmationWords(newConfirmationWords)
                }}
                margin="normal"
                placeholder={`Enter word ${wordIndex + 1}`}
              />
            ))}
          </Box>
        )}

        {step === 4 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Backup Complete!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Your wallet has been successfully backed up. Keep your recovery phrase safe and secure.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          {step === 4 ? 'Close' : 'Cancel'}
        </Button>
        
        {step === 0 && (
          <Button
            onClick={handlePasswordSubmit}
            disabled={!password || isLoading}
            variant="contained"
          >
            {isLoading ? 'Verifying...' : 'Continue'}
          </Button>
        )}
        
        {step === 1 && (
          <Button
            onClick={() => setStep(2)}
            disabled={!allAgreementsChecked}
            variant="contained"
          >
            I Understand
          </Button>
        )}
        
        {step === 2 && showMnemonic && (
          <Button
            onClick={() => setStep(3)}
            variant="contained"
          >
            I've Saved My Phrase
          </Button>
        )}
        
        {step === 3 && (
          <Button
            onClick={handleVerifyWords}
            disabled={confirmationWords.some(word => !word.trim())}
            variant="contained"
          >
            Verify
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default BackupWallet