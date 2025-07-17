import React, { useState, lazy, Suspense } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material'
import {
  AccountBalanceWallet,
  Send,
  CallReceived,
  History,
  Backup,
  Code,
  Refresh
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { useBalance } from '../hooks/useBalance'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useI18n } from '../contexts/I18nContext'
import { ErrorDisplay } from './ErrorDisplay'
import { ERROR_CODES } from '../utils/errorHandler'
// Lazy load components to improve initial bundle size
const SendTransaction = lazy(() => import('./SendTransaction'))
const ReceiveTransaction = lazy(() => import('./ReceiveTransaction'))
const TransactionHistory = lazy(() => import('./TransactionHistory'))
const BackupWallet = lazy(() => import('./BackupWallet'))
const TokenBalance = lazy(() => import('./TokenBalance'))
const ContractDeployment = lazy(() => import('./ContractDeployment'))
const ContractVerification = lazy(() => import('./ContractVerification'))

const Dashboard: React.FC = React.memo(() => {
  const { wallet } = useWallet()
  const { balance, isLoading: balanceLoading, refreshBalance } = useBalance()
  const { currentError, handleNetworkError, clearError } = useErrorHandler()
  const { t } = useI18n()
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [backupDialogOpen, setBackupDialogOpen] = useState(false)
  const [deployDialogOpen, setDeployDialogOpen] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)

  if (!wallet || wallet.isLocked) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Alert severity="warning">
          Please connect or unlock your wallet to access the dashboard
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('dashboard.title')}
      </Typography>
      
      <ErrorDisplay error={currentError} onClose={clearError} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceWallet sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {t('common.balance')}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={refreshBalance} 
                  disabled={balanceLoading}
                  size="small"
                >
                  {balanceLoading ? <CircularProgress size={20} /> : <Refresh />}
                </IconButton>
              </Box>
              <Typography variant="h4" color="primary">
                {balance ? `${parseFloat(balance.balance).toFixed(4)} ${balance.symbol}` : '0.00 ETH'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {balance?.usdValue ? `$${balance.usdValue.toFixed(2)} USD` : '$0.00 USD'}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                Address: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.quickActions')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  startIcon={<Send />}
                  onClick={() => setSendDialogOpen(true)}
                >
                  {t('common.send')}
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<CallReceived />}
                  onClick={() => setReceiveDialogOpen(true)}
                >
                  {t('common.receive')}
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<History />}
                  onClick={() => setHistoryDialogOpen(true)}
                >
                  {t('common.history')}
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Backup />}
                  onClick={() => setBackupDialogOpen(true)}
                >
                  {t('common.backup')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Suspense fallback={<CircularProgress />}>
            <TokenBalance />
          </Suspense>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.recentTransactions')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('dashboard.noTransactions')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Code sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {t('dashboard.smartContracts')}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {t('dashboard.contractDesc')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined"
                  onClick={() => setDeployDialogOpen(true)}
                >
                  {t('dashboard.contractDeploy')}
                </Button>
                <Button 
                  variant="outlined"
                  onClick={() => setVerifyDialogOpen(true)}
                >
                  {t('dashboard.contractVerify')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Suspense fallback={<CircularProgress />}>
        <SendTransaction 
          open={sendDialogOpen} 
          onClose={() => setSendDialogOpen(false)} 
        />
        
        <ReceiveTransaction 
          open={receiveDialogOpen} 
          onClose={() => setReceiveDialogOpen(false)} 
        />
        
        <TransactionHistory 
          open={historyDialogOpen} 
          onClose={() => setHistoryDialogOpen(false)} 
        />
        
        <BackupWallet 
          open={backupDialogOpen} 
          onClose={() => setBackupDialogOpen(false)} 
        />
        
        <ContractDeployment 
          open={deployDialogOpen} 
          onClose={() => setDeployDialogOpen(false)} 
        />
        
        <ContractVerification 
          open={verifyDialogOpen} 
          onClose={() => setVerifyDialogOpen(false)} 
        />
      </Suspense>
    </Box>
  )
})

export default Dashboard