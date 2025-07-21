import React, { useState, useMemo, useCallback } from 'react'
import {
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  Divider,
  Alert
} from '@mui/material'
import {
  NetworkWifi,
  ExpandMore,
  Refresh,
  SignalWifi4Bar,
  SignalWifi3Bar,
  SignalWifi2Bar,
  SignalWifi1Bar,
  SignalWifiOff,
  Info
} from '@mui/icons-material'
import { useWallet } from '../contexts/WalletContext'
import { useNetworkHealth } from '../hooks/useNetworkHealth'
import { SUPPORTED_NETWORKS } from '../utils'
import { NetworkId } from '../types'

interface NetworkSelectorProps {
  variant?: 'button' | 'menu'
  color?: 'inherit' | 'primary' | 'secondary'
  size?: 'small' | 'medium' | 'large'
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ 
  variant = 'button',
  color = 'inherit',
  size = 'medium'
}) => {
  const { currentNetwork, switchNetwork } = useWallet()
  const { 
    healthStatus, 
    isChecking, 
    checkNetworkHealth, 
    getStatusColor, 
    getStatusIcon, 
    getStatusText, 
    formatLatency,
    networkInfo
  } = useNetworkHealth()
  
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget)
  }, [])

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null)
    setShowDetails(false)
  }, [])

  const handleNetworkSwitch = useCallback(async (networkId: NetworkId) => {
    await switchNetwork(networkId)
    setMenuAnchor(null)
  }, [switchNetwork])

  const handleRefresh = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    checkNetworkHealth()
  }, [checkNetworkHealth])

  const getSignalIcon = useCallback((status: typeof healthStatus.status) => {
    switch (status) {
      case 'excellent':
        return <SignalWifi4Bar fontSize="small" color="success" />
      case 'good':
        return <SignalWifi3Bar fontSize="small" color="info" />
      case 'poor':
        return <SignalWifi2Bar fontSize="small" color="warning" />
      case 'offline':
        return <SignalWifiOff fontSize="small" color="error" />
      default:
        return <SignalWifi1Bar fontSize="small" color="disabled" />
    }
  }, [])

  const currentNetworkDisplay = useMemo(() => {
    return SUPPORTED_NETWORKS[currentNetwork]
  }, [currentNetwork])

  const renderNetworkStatus = useCallback((compact: boolean = false) => {
    if (compact) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {getSignalIcon(healthStatus.status)}
          <Typography variant="caption" color="textSecondary">
            {formatLatency(healthStatus.latency)}
          </Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        {getSignalIcon(healthStatus.status)}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2">
            Connection Quality: {getStatusText(healthStatus.status)}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Latency: {formatLatency(healthStatus.latency)}
            {healthStatus.blockNumber && ` • Block: ${healthStatus.blockNumber}`}
          </Typography>
        </Box>
        <IconButton 
          size="small" 
          onClick={handleRefresh}
          disabled={isChecking}
          title="Refresh network status"
        >
          {isChecking ? <CircularProgress size={16} /> : <Refresh fontSize="small" />}
        </IconButton>
      </Box>
    )
  }, [healthStatus, getSignalIcon, getStatusText, formatLatency, handleRefresh, isChecking])

  const renderMenuItem = useCallback((network: typeof SUPPORTED_NETWORKS[NetworkId]) => {
    const isCurrentNetwork = network.id === currentNetwork
    
    return (
      <MenuItem
        key={network.id}
        onClick={() => handleNetworkSwitch(network.id)}
        selected={isCurrentNetwork}
        sx={{ minWidth: 300 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2">{network.name}</Typography>
            <Typography variant="caption" color="textSecondary">
              {network.nativeCurrency.symbol} • Chain ID: {network.chainId}
            </Typography>
          </Box>
          {isCurrentNetwork && renderNetworkStatus(true)}
        </Box>
      </MenuItem>
    )
  }, [currentNetwork, handleNetworkSwitch, renderNetworkStatus])

  if (variant === 'menu') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          color={color}
          startIcon={<NetworkWifi />}
          endIcon={<ExpandMore />}
          onClick={handleMenuOpen}
          size={size}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{currentNetworkDisplay.name}</Typography>
            {getSignalIcon(healthStatus.status)}
          </Box>
        </Button>
        
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 320 }
          }}
        >
          {/* Current Network Status */}
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Network: {currentNetworkDisplay.name}
            </Typography>
            {renderNetworkStatus()}
            
            {healthStatus.error && (
              <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                <Typography variant="caption">{healthStatus.error}</Typography>
              </Alert>
            )}
          </Box>
          
          <Divider />
          
          {/* Network Details Toggle */}
          <MenuItem onClick={() => setShowDetails(!showDetails)}>
            <Info sx={{ mr: 1 }} />
            <Typography variant="body2">
              {showDetails ? 'Hide' : 'Show'} Network Details
            </Typography>
          </MenuItem>
          
          {showDetails && (
            <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary">
                RPC URL: {currentNetworkDisplay.rpcUrl}
              </Typography>
              <br />
              <Typography variant="caption" color="textSecondary">
                Explorer: {currentNetworkDisplay.blockExplorerUrl}
              </Typography>
              <br />
              <Typography variant="caption" color="textSecondary">
                Last Check: {new Date(healthStatus.lastCheck).toLocaleTimeString()}
              </Typography>
            </Box>
          )}
          
          <Divider />
          
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Switch Network
            </Typography>
          </Box>
          
          {/* Network List */}
          {Object.values(SUPPORTED_NETWORKS).map(renderMenuItem)}
        </Menu>
      </Box>
    )
  }

  // Button variant (simplified)
  return (
    <Button
      color={color}
      startIcon={<NetworkWifi />}
      endIcon={getSignalIcon(healthStatus.status)}
      onClick={handleMenuOpen}
      size={size}
    >
      {currentNetworkDisplay.name}
    </Button>
  )
}

export default React.memo(NetworkSelector)