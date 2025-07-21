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
  Chip,
  Tabs,
  Tab
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
import { validatePasswordStrength } from '../utils'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { ErrorDisplay } from './ErrorDisplay'
import { ERROR_CODES } from '../utils'
import { useI18n } from '../utils/i18n-optimized'
import { walletService } from '../services/WalletService'
import { validateMnemonic } from 'bip39'
import { walletConnectService } from '../services/WalletConnectService'

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
      id={`wallet-tabpanel-${index}`}
      aria-labelledby={`wallet-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const WalletManager: React.FC = () => {
  const navigate = useNavigate()
  const { wallet, connectWallet, unlockWallet, isLoading } = useWallet()
  const { currentError, handleWalletError, handleValidationError, clearError } = useErrorHandler()
  const { t } = useI18n()
  
  // Connection states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'new' | 'unlock' | 'env' | 'metamask' | 'walletconnect' | 'recovery' | 'walletconnect_diagnostic'>('new')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mnemonic, setMnemonic] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [step, setStep] = useState(0)
  
  // Recovery states
  const [recoveryTab, setRecoveryTab] = useState(0)
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(Array(12).fill(''))
  const [error, setError] = useState<string | null>(null)
  
  // WalletConnect diagnostic states
  const [wcDiagnostics, setWcDiagnostics] = useState<any>(null)
  const [wcTestResult, setWcTestResult] = useState<any>(null)
  const [wcDiagnosticLoading, setWcDiagnosticLoading] = useState(false)

  useEffect(() => {
    if (wallet && !wallet.isLocked) {
      navigate('/dashboard')
    }
  }, [wallet, navigate])

  const handleConnectionMethod = useCallback((method: 'new' | 'unlock' | 'env' | 'metamask' | 'walletconnect' | 'recovery' | 'walletconnect_diagnostic') => {
    setDialogType(method)
    setDialogOpen(true)
    setStep(0)
    setPassword('')
    setConfirmPassword('')
    setMnemonic('')
    setError(null)
    setMnemonicWords(Array(12).fill(''))
    setRecoveryTab(0)
    setWcDiagnostics(null)
    setWcTestResult(null)
    setWcDiagnosticLoading(false)
    clearError()
  }, [clearError])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
    setPassword('')
    setConfirmPassword('')
    setMnemonic('')
    setStep(0)
    setError(null)
    setMnemonicWords(Array(12).fill(''))
    setRecoveryTab(0)
  }, [])

  // New wallet creation logic
  const handleCreateWallet = async () => {
    if (step === 0) {
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
      handleCloseDialog()
    }
  }

  // Unlock wallet logic
  const handleUnlockWallet = async () => {
    try {
      await unlockWallet(password)
      handleCloseDialog()
    } catch (err) {
      handleWalletError(err, ERROR_CODES.WALLET_LOCKED)
    }
  }

  // Env file load logic
  const handleEnvFileLoad = async () => {
    try {
      await connectWallet('env_file', {})
      handleCloseDialog()
    } catch (err) {
      handleWalletError(err, ERROR_CODES.INVALID_PRIVATE_KEY)
    }
  }

  // MetaMask connection logic
  const handleMetaMaskConnect = async () => {
    try {
      await connectWallet('metamask')
      handleCloseDialog()
    } catch (err) {
      handleWalletError(err, ERROR_CODES.WALLET_NOT_FOUND)
    }
  }

  // WalletConnect logic
  const handleWalletConnectConnect = async () => {
    try {
      await connectWallet('walletconnect')
      handleCloseDialog()
    } catch (err) {
      handleWalletError(err, ERROR_CODES.WALLET_NOT_FOUND)
    }
  }

  // WalletConnect diagnostic functions
  const runWalletConnectDiagnostic = async () => {
    setWcDiagnosticLoading(true)
    try {
      const diagnostics = await walletConnectService.runDiagnostics()
      setWcDiagnostics(diagnostics)
      
      // Also run transaction test if session exists
      if (diagnostics.sessionStatus) {
        const testResult = await walletConnectService.testTransactionFlow()
        setWcTestResult(testResult)
      }
    } catch (error) {
      setError('診断実行中にエラーが発生しました: ' + error.message)
    } finally {
      setWcDiagnosticLoading(false)
    }
  }

  // Recovery logic
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

    setRecoveryTab(1)
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
      await walletService.recoverFromMnemonic(mnemonic.trim(), password)
      await connectWallet('recovered_wallet', { mnemonic: mnemonic.trim(), password })
      setRecoveryTab(2)
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

  // Dialog render functions
  const renderNewWalletDialog = () => (
    <>
      <DialogTitle>Create New Wallet</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step><StepLabel>Set Password</StepLabel></Step>
          <Step><StepLabel>Creating Wallet</StepLabel></Step>
          <Step><StepLabel>Backup Seed</StepLabel></Step>
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
                  <Button onClick={() => setShowPassword(!showPassword)} size="small">
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
            <Button onClick={() => setShowMnemonic(!showMnemonic)} size="small" sx={{ mt: 1 }}>
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

  const renderRecoveryDialog = () => (
    <>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Restore sx={{ mr: 1 }} />
          Recover Wallet
        </Box>
      </DialogTitle>
      <DialogContent>
        <Tabs value={recoveryTab} onChange={(_, newValue) => setRecoveryTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Enter Mnemonic" />
          <Tab label="Set Password" disabled={recoveryTab < 1} />
          <Tab label="Complete" disabled={recoveryTab < 2} />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TabPanel value={recoveryTab} index={0}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Enter your 12-word mnemonic phrase to recover your wallet.
          </Alert>
          <Button variant="outlined" onClick={pasteMnemonicFromClipboard} size="small" sx={{ mb: 2 }}>
            Paste from Clipboard
          </Button>
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
            placeholder="Enter your 12 or 24 word mnemonic phrase"
          />
        </TabPanel>

        <TabPanel value={recoveryTab} index={1}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Set a new password for your recovered wallet.
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
                <Button onClick={() => setShowPassword(!showPassword)} size="small">
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
          {password && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={validatePasswordStrength(password).isValid ? 'Strong Password' : 'Weak Password'}
                color={validatePasswordStrength(password).isValid ? 'success' : 'error'}
                size="small"
              />
            </Box>
          )}
        </TabPanel>

        <TabPanel value={recoveryTab} index={2}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Restore sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Wallet Recovered Successfully!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Your wallet has been recovered and is now ready to use.
            </Typography>
          </Box>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>
          {recoveryTab === 2 ? 'Close' : 'Cancel'}
        </Button>
        {recoveryTab === 0 && (
          <Button onClick={handleMnemonicNext} disabled={!mnemonic.trim()} variant="contained">
            Next
          </Button>
        )}
        {recoveryTab === 1 && (
          <Button onClick={handlePasswordNext} disabled={isLoading || !password || !confirmPassword} variant="contained">
            {isLoading ? <CircularProgress size={20} /> : 'Recover Wallet'}
          </Button>
        )}
      </DialogActions>
    </>
  )

  const renderSimpleDialog = (title: string, content: React.ReactNode, action: () => void, actionText: string) => (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={action} disabled={isLoading}>
          {isLoading ? 'Connecting...' : actionText}
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
        <Button 
          variant="outlined" 
          onClick={() => handleConnectionMethod('walletconnect_diagnostic')}
          sx={{ mt: 1 }}
        >
          WalletConnect診断を実行
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleWalletConnectConnect} disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect'}
        </Button>
      </DialogActions>
    </>
  )

  const renderWalletConnectDiagnosticDialog = () => (
    <>
      <DialogTitle>WalletConnect 診断</DialogTitle>
      <DialogContent sx={{ minWidth: 500 }}>
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="contained" 
            onClick={runWalletConnectDiagnostic}
            disabled={wcDiagnosticLoading}
            startIcon={wcDiagnosticLoading ? <CircularProgress size={20} /> : null}
          >
            {wcDiagnosticLoading ? '診断実行中...' : '診断を開始'}
          </Button>
        </Box>

        {wcDiagnostics && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>診断結果</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label={wcDiagnostics.signClientStatus ? 'OK' : 'NG'} 
                    color={wcDiagnostics.signClientStatus ? 'success' : 'error'} 
                    size="small" 
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">SignClient</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label={wcDiagnostics.modalStatus ? 'OK' : 'NG'} 
                    color={wcDiagnostics.modalStatus ? 'success' : 'error'} 
                    size="small" 
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">Modal</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label={wcDiagnostics.sessionStatus ? 'OK' : 'NG'} 
                    color={wcDiagnostics.sessionStatus ? 'success' : 'error'} 
                    size="small" 
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">Session</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label={wcDiagnostics.networkConnectivity ? 'OK' : 'NG'} 
                    color={wcDiagnostics.networkConnectivity ? 'success' : 'error'} 
                    size="small" 
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">Network</Typography>
                </Box>
              </Grid>
            </Grid>

            {wcDiagnostics.recommendations.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">推奨事項:</Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {wcDiagnostics.recommendations.map((rec, index) => (
                    <li key={index}>
                      <Typography variant="body2">{rec}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            <Typography variant="body2" sx={{ mt: 2 }}>
              <strong>対応ウォレット:</strong> {wcDiagnostics.supportedWallets.join(', ')}
            </Typography>
          </Box>
        )}

        {wcTestResult && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>機能テスト結果</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>応答時間:</strong> {wcTestResult.latency}ms
            </Typography>
            
            {wcTestResult.errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <Typography variant="subtitle2">エラー:</Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {wcTestResult.errors.map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">{error}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>閉じる</Button>
      </DialogActions>
    </>
  )

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ maxWidth: 800, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {t('wallet.welcome')}
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
                  {t('wallet.createNew')}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  {t('wallet.createNewDesc')}
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
                  onClick={() => handleConnectionMethod('recovery')}
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
          {dialogType === 'recovery' && renderRecoveryDialog()}
          {dialogType === 'unlock' && renderSimpleDialog(
            'Unlock Wallet',
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
                  <Button onClick={() => setShowPassword(!showPassword)} size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </Button>
                )
              }}
            />,
            handleUnlockWallet,
            'Unlock'
          )}
          {dialogType === 'env' && renderSimpleDialog(
            'Load from Environment File',
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Load wallet from .env file in the project root
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Make sure your .env file contains: PRIVATE_KEY=your_private_key_here
              </Alert>
            </Box>,
            handleEnvFileLoad,
            'Load Wallet'
          )}
          {dialogType === 'metamask' && renderSimpleDialog(
            'Connect MetaMask',
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Connect your MetaMask wallet to continue
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Make sure MetaMask is installed and unlocked
              </Alert>
            </Box>,
            handleMetaMaskConnect,
            'Connect'
          )}
          {dialogType === 'walletconnect' && renderWalletConnectDialog()}
          {dialogType === 'walletconnect_diagnostic' && renderWalletConnectDiagnosticDialog()}
        </Dialog>
      </Box>
    </Box>
  )
}

export default React.memo(WalletManager)