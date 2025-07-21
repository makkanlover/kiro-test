import React, { useMemo, useCallback } from 'react'
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
import { useI18n } from '../../utils/i18n-optimized'
import { SUPPORTED_NETWORKS } from '../../utils'
import { NetworkId } from '../../types'
import LanguageSelector from '../LanguageSelector'
import NetworkSelector from '../NetworkSelector'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { wallet, lockWallet } = useWallet()
  const { t } = useI18n()

  const handleLockWallet = useCallback(() => {
    lockWallet()
  }, [lockWallet])

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <AccountBalanceWallet sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('wallet.welcome').replace('Welcome to ', '')}
          </Typography>
          
          {wallet && !wallet.isLocked && (
            <>
              <NetworkSelector 
                variant="menu" 
                color="inherit" 
                size="medium" 
              />
              
              <Chip
                label={`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                variant="outlined"
                size="small"
                sx={{ mr: 2, color: 'white', borderColor: 'white' }}
              />
              
              <LanguageSelector variant="menu" size="medium" />
              
              <IconButton
                color="inherit"
                onClick={handleLockWallet}
                title={t('common.lock')}
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

export default React.memo(MainLayout)