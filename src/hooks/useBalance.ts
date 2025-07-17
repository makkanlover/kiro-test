import { useState, useEffect, useCallback } from 'react'
import { Balance } from '../types'
import { balanceService } from '../services/BalanceService'
import { walletService } from '../services/WalletService'
import { useWallet } from '../contexts/WalletContext'
import { useThrottle } from './usePerformance'

export const useBalance = () => {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { wallet, currentNetwork } = useWallet()
  
  // Cache the last successful balance to avoid unnecessary re-renders
  const [lastSuccessfulBalance, setLastSuccessfulBalance] = useState<Balance | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!wallet || wallet.isLocked) {
      setBalance(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = walletService.getProvider()
      if (!provider) {
        throw new Error('Provider not available')
      }

      balanceService.setProvider(provider)
      const balanceResult = await balanceService.getBalance(wallet.address)
      setBalance(balanceResult)
      setLastSuccessfulBalance(balanceResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance')
      console.error('Balance fetch error:', err)
      // Keep the last successful balance on error to prevent empty states
      if (lastSuccessfulBalance) {
        setBalance(lastSuccessfulBalance)
      }
    } finally {
      setIsLoading(false)
    }
  }, [wallet])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance, currentNetwork])

  // Throttle balance refresh to prevent excessive API calls
  const throttledFetchBalance = useThrottle(fetchBalance, 1000)
  
  const refreshBalance = useCallback(() => {
    throttledFetchBalance()
  }, [throttledFetchBalance])

  return {
    balance,
    isLoading,
    error,
    refreshBalance
  }
}