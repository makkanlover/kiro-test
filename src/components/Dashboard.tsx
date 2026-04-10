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
  Refresh
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { useBalance } from '../hooks/useBalance'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useI18n } from '../utils/i18n-optimized'
import { ErrorDisplay } from './ErrorDisplay'
import { ERROR_CODES } from '../utils'
// Lazy load components to improve initial bundle size
const TransactionManager = lazy(() => import('./TransactionManager'))
const TransactionHistory = lazy(() => import('./TransactionHistory'))
const BalanceManager = lazy(() => import('./BalanceManager'))
const ContractManager = lazy(() => import('./ContractManager'))
const SettingsManager = lazy(() => import('./SettingsManager'))

const Dashboard: React.FC = React.memo(() => {
  const { wallet } = useWallet()
  const { balance, isLoading: balanceLoading, refreshBalance } = useBalance()
  const { currentError, handleNetworkError, clearError } = useErrorHandler()
  const { t } = useI18n()
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<'send' | 'receive'>('send')
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

  if (!wallet || wallet.isLocked) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Alert severity="warning">
          {t('error.walletLocked')}
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
                {t('common.address')}: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
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
                  onClick={() => {
                    setTransactionType('send')
                    setTransactionDialogOpen(true)
                  }}
                >
                  {t('common.send')}
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<CallReceived />}
                  onClick={() => {
                    setTransactionType('receive')
                    setTransactionDialogOpen(true)
                  }}
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
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Suspense fallback={<CircularProgress />}>
            <BalanceManager />
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
          <Suspense fallback={<CircularProgress />}>
            <ContractManager />
          </Suspense>
        </Grid>
        
        <Grid item xs={12}>
          <Suspense fallback={<CircularProgress />}>
            <SettingsManager />
          </Suspense>
        </Grid>
      </Grid>
      
      <Suspense fallback={<CircularProgress />}>
        <TransactionManager 
          open={transactionDialogOpen} 
          onClose={() => setTransactionDialogOpen(false)}
          initialTab={transactionType}
        />
        
        <TransactionHistory 
          open={historyDialogOpen} 
          onClose={() => setHistoryDialogOpen(false)} 
        />
      </Suspense>
    </Box>
  )
})

export default Dashboard