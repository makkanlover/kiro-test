import { useCallback, useEffect, useRef, useMemo } from 'react'
import { useWallet as useBaseWallet } from '../contexts/WalletContext'
import { AppError, errorHandler, ErrorCategory } from '../utils'
import { blockchainService } from '../services/BlockchainService'

// Enhanced wallet hook that combines auto-lock, error handling, and wallet management
export const useEnhancedWallet = (autoLockTimeout?: number) => {
  const baseWallet = useBaseWallet()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const effectiveTimeout = autoLockTimeout || 15 * 60 * 1000 // 15 minutes default

  // Auto-lock functionality
  const resetAutoLockTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (baseWallet.wallet && !baseWallet.wallet.isLocked) {
      timeoutRef.current = setTimeout(() => {
        baseWallet.lockWallet()
      }, effectiveTimeout)
    }
  }, [baseWallet.wallet, baseWallet.lockWallet, effectiveTimeout])

  const clearAutoLockTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Enhanced error handling with wallet-specific context
  const handleWalletError = useCallback((error: any, code?: string): AppError => {
    const appError = code 
      ? errorHandler.createError(
          ErrorCategory.WALLET,
          code,
          error instanceof Error ? error.message : String(error),
          errorHandler.getUserFriendlyMessage(error),
          { walletAddress: baseWallet.wallet?.address },
          error instanceof Error ? error : undefined
        )
      : errorHandler.handleUnknownError(error)

    // Auto-clear cache on wallet errors
    blockchainService.clearAllCaches()
    
    return appError
  }, [baseWallet.wallet?.address])

  const handleNetworkError = useCallback((error: any, code?: string): AppError => {
    const appError = code 
      ? errorHandler.createError(
          ErrorCategory.NETWORK,
          code,
          error instanceof Error ? error.message : String(error),
          errorHandler.getUserFriendlyMessage(error),
          { 
            network: baseWallet.currentNetwork,
            walletAddress: baseWallet.wallet?.address 
          },
          error instanceof Error ? error : undefined
        )
      : errorHandler.handleUnknownError(error)

    // Clear blockchain-related caches on network errors
    blockchainService.clearAllCaches()
    
    return appError
  }, [baseWallet.currentNetwork, baseWallet.wallet?.address])

  const handleTransactionError = useCallback((error: any, code?: string, txHash?: string): AppError => {
    const appError = code 
      ? errorHandler.createError(
          ErrorCategory.TRANSACTION,
          code,
          error instanceof Error ? error.message : String(error),
          errorHandler.getUserFriendlyMessage(error),
          { 
            transactionHash: txHash,
            network: baseWallet.currentNetwork,
            walletAddress: baseWallet.wallet?.address 
          },
          error instanceof Error ? error : undefined
        )
      : errorHandler.handleUnknownError(error)
    
    return appError
  }, [baseWallet.currentNetwork, baseWallet.wallet?.address])

  // Enhanced wallet operations with error handling
  const safeConnectWallet = useCallback(async (connectionMethod: any, params?: any) => {
    try {
      resetAutoLockTimer()
      const result = await baseWallet.connectWallet(connectionMethod, params)
      return { success: true, result, error: null }
    } catch (error) {
      const appError = handleWalletError(error, 'WALLET_CONNECTION_FAILED')
      return { success: false, result: null, error: appError }
    }
  }, [baseWallet.connectWallet, resetAutoLockTimer, handleWalletError])

  const safeUnlockWallet = useCallback(async (password: string) => {
    try {
      const result = await baseWallet.unlockWallet(password)
      resetAutoLockTimer()
      return { success: true, result, error: null }
    } catch (error) {
      const appError = handleWalletError(error, 'WALLET_UNLOCK_FAILED')
      return { success: false, result: null, error: appError }
    }
  }, [baseWallet.unlockWallet, resetAutoLockTimer, handleWalletError])

  const safeLockWallet = useCallback(() => {
    try {
      clearAutoLockTimer()
      baseWallet.lockWallet()
      blockchainService.clearAllCaches()
      return { success: true, error: null }
    } catch (error) {
      const appError = handleWalletError(error, 'WALLET_LOCK_FAILED')
      return { success: false, error: appError }
    }
  }, [baseWallet.lockWallet, clearAutoLockTimer, handleWalletError])

  const safeDisconnectWallet = useCallback(() => {
    try {
      clearAutoLockTimer()
      baseWallet.disconnectWallet()
      blockchainService.clearAllCaches()
      return { success: true, error: null }
    } catch (error) {
      const appError = handleWalletError(error, 'WALLET_DISCONNECT_FAILED')
      return { success: false, error: appError }
    }
  }, [baseWallet.disconnectWallet, clearAutoLockTimer, handleWalletError])

  const safeSwitchNetwork = useCallback(async (networkId: any) => {
    try {
      const result = await baseWallet.switchNetwork(networkId)
      blockchainService.clearAllCaches()
      return { success: true, result, error: null }
    } catch (error) {
      const appError = handleNetworkError(error, 'NETWORK_SWITCH_FAILED')
      return { success: false, result: null, error: appError }
    }
  }, [baseWallet.switchNetwork, handleNetworkError])

  // Auto-lock effect setup
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    const handleActivity = () => {
      resetAutoLockTimer()
    }

    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Start the timer
    resetAutoLockTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      clearAutoLockTimer()
    }
  }, [resetAutoLockTimer, clearAutoLockTimer])

  // Clear timer when wallet is locked or disconnected
  useEffect(() => {
    if (!baseWallet.wallet || baseWallet.wallet.isLocked) {
      clearAutoLockTimer()
    }
  }, [baseWallet.wallet, clearAutoLockTimer])

  // Wallet status helpers
  const walletStatus = useMemo(() => ({
    isConnected: !!baseWallet.wallet,
    isLocked: baseWallet.wallet?.isLocked ?? true,
    isUnlocked: baseWallet.wallet && !baseWallet.wallet.isLocked,
    hasBalance: false, // This could be enhanced to check actual balance
    connectionMethod: baseWallet.wallet?.connectionMethod,
    address: baseWallet.wallet?.address,
    networkId: baseWallet.wallet?.networkId
  }), [baseWallet.wallet])

  // Performance optimized memoized returns
  const errorHandlers = useMemo(() => ({
    handleWalletError,
    handleNetworkError,
    handleTransactionError
  }), [handleWalletError, handleNetworkError, handleTransactionError])

  const walletOperations = useMemo(() => ({
    connect: safeConnectWallet,
    unlock: safeUnlockWallet,
    lock: safeLockWallet,
    disconnect: safeDisconnectWallet,
    switchNetwork: safeSwitchNetwork
  }), [safeConnectWallet, safeUnlockWallet, safeLockWallet, safeDisconnectWallet, safeSwitchNetwork])

  const autoLockControls = useMemo(() => ({
    resetTimer: resetAutoLockTimer,
    clearTimer: clearAutoLockTimer,
    timeout: effectiveTimeout
  }), [resetAutoLockTimer, clearAutoLockTimer, effectiveTimeout])

  return {
    // Base wallet context (for backward compatibility)
    ...baseWallet,
    
    // Enhanced functionality
    status: walletStatus,
    operations: walletOperations,
    errorHandlers,
    autoLock: autoLockControls,
    
    // Convenience methods for common patterns
    isReady: walletStatus.isConnected && walletStatus.isUnlocked,
    requiresAuth: !walletStatus.isConnected || walletStatus.isLocked,
    
    // Safe operation shortcuts (returns {success, result?, error?})
    safeConnect: safeConnectWallet,
    safeUnlock: safeUnlockWallet,
    safeLock: safeLockWallet,
    safeDisconnect: safeDisconnectWallet,
    safeSwitchNetwork: safeSwitchNetwork
  }
}

// Specialized hook for components that need only wallet status
export const useWalletStatus = () => {
  const { wallet } = useBaseWallet()
  
  return useMemo(() => ({
    isConnected: !!wallet,
    isLocked: wallet?.isLocked ?? true,
    isUnlocked: wallet && !wallet.isLocked,
    isReady: wallet && !wallet.isLocked,
    requiresAuth: !wallet || wallet.isLocked,
    address: wallet?.address,
    connectionMethod: wallet?.connectionMethod,
    networkId: wallet?.networkId
  }), [wallet])
}

// Hook for auto-lock only (for backward compatibility)
export const useAutoLock = (timeout?: number) => {
  const { autoLock } = useEnhancedWallet(timeout)
  return autoLock
}

// Hook for wallet error handling only
export const useWalletErrorHandler = () => {
  const { errorHandlers } = useEnhancedWallet()
  return errorHandlers
}