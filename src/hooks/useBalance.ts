import { useState, useEffect, useCallback } from 'react'
import { Balance } from '../types'
import { balanceService } from '../services/BalanceService'
import { walletService } from '../services/WalletService'
import { useWallet } from '../contexts/WalletContext'

export const useBalance = () => {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { wallet, currentNetwork } = useWallet()

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance')
      console.error('Balance fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [wallet])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance, currentNetwork])

  const refreshBalance = useCallback(() => {
    fetchBalance()
  }, [fetchBalance])

  return {
    balance,
    isLoading,
    error,
    refreshBalance
  }
}