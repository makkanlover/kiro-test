import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { WalletInfo, NetworkId } from '../types'
import { walletService } from '../services/WalletService'
import { walletConnectService } from '../services/WalletConnectService'
import { SUPPORTED_NETWORKS } from '../utils/networks'
import { useMemoryOptimization } from '../hooks/usePerformance'

interface WalletContextType {
  wallet: WalletInfo | null
  isLoading: boolean
  error: string | null
  currentNetwork: NetworkId
  connectWallet: (method: string, data?: any) => Promise<{ mnemonic?: string }>
  disconnectWallet: () => void
  unlockWallet: (password: string) => Promise<void>
  lockWallet: () => void
  switchNetwork: (networkId: NetworkId) => Promise<void>
  clearError: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentNetwork, setCurrentNetwork] = useState<NetworkId>(NetworkId.SEPOLIA)
  
  const { addCleanupTask } = useMemoryOptimization()

  useEffect(() => {
    checkExistingWallet()
  }, [])

  const checkExistingWallet = useCallback(async () => {
    try {
      const existingWallet = await window.electronAPI.store.get('wallet')
      if (existingWallet) {
        // Wallet exists but is locked
        setWallet({
          address: existingWallet.address,
          connectionMethod: existingWallet.connectionMethod,
          isLocked: true,
          networkId: existingWallet.networkId || NetworkId.SEPOLIA
        })
      }
    } catch (err) {
      setError('Failed to check existing wallet')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const connectWallet = async (method: string, data?: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      let walletInfo: WalletInfo
      let mnemonic: string | undefined
      
      switch (method) {
        case 'new_wallet':
          const result = await walletService.createNewWallet(data.password)
          walletInfo = result.walletInfo
          mnemonic = result.mnemonic
          break
        case 'env_file':
          walletInfo = await walletService.loadFromEnvFile(data.envContent)
          break
        case 'metamask':
          walletInfo = await walletService.connectMetaMask()
          break
        case 'walletconnect':
          walletInfo = await walletConnectService.connectWallet()
          break
        case 'recovered_wallet':
          walletInfo = await walletService.recoverFromMnemonic(data.mnemonic, data.password)
          break
        default:
          throw new Error('Unsupported connection method')
      }
      
      setWallet(walletInfo)
      setCurrentNetwork(walletInfo.networkId)
      
      // Initialize provider for the current network
      const network = SUPPORTED_NETWORKS[walletInfo.networkId]
      await walletService.switchNetwork(walletInfo.networkId, network.rpcUrl)
      
      return { mnemonic }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = async () => {
    // Disconnect WalletConnect if it's connected
    if (walletConnectService.isConnected()) {
      await walletConnectService.disconnect()
    }
    
    walletService.lockWallet()
    setWallet(null)
    setCurrentNetwork(NetworkId.SEPOLIA)
  }

  const unlockWallet = async (password: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const walletInfo = await walletService.unlockWallet(password)
      setWallet(walletInfo)
      setCurrentNetwork(walletInfo.networkId)
      
      // Initialize provider for the current network
      const network = SUPPORTED_NETWORKS[walletInfo.networkId]
      await walletService.switchNetwork(walletInfo.networkId, network.rpcUrl)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock wallet')
    } finally {
      setIsLoading(false)
    }
  }

  const lockWallet = () => {
    walletService.lockWallet()
    if (wallet) {
      setWallet({ ...wallet, isLocked: true })
    }
  }

  const switchNetwork = async (networkId: NetworkId) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const network = SUPPORTED_NETWORKS[networkId]
      await walletService.switchNetwork(networkId, network.rpcUrl)
      
      if (wallet) {
        setWallet({ ...wallet, networkId })
      }
      setCurrentNetwork(networkId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch network')
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value: WalletContextType = {
    wallet,
    isLoading,
    error,
    currentNetwork,
    connectWallet,
    disconnectWallet,
    unlockWallet,
    lockWallet,
    switchNetwork,
    clearError
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}