import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  IconButton,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material'
import {
  Send,
  CallReceived,
  Refresh,
  OpenInNew,
  FilterList,
  Search
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { Transaction, TransactionStatus } from '../types'
import { blockchainService } from '../services/BlockchainService'
import { SUPPORTED_NETWORKS } from '../utils'

interface TransactionHistoryProps {
  open: boolean
  onClose: () => void
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ open, onClose }) => {
  const { wallet, currentNetwork } = useWallet()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const network = SUPPORTED_NETWORKS[currentNetwork]

  useEffect(() => {
    if (open && wallet) {
      loadTransactionHistory()
    }
  }, [open, wallet, currentNetwork])

  useEffect(() => {
    setTransactions(paginatedTransactions)
  }, [paginatedTransactions])

  const loadTransactionHistory = async () => {
    if (!wallet) return

    setIsLoading(true)
    setError(null)

    try {
      const history = await blockchainService.getTransactionHistory(wallet.address)
      setAllTransactions(history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction history')
    } finally {
      setIsLoading(false)
    }
  }

  // Memoized filtered transactions for performance
  const filteredTransactions = useMemo(() => {
    let filtered = [...allTransactions]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (filter !== 'all' && wallet) {
      filtered = filtered.filter(tx => {
        const isSent = tx.from.toLowerCase() === wallet.address.toLowerCase()
        return filter === 'sent' ? isSent : !isSent
      })
    }

    return filtered
  }, [allTransactions, searchQuery, filter, wallet])

  // Memoized paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredTransactions.slice(startIndex, endIndex)
  }, [filteredTransactions, page, itemsPerPage])

  const applyFiltersAndPagination = () => {
    setTransactions(paginatedTransactions)
  }

  const getTotalPages = useMemo(() => {
    return Math.ceil(filteredTransactions.length / itemsPerPage)
  }, [filteredTransactions.length, itemsPerPage])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const handleItemsPerPageChange = (event: any) => {
    setItemsPerPage(event.target.value)
    setPage(1)
  }

  const handleFilterChange = (event: any) => {
    setFilter(event.target.value)
    setPage(1)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setPage(1)
  }

  const refreshTransactions = () => {
    setPage(1)
    setSearchQuery('')
    setFilter('all')
    loadTransactionHistory()
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
          <IconButton onClick={refreshTransactions} disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} /> : <Refresh />}
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Search and Filter Controls */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search by hash or address..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 300, flexGrow: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filter}
                label="Filter"
                onChange={handleFilterChange}
                startAdornment={<FilterList sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="received">Received</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Per Page</InputLabel>
              <Select
                value={itemsPerPage}
                label="Per Page"
                onChange={handleItemsPerPageChange}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Typography variant="caption" color="textSecondary">
            Showing {transactions.length} of {allTransactions.length} transactions
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading && allTransactions.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && allTransactions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="textSecondary">
              No transactions found
            </Typography>
          </Box>
        )}

        {!isLoading && allTransactions.length > 0 && transactions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="textSecondary">
              No transactions match your search criteria
            </Typography>
          </Box>
        )}

        {isLoading && allTransactions.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption">Loading more...</Typography>
            </Box>
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

        {/* Pagination */}
        {allTransactions.length > itemsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={getTotalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
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

export default React.memo(TransactionHistory)