import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Chip
} from '@mui/material'
import {
  AddCircle,
  Folder,
  Extension,
  Visibility,
  VisibilityOff,
  QrCode,
  Restore
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { validatePasswordStrength } from '../utils/crypto'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { ErrorDisplay } from './ErrorDisplay'
import { ERROR_CODES } from '../utils/errorHandler'
import WalletRecovery from './WalletRecovery'

const WalletConnection: React.FC = () => {
  const navigate = useNavigate()
  const { wallet, connectWallet, unlockWallet, isLoading } = useWallet()
  const { currentError, handleWalletError, handleValidationError, clearError } = useErrorHandler()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'new' | 'unlock' | 'env' | 'metamask' | 'walletconnect'>('new')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mnemonic, setMnemonic] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [step, setStep] = useState(0)
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false)

  useEffect(() => {
    if (wallet && !wallet.isLocked) {
      navigate('/dashboard')
    }
  }, [wallet, navigate])

  const handleConnectionMethod = useCallback((method: 'new' | 'unlock' | 'env' | 'metamask' | 'walletconnect') => {
    setDialogType(method)
    setDialogOpen(true)
    setStep(0)
    setPassword('')
    setConfirmPassword('')
    setMnemonic('')
    clearError()
  }, [clearError])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
    setPassword('')
    setConfirmPassword('')
    setMnemonic('')
    setStep(0)
  }, [])

  const handleCreateWallet = async () => {
    if (step === 0) {
      // Password validation
      const validation = validatePasswordStrength(password)
      if (!validation.isValid) {
        handleValidationError(
          new Error(validation.errors.join(', ')),
          ERROR_CODES.INVALID_INPUT
        )
        return
      }
      
      if (password !== confirmPassword) {
        handleValidationError(
          new Error('Passwords do not match'),
          ERROR_CODES.INVALID_INPUT
        )
        return
      }
      
      setStep(1)
      
      try {
        const result = await connectWallet('new_wallet', { password })
        setMnemonic(result.mnemonic || '')
        setStep(2)
      } catch (err) {
        handleWalletError(err, ERROR_CODES.WALLET_CREATION_FAILED)
        setStep(0)
      }
    } else if (step === 2) {
      // Mnemonic confirmed
      handleCloseDialog()
    }
  }

  const handleUnlockWallet = async () => {
    try {
      await unlockWallet(password)
      handleCloseDialog()
    } catch (err) {
      handleWalletError(err, ERROR_CODES.WALLET_LOCKED)
    }
  }

  const handleEnvFileLoad = async () => {
    try {
      const envContent = await window.electronAPI.selectEnvFile()
      if (envContent) {
        await connectWallet('env_file', { envContent })
        handleCloseDialog()
      }
    } catch (err) {
      handleWalletError(err, ERROR_CODES.INVALID_PRIVATE_KEY)
    }
  }

  const handleMetaMaskConnect = async () => {
    try {
      await connectWallet('metamask')
      handleCloseDialog()
    } catch (err) {
      handleWalletError(err, ERROR_CODES.WALLET_NOT_FOUND)
    }
  }

  const handleWalletConnectConnect = async () => {
    try {
      await connectWallet('walletconnect')
      handleCloseDialog()
    } catch (err) {
      handleWalletError(err, ERROR_CODES.WALLET_NOT_FOUND)
    }
  }

  const renderNewWalletDialog = () => (
    <>
      <DialogTitle>Create New Wallet</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Set Password</StepLabel>
          </Step>
          <Step>
            <StepLabel>Creating Wallet</StepLabel>
          </Step>
          <Step>
            <StepLabel>Backup Seed</StepLabel>
          </Step>
        </Stepper>
        
        {step === 0 && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Password"
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
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
            />
            <Typography variant="caption" color="textSecondary">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
            </Typography>
          </Box>
        )}
        
        {step === 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {step === 2 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Save this mnemonic phrase in a safe place. You will need it to recover your wallet.
            </Alert>
            <Box sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'grey.300',
              borderRadius: 1,
              bgcolor: 'grey.50'
            }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {showMnemonic ? mnemonic : '••••••••••••••••••••••••••••••••••••••••••••••••'}
              </Typography>
            </Box>
            <Button
              onClick={() => setShowMnemonic(!showMnemonic)}
              size="small"
              sx={{ mt: 1 }}
            >
              {showMnemonic ? 'Hide' : 'Show'} Mnemonic
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button 
          onClick={handleCreateWallet}
          disabled={
            isLoading || 
            (step === 0 && (!password || !confirmPassword || password !== confirmPassword)) ||
            step === 1
          }
        >
          {step === 0 ? 'Create Wallet' : step === 1 ? 'Creating...' : 'I have saved the mnemonic'}
        </Button>
      </DialogActions>
    </>
  )

  const renderUnlockDialog = () => (
    <>
      <DialogTitle>Unlock Wallet</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Password"
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button 
          onClick={handleUnlockWallet}
          disabled={isLoading || !password}
        >
          {isLoading ? 'Unlocking...' : 'Unlock'}
        </Button>
      </DialogActions>
    </>
  )

  const renderEnvDialog = () => (
    <>
      <DialogTitle>Load from Environment File</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Select a .env file containing your PRIVATE_KEY variable
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Make sure your .env file contains: PRIVATE_KEY=your_private_key_here
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button 
          onClick={handleEnvFileLoad}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Select File'}
        </Button>
      </DialogActions>
    </>
  )

  const renderMetaMaskDialog = () => (
    <>
      <DialogTitle>Connect MetaMask</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Connect your MetaMask wallet to continue
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Make sure MetaMask is installed and unlocked
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button 
          onClick={handleMetaMaskConnect}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </Button>
      </DialogActions>
    </>
  )

  const renderWalletConnectDialog = () => (
    <>
      <DialogTitle>Connect WalletConnect</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Connect your mobile wallet using WalletConnect
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          A QR code will appear for you to scan with your mobile wallet
        </Alert>
        <Typography variant="caption" color="textSecondary">
          Supported wallets: MetaMask Mobile, Trust Wallet, Rainbow, Coinbase Wallet, and more
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button 
          onClick={handleWalletConnectConnect}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </Button>
      </DialogActions>
    </>
  )

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ maxWidth: 800, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Welcome to Web3 Wallet
        </Typography>
        
        <ErrorDisplay error={currentError} onClose={clearError} />
        
        {wallet && wallet.isLocked && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Your wallet is locked. Please unlock it to continue.
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <AddCircle sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Create New Wallet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Generate a new wallet with a secure mnemonic phrase
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => handleConnectionMethod('new')}
                  disabled={isLoading}
                >
                  Create Wallet
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Folder sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Load from .env File
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Import wallet from environment variable file
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => handleConnectionMethod('env')}
                  disabled={isLoading}
                >
                  Load Wallet
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Extension sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Connect MetaMask
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Connect your existing MetaMask wallet
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => handleConnectionMethod('metamask')}
                  disabled={isLoading}
                >
                  Connect MetaMask
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <QrCode sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  WalletConnect
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Connect your mobile wallet via QR code
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => handleConnectionMethod('walletconnect')}
                  disabled={isLoading}
                >
                  Connect Mobile Wallet
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Restore sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Recover Wallet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Restore your wallet using mnemonic phrase
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setRecoveryDialogOpen(true)}
                  disabled={isLoading}
                >
                  Recover Wallet
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {wallet && wallet.isLocked && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <Extension sx={{ fontSize: 48, color: 'primary.main' }} />
                    <Chip label="Locked" color="warning" size="small" sx={{ ml: 1 }} />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Unlock Existing Wallet
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Unlock your stored wallet with password
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => handleConnectionMethod('unlock')}
                    disabled={isLoading}
                  >
                    Unlock Wallet
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
        
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          {dialogType === 'new' && renderNewWalletDialog()}
          {dialogType === 'unlock' && renderUnlockDialog()}
          {dialogType === 'env' && renderEnvDialog()}
          {dialogType === 'metamask' && renderMetaMaskDialog()}
          {dialogType === 'walletconnect' && renderWalletConnectDialog()}
        </Dialog>
        
        <WalletRecovery 
          open={recoveryDialogOpen}
          onClose={() => setRecoveryDialogOpen(false)}
        />
      </Box>
    </Box>
  )
}

export default WalletConnection