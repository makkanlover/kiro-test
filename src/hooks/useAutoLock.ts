import { useEffect, useRef } from 'react'
import { useWallet } from '../contexts/WalletContext'

const AUTO_LOCK_TIMEOUT = 15 * 60 * 1000 // 15 minutes in milliseconds

export const useAutoLock = () => {
  const { wallet, lockWallet } = useWallet()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (wallet && !wallet.isLocked) {
      timeoutRef.current = setTimeout(() => {
        lockWallet()
      }, AUTO_LOCK_TIMEOUT)
    }
  }

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

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
      resetTimer()
    }

    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Start the timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      clearTimer()
    }
  }, [wallet])

  // Clear timer when wallet is locked or user logs out
  useEffect(() => {
    if (!wallet || wallet.isLocked) {
      clearTimer()
    }
  }, [wallet])

  return {
    resetTimer,
    clearTimer
  }
}