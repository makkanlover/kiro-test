import React, { useState } from 'react'
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
import SendTransaction from './SendTransaction'
import ReceiveTransaction from './ReceiveTransaction'
import TransactionHistory from './TransactionHistory'
import BackupWallet from './BackupWallet'
import TokenBalance from './TokenBalance'

const Dashboard: React.FC = () => {
  const { wallet, error } = useWallet()
  const { balance, isLoading: balanceLoading, error: balanceError, refreshBalance } = useBalance()
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [backupDialogOpen, setBackupDialogOpen] = useState(false)

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
        Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {balanceError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {balanceError}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceWallet sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Balance
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
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  startIcon={<Send />}
                  onClick={() => setSendDialogOpen(true)}
                >
                  Send
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<CallReceived />}
                  onClick={() => setReceiveDialogOpen(true)}
                >
                  Receive
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<History />}
                  onClick={() => setHistoryDialogOpen(true)}
                >
                  History
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Backup />}
                  onClick={() => setBackupDialogOpen(true)}
                >
                  Backup
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TokenBalance />
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <Typography variant="body2" color="textSecondary">
                No transactions yet
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
                  Smart Contracts
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Deploy and verify smart contracts on the blockchain
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined">
                  Deploy Contract
                </Button>
                <Button variant="outlined">
                  Verify Contract
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
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
    </Box>
  )
}

export default Dashboard