import React, { useState } from 'react'
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
  VisibilityOff
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { validatePasswordStrength } from '../utils/crypto'

const WalletConnection: React.FC = () => {
  const navigate = useNavigate()
  const { wallet, connectWallet, unlockWallet, isLoading, error, clearError } = useWallet()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'new' | 'unlock' | 'env' | 'metamask'>('new')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mnemonic, setMnemonic] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [step, setStep] = useState(0)

  React.useEffect(() => {
    if (wallet && !wallet.isLocked) {
      navigate('/dashboard')
    }
  }, [wallet, navigate])

  const handleConnectionMethod = (method: 'new' | 'unlock' | 'env' | 'metamask') => {
    setDialogType(method)
    setDialogOpen(true)
    setStep(0)
    setPassword('')
    setConfirmPassword('')
    setMnemonic('')
    clearError()
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setPassword('')
    setConfirmPassword('')
    setMnemonic('')
    setStep(0)
  }

  const handleCreateWallet = async () => {
    if (step === 0) {
      // Password validation
      const validation = validatePasswordStrength(password)
      if (!validation.isValid) {
        return
      }
      
      if (password !== confirmPassword) {
        return
      }
      
      setStep(1)
      
      try {
        const result = await connectWallet('new_wallet', { password })
        setMnemonic(result.mnemonic || '')
        setStep(2)
      } catch (err) {
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
      // Error handled by context
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
      // Error handled by context
    }
  }

  const handleMetaMaskConnect = async () => {
    try {
      await connectWallet('metamask')
      handleCloseDialog()
    } catch (err) {
      // Error handled by context
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

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ maxWidth: 800, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Welcome to Web3 Wallet
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
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
        </Dialog>
      </Box>
    </Box>
  )
}

export default WalletConnection