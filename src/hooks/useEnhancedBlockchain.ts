import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { blockchainService } from '../services/BlockchainService'
import { Transaction, GasEstimate } from '../types'
import { useThrottle, useDebounce } from './usePerformance'

interface BlockchainState {
  balance: string | null
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

interface TransactionState {
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

interface NetworkState {
  blockNumber: number | null
  chainId: number | null
  name: string | null
  isLoading: boolean
  error: string | null
}

// Enhanced blockchain hook that combines balance, transactions, and performance monitoring
export const useEnhancedBlockchain = (options?: {
  autoRefreshInterval?: number
  enablePerformanceMonitoring?: boolean
  cacheTimeout?: number
}) => {
  const { wallet, currentNetwork } = useWallet()
  const {
    autoRefreshInterval = 30000, // 30 seconds
    enablePerformanceMonitoring = false,
    cacheTimeout = 60000 // 1 minute
  } = options || {}

  // State management
  const [balanceState, setBalanceState] = useState<BlockchainState>({
    balance: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  })

  const [transactionState, setTransactionState] = useState<TransactionState>({
    transactions: [],
    isLoading: false,
    error: null,
    lastUpdated: null
  })

  const [networkState, setNetworkState] = useState<NetworkState>({
    blockNumber: null,
    chainId: null,
    name: null,
    isLoading: false,
    error: null
  })

  // Performance monitoring
  const performanceRef = useRef<{ [key: string]: number }>({})
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map())

  // Performance measurement utility
  const measurePerformance = useCallback((operation: string, fn: () => Promise<any>) => {
    return async () => {
      const startTime = performance.now()
      
      try {
        const result = await fn()
        const endTime = performance.now()
        const duration = endTime - startTime
        
        if (enablePerformanceMonitoring) {
          performanceRef.current[operation] = duration
          console.log(`Blockchain ${operation}: ${duration.toFixed(2)}ms`)
        }
        
        return result
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        if (enablePerformanceMonitoring) {
          performanceRef.current[`${operation}_error`] = duration
          console.log(`Blockchain ${operation} (error): ${duration.toFixed(2)}ms`)
        }
        
        throw error
      }
    }
  }, [enablePerformanceMonitoring])

  // Cache management
  const getCachedData = useCallback((key: string) => {
    const cached = cacheRef.current.get(key)
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data
    }
    return null
  }, [cacheTimeout])

