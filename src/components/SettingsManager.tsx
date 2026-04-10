import React, { useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  Divider,
  IconButton
} from '@mui/material'
import {
  Settings,
  Backup,
  Language as LanguageIcon,
  Security,
  Info,
  Visibility,
  VisibilityOff,
  Warning,
  CheckCircle,
  Download,
  Refresh
} from '@mui/icons-material'
import { useI18n, Language } from '../utils/i18n-optimized'
import { useWallet } from '../contexts/WalletContext'
import { decryptData } from '../utils'

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

const SettingsManager: React.FC = () => {
  const { language, setLanguage, t } = useI18n()
  const { wallet } = useWallet()
  
  // Common state
  const [activeTab, setActiveTab] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // Backup state
  const [backupDialogOpen, setBackupDialogOpen] = useState(false)
  const [backupStep, setBackupStep] = useState(0)
  const [password, setPassword] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [mnemonic, setMnemonic] = useState('')
  const [confirmationWords, setConfirmationWords] = useState<string[]>(['', '', ''])
  const [selectedIndices] = useState<number[]>([2, 5, 8]) // Indices to verify (3rd, 6th, 9th words)
  const [isLoading, setIsLoading] = useState(false)
  const [agreements, setAgreements] = useState({
    savedSecurely: false,
    neverShare: false,
    responsibility: false
  })

  // Settings state
  const [autoLockEnabled, setAutoLockEnabled] = useState(true)
  const [autoLockMinutes, setAutoLockMinutes] = useState(15)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const backupSteps = ['Security Warning', 'Verify Password', 'Backup Phrase', 'Confirmation']

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setError(null)
  }

  // Language functions
  const getLanguageLabel = (lang: Language): string => {
    switch (lang) {
      case Language.EN:
        return 'English'
      case Language.JA:
        return '日本語'
      default:
        return 'English'
    }
  }

  const getLanguageFlag = (lang: Language): string => {
    switch (lang) {
      case Language.EN:
        return '🇺🇸'
      case Language.JA:
        return '🇯🇵'
      default:
        return '🇺🇸'
    }
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  // Backup functions
  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const encryptedData = localStorage.getItem('wallet_data')
      if (!encryptedData) {
        throw new Error('No wallet data found')
      }

      const decryptedData = await decryptData(encryptedData, password)
      const walletData = JSON.parse(decryptedData)
      
      if (walletData.mnemonic) {
        setMnemonic(walletData.mnemonic)
        setBackupStep(2)
      } else {
        throw new Error('No mnemonic found in wallet data')
      }
    } catch (err) {
      setError('Invalid password or corrupted wallet data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmation = () => {
    const mnemonicWords = mnemonic.split(' ')
    const isValid = selectedIndices.every((index, i) => 
      confirmationWords[i].toLowerCase().trim() === mnemonicWords[index].toLowerCase()
    )

    if (!isValid) {
      setError('Confirmation words do not match. Please try again.')
      return
    }

    setBackupStep(3)
    setError(null)
  }

  const handleBackupClose = () => {
    setBackupStep(0)
    setPassword('')
    setMnemonic('')
    setShowMnemonic(false)
    setConfirmationWords(['', '', ''])
    setError(null)
    setAgreements({
      savedSecurely: false,
      neverShare: false,
      responsibility: false
    })
    setBackupDialogOpen(false)
  }

  const downloadBackupFile = () => {
    const backupData = {
      mnemonic,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    
    const dataStr = JSON.stringify(backupData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `wallet-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic)
      // Could show a success message here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  // Render backup dialog steps
  const renderBackupStep0 = () => (
    <Box>
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
          Important Security Notice
        </Typography>
        <Typography variant="body2" paragraph>
          Your recovery phrase is the master key to your wallet. Anyone with access to it can control your funds.
        </Typography>
        <Typography variant="body2" paragraph>
          Please ensure you:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Write it down on paper and store it securely</li>
          <li>Never share it with anyone</li>
          <li>Never store it digitally (screenshots, cloud storage, etc.)</li>
          <li>Keep multiple copies in different secure locations</li>
        </ul>
      </Alert>

      <Box sx={{ mt: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={agreements.savedSecurely}
              onChange={(e) => setAgreements(prev => ({ ...prev, savedSecurely: e.target.checked }))}
            />
          }
          label="I will save my recovery phrase securely offline"
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
          label="I understand that I am solely responsible for keeping my recovery phrase safe"
        />
      </Box>
    </Box>
  )

  const renderBackupStep1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Verify Your Password
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Enter your wallet password to access your recovery phrase.
      </Typography>
      
      <TextField
        fullWidth
        type="password"
        label="Wallet Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        autoFocus
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handlePasswordSubmit()
          }
        }}
      />
    </Box>
  )

  const renderBackupStep2 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Recovery Phrase
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Write down these 12 words in the exact order shown. This phrase will allow you to recover your wallet.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2">Recovery Phrase</Typography>
          <IconButton
            size="small"
            onClick={() => setShowMnemonic(!showMnemonic)}
          >
            {showMnemonic ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </Box>
        
        {showMnemonic ? (
          <Grid container spacing={1}>
            {mnemonic.split(' ').map((word, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'white' }}>
                  <Typography variant="caption" color="textSecondary">
                    {index + 1}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {word}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="textSecondary">
            Click the eye icon to reveal your recovery phrase
          </Typography>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button variant="outlined" startIcon={<Download />} onClick={downloadBackupFile}>
          Download Backup
        </Button>
        <Button variant="outlined" onClick={copyToClipboard}>
          Copy to Clipboard
        </Button>
      </Box>
    </Box>
  )

  const renderBackupStep3 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confirm Your Recovery Phrase
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        To ensure you've correctly saved your recovery phrase, please enter the following words:
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {selectedIndices.map((wordIndex, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <TextField
              fullWidth
              label={`Word ${wordIndex + 1}`}
              value={confirmationWords[index]}
              onChange={(e) => {
                const newWords = [...confirmationWords]
                newWords[index] = e.target.value
                setConfirmationWords(newWords)
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const renderBackupStep4 = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Backup Complete!
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Your wallet has been successfully backed up. Keep your recovery phrase safe and secure.
      </Typography>
    </Box>
  )

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="settings manager tabs">
              <Tab 
                icon={<Settings />} 
                label="General Settings" 
                id="settings-tab-0"
                aria-controls="settings-tabpanel-0"
              />
              <Tab 
                icon={<LanguageIcon />} 
                label="Language" 
                id="settings-tab-1"
                aria-controls="settings-tabpanel-1"
              />
              <Tab 
                icon={<Security />} 
                label="Security & Backup" 
                id="settings-tab-2"
                aria-controls="settings-tabpanel-2"
              />
            </Tabs>
          </Box>

          {/* General Settings Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="Auto Lock"
                    secondary="Automatically lock wallet after inactivity"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={autoLockEnabled}
                      onChange={(e) => setAutoLockEnabled(e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                {autoLockEnabled && (
                  <ListItem sx={{ pl: 7 }}>
                    <ListItemText
                      primary={`Lock after ${autoLockMinutes} minutes`}
                      secondary="Adjust auto-lock timeout"
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => setAutoLockMinutes(Math.max(5, autoLockMinutes - 5))}
                        >
                          -5
                        </Button>
                        <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
                          {autoLockMinutes}m
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => setAutoLockMinutes(Math.min(60, autoLockMinutes + 5))}
                        >
                          +5
                        </Button>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                )}

                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <Info />
                  </ListItemIcon>
                  <ListItemText
                    primary="Sound Effects"
                    secondary="Play sounds for notifications and confirmations"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Info />
                  </ListItemIcon>
                  <ListItemText
                    primary="Push Notifications"
                    secondary="Receive notifications for transactions and events"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Box>
          </TabPanel>

          {/* Language Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Language Settings
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Choose your preferred language for the application interface.
              </Typography>

              <List>
                {Object.values(Language).map((lang) => (
                  <ListItem 
                    key={lang}
                    button
                    selected={lang === language}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    <ListItemIcon>
                      <Typography sx={{ fontSize: '1.5rem' }}>
                        {getLanguageFlag(lang)}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={getLanguageLabel(lang)}
                      secondary={lang === language ? 'Current language' : 'Switch to this language'}
                    />
                    {lang === language && (
                      <ListItemSecondaryAction>
                        <CheckCircle color="primary" />
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>
          </TabPanel>

          {/* Security & Backup Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Security & Backup
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {!wallet || wallet.isLocked ? (
                <Alert severity="warning">
                  Please connect and unlock your wallet to access backup features.
                </Alert>
              ) : (
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Backup />
                    </ListItemIcon>
                    <ListItemText
                      primary="Backup Wallet"
                      secondary="Export your recovery phrase to restore your wallet"
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        onClick={() => setBackupDialogOpen(true)}
                        startIcon={<Backup />}
                      >
                        Create Backup
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>

                  <Divider />

                  <ListItem>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText
                      primary="Security Status"
                      secondary="Your wallet is encrypted and secure"
                    />
                    <ListItemSecondaryAction>
                      <CheckCircle color="success" />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              )}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onClose={handleBackupClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Backup sx={{ mr: 1 }} />
            Backup Wallet
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Stepper activeStep={backupStep} sx={{ mb: 3 }}>
            {backupSteps.map((label) => (
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

          {backupStep === 0 && renderBackupStep0()}
          {backupStep === 1 && renderBackupStep1()}
          {backupStep === 2 && renderBackupStep2()}
          {backupStep === 3 && renderBackupStep3()}
          {backupStep === 4 && renderBackupStep4()}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleBackupClose}>
            {backupStep === 4 ? 'Close' : 'Cancel'}
          </Button>
          
          {backupStep === 0 && (
            <Button
              onClick={() => setBackupStep(1)}
              disabled={!agreements.savedSecurely || !agreements.neverShare || !agreements.responsibility}
              variant="contained"
            >
              I Understand
            </Button>
          )}
          
          {backupStep === 1 && (
            <Button
              onClick={handlePasswordSubmit}
              disabled={isLoading || !password.trim()}
              variant="contained"
            >
              {isLoading ? 'Verifying...' : 'Continue'}
            </Button>
          )}
          
          {backupStep === 2 && (
            <Button
              onClick={() => setBackupStep(3)}
              disabled={!showMnemonic}
              variant="contained"
            >
              I've Saved It
            </Button>
          )}
          
          {backupStep === 3 && (
            <Button
              onClick={handleConfirmation}
              disabled={confirmationWords.some(word => !word.trim())}
              variant="contained"
            >
              Verify
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}

export default React.memo(SettingsManager)