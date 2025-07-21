import { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { blockchainService } from '../services/BlockchainService'
import { SUPPORTED_NETWORKS } from '../utils'

export interface NetworkHealthStatus {
  latency: number
  status: 'excellent' | 'good' | 'poor' | 'offline'
  lastCheck: number
  blockNumber: number | null
  error: string | null
}

const LATENCY_THRESHOLDS = {
  excellent: 200,  // < 200ms
  good: 500,       // 200-500ms
  poor: 1000       // 500-1000ms
  // > 1000ms = offline
}

const CHECK_INTERVAL = 30000 // 30 seconds

export const useNetworkHealth = () => {
  const { currentNetwork } = useWallet()
  const [healthStatus, setHealthStatus] = useState<NetworkHealthStatus>({
    latency: -1,
    status: 'offline',
    lastCheck: 0,
    blockNumber: null,
    error: null
  })
  const [isChecking, setIsChecking] = useState(false)

  const checkNetworkHealth = useCallback(async (): Promise<NetworkHealthStatus> => {
    const startTime = Date.now()
    
    try {
      // Test network connectivity and measure latency
      const latencyPromise = blockchainService.measureRpcLatency()
      const blockNumberPromise = blockchainService.getBlockNumber()
      
      const [latency, blockNumber] = await Promise.all([
        latencyPromise,
        blockNumberPromise
      ])

      let status: 'excellent' | 'good' | 'poor' | 'offline'
      
      if (latency < 0) {
        status = 'offline'
      } else if (latency < LATENCY_THRESHOLDS.excellent) {
        status = 'excellent'
      } else if (latency < LATENCY_THRESHOLDS.good) {
        status = 'good'
      } else if (latency < LATENCY_THRESHOLDS.poor) {
        status = 'poor'
      } else {
        status = 'offline'
      }

      return {
        latency,
        status,
        lastCheck: Date.now(),
        blockNumber,
        error: null
      }
      
    } catch (error) {
      return {
        latency: -1,
        status: 'offline',
        lastCheck: Date.now(),
        blockNumber: null,
        error: error instanceof Error ? error.message : 'Network check failed'
      }
    }
  }, [])

  const performHealthCheck = useCallback(async () => {
    if (isChecking) return
    
    setIsChecking(true)
    try {
      const newStatus = await checkNetworkHealth()
      setHealthStatus(newStatus)
    } finally {
      setIsChecking(false)
    }
  }, [checkNetworkHealth, isChecking])

  // Automatic health checks
  useEffect(() => {
    // Initial check
    performHealthCheck()

    // Set up interval for periodic checks
    const interval = setInterval(performHealthCheck, CHECK_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [currentNetwork, performHealthCheck])

  // Network change effect
  useEffect(() => {
    // Reset status when network changes
    setHealthStatus({
      latency: -1,
      status: 'offline',
      lastCheck: 0,
      blockNumber: null,
      error: null
    })
    
    // Trigger immediate check for new network
    setTimeout(performHealthCheck, 1000)
  }, [currentNetwork, performHealthCheck])

  const getStatusColor = useCallback((status: NetworkHealthStatus['status']) => {
    switch (status) {
      case 'excellent':
        return 'success'
      case 'good':
        return 'info'
      case 'poor':
        return 'warning'
      case 'offline':
        return 'error'
      default:
        return 'default'
    }
  }, [])

  const getStatusIcon = useCallback((status: NetworkHealthStatus['status']) => {
    switch (status) {
      case 'excellent':
        return '🟢'
      case 'good':
        return '🟡'
      case 'poor':
        return '🟠'
      case 'offline':
        return '🔴'
      default:
        return '⚫'
    }
  }, [])

  const getStatusText = useCallback((status: NetworkHealthStatus['status']) => {
    switch (status) {
      case 'excellent':
        return 'Excellent'
      case 'good':
        return 'Good'
      case 'poor':
        return 'Poor'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown'
    }
  }, [])

  const formatLatency = useCallback((latency: number) => {
    if (latency < 0) return 'N/A'
    return `${latency.toFixed(0)}ms`
  }, [])

  const networkInfo = useMemo(() => {
    return SUPPORTED_NETWORKS[currentNetwork]
  }, [currentNetwork])

  return {
    healthStatus,
    isChecking,
    checkNetworkHealth: performHealthCheck,
    getStatusColor,
    getStatusIcon,
    getStatusText,
    formatLatency,
    networkInfo
  }
}