  const setCachedData = useCallback((key: string, data: any) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() })
  }, [])

  // Balance operations
  const fetchBalance = useCallback(async (address?: string) => {
    if (!wallet && !address) return

    const targetAddress = address || wallet?.address
    if (!targetAddress) return

    const cacheKey = `balance:${targetAddress}:${currentNetwork}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      setBalanceState(prev => ({ ...prev, balance: cached, error: null }))
      return cached
    }

    setBalanceState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const performanceFetch = measurePerformance('fetchBalance', () =>
        blockchainService.getBalance(targetAddress)
      )
      
      const balance = await performanceFetch()
      
      setCachedData(cacheKey, balance)
      setBalanceState({
        balance,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      })
      
      return balance
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance'
      setBalanceState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      throw error
    }
  }, [wallet, currentNetwork, getCachedData, setCachedData, measurePerformance])

  // Transaction operations
  const fetchTransactions = useCallback(async (address?: string) => {
    if (!wallet && !address) return []

    const targetAddress = address || wallet?.address
    if (!targetAddress) return []

    const cacheKey = `transactions:${targetAddress}:${currentNetwork}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      setTransactionState(prev => ({ ...prev, transactions: cached, error: null }))
      return cached
    }

    setTransactionState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const performanceFetch = measurePerformance('fetchTransactions', () =>
        blockchainService.getTransactionHistory(targetAddress)
      )
      
      const transactions = await performanceFetch()
      
      setCachedData(cacheKey, transactions)
      setTransactionState({
        transactions,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      })
      
      return transactions
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions'
      setTransactionState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      return []
    }
  }, [wallet, currentNetwork, getCachedData, setCachedData, measurePerformance])

  // Network operations
  const fetchNetworkInfo = useCallback(async () => {
    setNetworkState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const [blockNumber, network] = await Promise.all([
        blockchainService.getBlockNumber(),
        blockchainService.getNetwork()
      ])

      setNetworkState({
        blockNumber,
        chainId: network.chainId,
        name: network.name,
        isLoading: false,
        error: null
      })

      return { blockNumber, chainId: network.chainId, name: network.name }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch network info'
      setNetworkState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  // Gas estimation
  const estimateGas = useCallback(async (to: string, value: string, data?: string) => {
    try {
      const performanceEstimate = measurePerformance('estimateGas', () =>
        blockchainService.estimateGas({ to, value, data })
      )
      
      return await performanceEstimate()
    } catch (error) {
      console.error('Gas estimation failed:', error)
      throw error
    }
  }, [measurePerformance])

  // Send transaction
  const sendTransaction = useCallback(async (to: string, value: string, options?: any) => {
    try {
      const performanceSend = measurePerformance('sendTransaction', () =>
        blockchainService.sendTransaction(to, value, options)
      )
      
      const result = await performanceSend()
      
      // Clear relevant caches after successful transaction
      const walletAddress = wallet?.address
      if (walletAddress) {
        cacheRef.current.delete(`balance:${walletAddress}:${currentNetwork}`)
        cacheRef.current.delete(`transactions:${walletAddress}:${currentNetwork}`)
      }
      
      return result
    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    }
  }, [wallet, currentNetwork, measurePerformance])

  // Batch operations
  const batchRefresh = useCallback(async (addresses?: string[]) => {
    const targetAddresses = addresses || (wallet?.address ? [wallet.address] : [])
    if (targetAddresses.length === 0) return

    try {
      const performanceBatch = measurePerformance('batchRefresh', async () => {
        const balanceMap = await blockchainService.batchBalanceQuery(targetAddresses)
        return { balances: balanceMap }
      })
      
      const { balances } = await performanceBatch()
      
      // Update cache with batch results
      balances.forEach((balance, address) => {
        const cacheKey = `balance:${address}:${currentNetwork}`
        setCachedData(cacheKey, balance)
      })
      
      // Update state if current wallet is in the batch
      if (wallet?.address && balances.has(wallet.address)) {
        setBalanceState(prev => ({
          ...prev,
          balance: balances.get(wallet.address) || null,
          lastUpdated: Date.now(),
          error: null
        }))
      }
      
      return balances
    } catch (error) {
      console.error('Batch refresh failed:', error)
      throw error
    }
  }, [wallet, currentNetwork, setCachedData, measurePerformance])

  // Throttled refresh functions
  const throttledRefreshBalance = useThrottle(fetchBalance, 2000)
  const throttledRefreshTransactions = useThrottle(fetchTransactions, 5000)

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefreshInterval > 0 && wallet && !wallet.isLocked) {
      intervalRef.current = setInterval(() => {
        fetchBalance()
        fetchNetworkInfo()
      }, autoRefreshInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [wallet, autoRefreshInterval, fetchBalance, fetchNetworkInfo])

  // Initial data fetch
  useEffect(() => {
    if (wallet && !wallet.isLocked) {
      fetchBalance()
      fetchTransactions()
      fetchNetworkInfo()
    }
  }, [wallet, currentNetwork, fetchBalance, fetchTransactions, fetchNetworkInfo])

  // Clear cache when wallet changes
  useEffect(() => {
    cacheRef.current.clear()
  }, [wallet?.address, currentNetwork])

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    if (!enablePerformanceMonitoring) return null
    
    return {
      ...performanceRef.current,
      averageBalanceFetch: performanceRef.current.fetchBalance || 0,
      averageTransactionFetch: performanceRef.current.fetchTransactions || 0,
      averageGasEstimate: performanceRef.current.estimateGas || 0
    }
  }, [enablePerformanceMonitoring])

  // Combined state
  const state = useMemo(() => ({
    balance: balanceState,
    transactions: transactionState,
    network: networkState,
    isLoading: balanceState.isLoading || transactionState.isLoading || networkState.isLoading,
    hasError: !!(balanceState.error || transactionState.error || networkState.error),
    lastUpdated: Math.max(
      balanceState.lastUpdated || 0,
      transactionState.lastUpdated || 0
    )
  }), [balanceState, transactionState, networkState])

  // Operations
  const operations = useMemo(() => ({
    refreshBalance: throttledRefreshBalance,
    refreshTransactions: throttledRefreshTransactions,
    refreshNetwork: fetchNetworkInfo,
    refreshAll: batchRefresh,
    estimateGas,
    sendTransaction,
    clearCache: () => cacheRef.current.clear()
  }), [
    throttledRefreshBalance,
    throttledRefreshTransactions,
    fetchNetworkInfo,
    batchRefresh,
    estimateGas,
    sendTransaction
  ])

  return {
    state,
    operations,
    performanceMetrics,
    
    // Convenience accessors
    balance: balanceState.balance,
    transactions: transactionState.transactions,
    blockNumber: networkState.blockNumber,
    chainId: networkState.chainId,
    
    // Legacy compatibility
    isLoading: state.isLoading,
    error: balanceState.error || transactionState.error || networkState.error,
    refreshBalance: throttledRefreshBalance,
    refreshTransactions: throttledRefreshTransactions
  }
}

// Specialized hook for balance only (optimized performance)
export const useBalance = () => {
  const { balance, isLoading, error, refreshBalance } = useEnhancedBlockchain({
    autoRefreshInterval: 30000,
    enablePerformanceMonitoring: false
  })

  return {
    balance,
    isLoading,
    error,
    refreshBalance
  }
}

// Specialized hook for transactions only
export const useTransactions = () => {
  const { transactions, operations, state } = useEnhancedBlockchain({
    autoRefreshInterval: 0, // No auto-refresh for transactions
    enablePerformanceMonitoring: false
  })

  return {
    transactions,
    isLoading: state.transactions.isLoading,
    error: state.transactions.error,
    refreshTransactions: operations.refreshTransactions
  }
}

// Hook for performance monitoring only
export const useBlockchainPerformance = () => {
  const { performanceMetrics } = useEnhancedBlockchain({
    enablePerformanceMonitoring: true,
    autoRefreshInterval: 0
  })

  return performanceMetrics
}