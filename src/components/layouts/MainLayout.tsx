import React from 'react'
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Container
} from '@mui/material'
import {
  AccountBalanceWallet,
  NetworkWifi,
  Lock,
  ExpandMore
} from '@mui/icons-material'
import { useWallet } from '../../contexts/WalletContext'
import { SUPPORTED_NETWORKS } from '../../utils/networks'
import { NetworkId } from '../../types'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { wallet, currentNetwork, switchNetwork, lockWallet } = useWallet()
  const [networkMenuAnchor, setNetworkMenuAnchor] = React.useState<null | HTMLElement>(null)

  const handleNetworkMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setNetworkMenuAnchor(event.currentTarget)
  }

  const handleNetworkMenuClose = () => {
    setNetworkMenuAnchor(null)
  }

  const handleNetworkSwitch = async (networkId: NetworkId) => {
    await switchNetwork(networkId)
    handleNetworkMenuClose()
  }

  const handleLockWallet = () => {
    lockWallet()
  }

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <AccountBalanceWallet sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Web3 Wallet
          </Typography>
          
          {wallet && !wallet.isLocked && (
            <>
              <Button
                color="inherit"
                startIcon={<NetworkWifi />}
                endIcon={<ExpandMore />}
                onClick={handleNetworkMenuClick}
                sx={{ mr: 2 }}
              >
                {SUPPORTED_NETWORKS[currentNetwork].name}
              </Button>
              
              <Menu
                anchorEl={networkMenuAnchor}
                open={Boolean(networkMenuAnchor)}
                onClose={handleNetworkMenuClose}
              >
                {Object.values(SUPPORTED_NETWORKS).map((network) => (
                  <MenuItem
                    key={network.id}
                    onClick={() => handleNetworkSwitch(network.id)}
                    selected={network.id === currentNetwork}
                  >
                    {network.name}
                  </MenuItem>
                ))}
              </Menu>
              
              <Chip
                label={`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                variant="outlined"
                size="small"
                sx={{ mr: 2, color: 'white', borderColor: 'white' }}
              />
              
              <IconButton
                color="inherit"
                onClick={handleLockWallet}
                title="Lock Wallet"
              >
                <Lock />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
    </Box>
  )
}

export default MainLayout