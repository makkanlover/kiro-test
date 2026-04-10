import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Divider,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Token,
  Add,
  Refresh,
  Delete,
  History,
  AccountBalance,
  Send,
  CallReceived,
  OpenInNew,
  FilterList,
  Search
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { blockchainService } from '../services/BlockchainService'
import { walletService } from '../services/WalletService'
import { Transaction, TransactionStatus } from '../types'
import { SUPPORTED_NETWORKS } from '../utils'

interface TokenInfo {
  address: string
  symbol: string
  balance: string
  decimals: number
}

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
      id={`balance-tabpanel-${index}`}
      aria-labelledby={`balance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

const BalanceManager: React.FC = () => {
  const { wallet, currentNetwork } = useWallet()
  
  // Common state
  const [activeTab, setActiveTab] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Token balance state
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [addingToken, setAddingToken] = useState(false)
  
  // Transaction history state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const network = SUPPORTED_NETWORKS[currentNetwork]

  // Default tokens for different networks - memoized for performance
  const defaultTokens = useMemo(() => ({
    sepolia: [
      {
        address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
        symbol: 'LINK',
        name: 'Chainlink Token'
      }
    ],
    amoy: [
      {
        address: '0x0Fa8781a83E46826621b3BC094Ea2A0212e71B23',
        symbol: 'USDC',
        name: 'USD Coin'
      }
    ]
  }), [])

  useEffect(() => {
    if (wallet && !wallet.isLocked) {
      if (activeTab === 0) {
        loadTokenBalances()
      } else if (activeTab === 1) {
        loadTransactionHistory()
      }
    }
  }, [wallet, currentNetwork, activeTab])

  useEffect(() => {
    if (activeTab === 1) {
      applyFiltersAndPagination()
    }
  }, [allTransactions, filter, searchQuery, page, itemsPerPage, activeTab])

  // Token Balance Functions
  const loadTokenBalances = async () => {
    if (!wallet) return

    setIsLoading(true)
    setError(null)

    try {
      const provider = walletService.getProvider()
      if (!provider) {
        throw new Error('Provider not available')
      }

      // Load saved tokens from localStorage
      const savedTokens = JSON.parse(localStorage.getItem(`tokens_${currentNetwork}`) || '[]')
      
      // Use default tokens if no saved tokens
      const tokensToLoad = savedTokens.length > 0 ? savedTokens : defaultTokens[currentNetwork] || []

      if (tokensToLoad.length === 0) {
        setTokens([])
        return
      }

      // Use batch processing for better performance
      const tokenAddresses = tokensToLoad.map(token => token.address)
      const balanceResults = await blockchainService.batchTokenBalanceQuery(wallet.address, tokenAddresses)

      const tokenBalances: TokenInfo[] = []
      for (const [address, balance] of balanceResults) {
        tokenBalances.push({
          address: address,
          symbol: balance.symbol,
          balance: balance.balance,
          decimals: balance.decimals
        })
      }

      setTokens(tokenBalances)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load token balances')
    } finally {
      setIsLoading(false)
    }
  }

  const addToken = async () => {
    if (!newTokenAddress || !wallet) return

    setAddingToken(true)
    setError(null)

    try {
      const provider = walletService.getProvider()
      if (!provider) {
        throw new Error('Provider not available')
      }

      const balance = await blockchainService.getTokenBalance(wallet.address, newTokenAddress)

      const newToken: TokenInfo = {
        address: newTokenAddress,
        symbol: balance.symbol,
        balance: balance.balance,
        decimals: balance.decimals
      }

      const updatedTokens = [...tokens, newToken]
      setTokens(updatedTokens)

      // Save to localStorage
      const tokensToSave = updatedTokens.map(t => ({
        address: t.address,
        symbol: t.symbol
      }))
      localStorage.setItem(`tokens_${currentNetwork}`, JSON.stringify(tokensToSave))

      setDialogOpen(false)
      setNewTokenAddress('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add token')
    } finally {
      setAddingToken(false)
    }
  }

  const removeToken = (tokenAddress: string) => {
    const updatedTokens = tokens.filter(t => t.address !== tokenAddress)
    setTokens(updatedTokens)

    // Update localStorage
    const tokensToSave = updatedTokens.map(t => ({
      address: t.address,
      symbol: t.symbol
    }))
    localStorage.setItem(`tokens_${currentNetwork}`, JSON.stringify(tokensToSave))
  }

  const formatBalance = useCallback((balance: string, _decimals: number) => {
    const value = parseFloat(balance)
    if (value === 0) return '0'
    if (value < 0.0001) return '< 0.0001'
    return value.toFixed(4)
  }, [])

  // Transaction History Functions
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

  const applyFiltersAndPagination = () => {
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

    // Apply pagination
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedTransactions = filtered.slice(startIndex, endIndex)

    setTransactions(paginatedTransactions)
  }

  const getTotalPages = () => {
    let filtered = [...allTransactions]

    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filter !== 'all' && wallet) {
      filtered = filtered.filter(tx => {
        const isSent = tx.from.toLowerCase() === wallet.address.toLowerCase()
        return filter === 'sent' ? isSent : !isSent
      })
    }

    return Math.ceil(filtered.length / itemsPerPage)
  }

  // Event handlers
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setError(null)
  }, [])

  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }, [])

  const handleItemsPerPageChange = useCallback((event: any) => {
    setItemsPerPage(event.target.value)
    setPage(1)
  }, [])

  const handleFilterChange = useCallback((event: any) => {
    setFilter(event.target.value)
    setPage(1)
  }, [])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setPage(1)
  }, [])

  const refreshData = useCallback(() => {
    if (activeTab === 0) {
      loadTokenBalances()
    } else if (activeTab === 1) {
      setPage(1)
      setSearchQuery('')
      setFilter('all')
      loadTransactionHistory()
    }
  }, [activeTab])

  // Helper functions for transaction display
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
    <>
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="balance manager tabs">
              <Tab 
                icon={<AccountBalance />} 
                label="Token Balances" 
                id="balance-tab-0"
                aria-controls="balance-tabpanel-0"
              />
              <Tab 
                icon={<History />} 
                label="Transaction History" 
                id="balance-tab-1"
                aria-controls="balance-tabpanel-1"
              />
            </Tabs>
          </Box>

          {/* Token Balances Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Token Balances
              </Typography>
              <Box>
                <IconButton onClick={refreshData} disabled={isLoading} size="small">
                  {isLoading ? <CircularProgress size={20} /> : <Refresh />}
                </IconButton>
                <IconButton onClick={() => setDialogOpen(true)} size="small">
                  <Add />
                </IconButton>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {tokens.length === 0 && !isLoading && (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                No tokens added yet. Click the + button to add a token.
              </Typography>
            )}

            {tokens.length > 0 && (
              <List dense>
                {tokens.map((token) => (
                  <ListItem 
                    key={token.address}
                    sx={{ 
                      px: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Token />
                      </ListItemIcon>
                      <ListItemText
                        primary={token.symbol}
                        secondary={`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {formatBalance(token.balance, token.decimals)}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => removeToken(token.address)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Transaction History Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Transaction History
              </Typography>
              <Box>
                <IconButton onClick={refreshData} disabled={isLoading} size="small">
                  {isLoading ? <CircularProgress size={20} /> : <Refresh />}
                </IconButton>
                <IconButton onClick={() => setHistoryDialogOpen(true)} size="small">
                  <OpenInNew />
                </IconButton>
              </Box>
            </Box>

            {/* Quick summary */}
            {allTransactions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  {allTransactions.length} transactions found
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {isLoading && (
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

            {/* Show recent transactions */}
            {allTransactions.length > 0 && (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {allTransactions.slice(0, 5).map((tx, index) => (
                  <React.Fragment key={tx.hash}>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon>
                        {getTransactionIcon(tx)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
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
                          <Typography variant="caption" color="textSecondary">
                            {formatAddress(getTransactionType(tx) === 'Sent' ? tx.to : tx.from)} • {formatDate(tx.timestamp)}
                          </Typography>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          color={getTransactionType(tx) === 'Sent' ? 'error' : 'success'}
                        >
                          {getTransactionType(tx) === 'Sent' ? '-' : '+'}{tx.value} {network.nativeCurrency.symbol}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => openInExplorer(tx.hash)}
                        >
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < Math.min(allTransactions.length, 5) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {allTransactions.length > 5 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setHistoryDialogOpen(true)}
                  startIcon={<History />}
                >
                  View All Transactions
                </Button>
              </Box>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Add Token Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Token</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Token Contract Address"
            value={newTokenAddress}
            onChange={(e) => setNewTokenAddress(e.target.value)}
            margin="normal"
            placeholder="0x..."
            helperText="Enter the contract address of the ERC-20 token"
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={addToken}
            disabled={!newTokenAddress || addingToken}
            variant="contained"
          >
            {addingToken ? <CircularProgress size={20} /> : 'Add Token'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Transaction History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Transaction History</Typography>
            <IconButton onClick={() => loadTransactionHistory()} disabled={isLoading}>
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
                count={getTotalPages()}
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
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default React.memo(BalanceManager)