import React, { useState, useEffect } from 'react'
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
  Alert
} from '@mui/material'
import {
  Token,
  Add,
  Refresh,
  Delete
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { balanceService } from '../services/BalanceService'
import { walletService } from '../services/WalletService'

interface TokenInfo {
  address: string
  symbol: string
  balance: string
  decimals: number
}

const TokenBalance: React.FC = () => {
  const { wallet, currentNetwork } = useWallet()
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [addingToken, setAddingToken] = useState(false)

  // Default tokens for different networks
  const defaultTokens = {
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
  }

  useEffect(() => {
    if (wallet && !wallet.isLocked) {
      loadTokenBalances()
    }
  }, [wallet, currentNetwork])

  const loadTokenBalances = async () => {
    if (!wallet) return

    setIsLoading(true)
    setError(null)

    try {
      const provider = walletService.getProvider()
      if (!provider) {
        throw new Error('Provider not available')
      }

      balanceService.setProvider(provider)

      // Load saved tokens from localStorage
      const savedTokens = JSON.parse(localStorage.getItem(`tokens_${currentNetwork}`) || '[]')
      
      // Use default tokens if no saved tokens
      const tokensToLoad = savedTokens.length > 0 ? savedTokens : defaultTokens[currentNetwork] || []

      const tokenBalances: TokenInfo[] = []

      for (const token of tokensToLoad) {
        try {
          const balance = await balanceService.getTokenBalance(wallet.address, token.address)
          tokenBalances.push({
            address: token.address,
            symbol: balance.symbol,
            balance: balance.balance,
            decimals: balance.decimals
          })
        } catch (err) {
          console.warn(`Failed to load balance for token ${token.address}:`, err)
        }
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

      balanceService.setProvider(provider)
      const balance = await balanceService.getTokenBalance(wallet.address, newTokenAddress)

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

  const formatBalance = (balance: string, _decimals: number) => {
    const value = parseFloat(balance)
    if (value === 0) return '0'
    if (value < 0.0001) return '< 0.0001'
    return value.toFixed(4)
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Token Balances
            </Typography>
            <Box>
              <IconButton onClick={loadTokenBalances} disabled={isLoading} size="small">
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
        </CardContent>
      </Card>

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
    </>
  )
}

export default TokenBalance