import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton
} from '@mui/material'
import {
  Send,
  CallReceived,
  Refresh,
  OpenInNew
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { Transaction, TransactionStatus } from '../types'
import { transactionService } from '../services/TransactionService'
import { SUPPORTED_NETWORKS } from '../utils/networks'

interface TransactionHistoryProps {
  open: boolean
  onClose: () => void
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ open, onClose }) => {
  const { wallet, currentNetwork } = useWallet()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const network = SUPPORTED_NETWORKS[currentNetwork]

  useEffect(() => {
    if (open && wallet) {
      loadTransactionHistory()
    }
  }, [open, wallet])

  const loadTransactionHistory = async () => {
    if (!wallet) return

    setIsLoading(true)
    setError(null)

    try {
      const history = await transactionService.getTransactionHistory(wallet.address)
      setTransactions(history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction history')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return 'success'
      case TransactionStatus.FAILED:
        return 'error'
      case TransactionStatus.PENDING:
        return 'warning'
      default:
        return 'default'
    }
  }

  const getTransactionIcon = (tx: Transaction) => {
    if (!wallet) return <Send />
    
    const isSent = tx.from.toLowerCase() === wallet.address.toLowerCase()
    return isSent ? <Send /> : <CallReceived />
  }

  const getTransactionType = (tx: Transaction) => {
    if (!wallet) return 'Unknown'
    
    const isSent = tx.from.toLowerCase() === wallet.address.toLowerCase()
    return isSent ? 'Sent' : 'Received'
  }

  const openInExplorer = (txHash: string) => {
    const explorerUrl = `${network.blockExplorerUrl}/tx/${txHash}`
    window.open(explorerUrl, '_blank')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Transaction History</Typography>
          <IconButton onClick={loadTransactionHistory} disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} /> : <Refresh />}
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading && transactions.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && transactions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="textSecondary">
              No transactions found
            </Typography>
          </Box>
        )}

        {transactions.length > 0 && (
          <List sx={{ width: '100%' }}>
            {transactions.map((tx, index) => (
              <React.Fragment key={tx.hash}>
                <ListItem 
                  sx={{ 
                    px: 0,
                    py: 2,
                    alignItems: 'flex-start'
                  }}
                >
                  <ListItemIcon sx={{ mt: 1 }}>
                    {getTransactionIcon(tx)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1">
                          {getTransactionType(tx)}
                        </Typography>
                        <Chip
                          label={tx.status}
                          color={getStatusColor(tx.status)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Amount: {tx.value} {network.nativeCurrency.symbol}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {getTransactionType(tx) === 'Sent' ? 'To' : 'From'}: {formatAddress(getTransactionType(tx) === 'Sent' ? tx.to : tx.from)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {formatDate(tx.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Typography 
                      variant="body1" 
                      color={getTransactionType(tx) === 'Sent' ? 'error' : 'success'}
                    >
                      {getTransactionType(tx) === 'Sent' ? '-' : '+'}{tx.value} {network.nativeCurrency.symbol}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => openInExplorer(tx.hash)}
                      title="View in explorer"
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
                
                {index < transactions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TransactionHistory