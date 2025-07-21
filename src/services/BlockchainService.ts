import { ethers } from 'ethers'
import { SendTransactionParams, GasEstimate, TransactionStatus, Transaction, Balance } from '../types'
import { walletService } from './WalletService'
import { SUPPORTED_NETWORKS, retry } from '../utils'

export class BlockchainService {
  private intervalId: NodeJS.Timeout | null = null
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  
  // Cache TTL constants (in milliseconds)
  private readonly BALANCE_CACHE_TTL = 30000 // 30 seconds
  private readonly GAS_PRICE_CACHE_TTL = 15000 // 15 seconds
  private readonly TRANSACTION_CACHE_TTL = 60000 // 1 minute
  
  // Batch processing queues
  private balanceRequestQueue: Set<string> = new Set()
  private batchProcessTimer: NodeJS.Timeout | null = null
  private readonly BATCH_DELAY = 100 // 100ms delay to accumulate requests
  
  // Network resilience
  private networkFailureCount: Map<string, number> = new Map()
  private readonly MAX_NETWORK_FAILURES = 3

  // ===== NETWORK RESILIENCE OPERATIONS =====

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    networkId?: string,
    maxRetries?: number
  ): Promise<T> {
    const network = networkId ? SUPPORTED_NETWORKS[networkId] : null
    const retries = maxRetries || network?.maxRetries || 3
    const delay = network?.retryDelay || 1000

    return retry(operation, retries, delay)
  }

  private async handleNetworkFailure(networkId: string, error: any): Promise<void> {
    const currentFailures = this.networkFailureCount.get(networkId) || 0
    this.networkFailureCount.set(networkId, currentFailures + 1)

    console.warn(`Network failure for ${networkId}. Count: ${currentFailures + 1}`, error)

    if (currentFailures + 1 >= this.MAX_NETWORK_FAILURES) {
      console.error(`Max failures reached for network ${networkId}. Attempting fallback.`)
      // Trigger network switching logic
      await this.attemptNetworkRecovery(networkId)
    }
  }

  private async attemptNetworkRecovery(networkId: string): Promise<boolean> {
    try {
      const network = SUPPORTED_NETWORKS[networkId]
      
      if (network.fallbackRpcUrls && network.fallbackRpcUrls.length > 0) {
        for (const fallbackUrl of network.fallbackRpcUrls) {
          try {
            console.log(`Attempting recovery with fallback RPC: ${fallbackUrl}`)
            
            // Test connection with a simple call
            const testProvider = new ethers.JsonRpcProvider(fallbackUrl)
            await testProvider.getBlockNumber()
            
            // If successful, trigger network switch
            const success = await walletService.switchNetwork(networkId as any, fallbackUrl)
            
            if (success) {
              console.log(`Successfully recovered network ${networkId} with fallback: ${fallbackUrl}`)
              this.networkFailureCount.set(networkId, 0) // Reset failure count
              return true
            }
          } catch (fallbackError) {
            console.warn(`Fallback recovery failed for ${fallbackUrl}:`, fallbackError)
            continue
          }
        }
      }
      
      console.error(`All recovery attempts failed for network ${networkId}`)
      return false
    } catch (error) {
      console.error(`Network recovery error for ${networkId}:`, error)
      return false
    }
  }

  private async withNetworkFallback<T>(
    operation: () => Promise<T>,
    networkId?: string
  ): Promise<T> {
    try {
      const result = await this.executeWithRetry(operation, networkId)
      
      // Reset failure count on success
      if (networkId) {
        this.networkFailureCount.set(networkId, 0)
      }
      
      return result
    } catch (error) {
      if (networkId) {
        await this.handleNetworkFailure(networkId, error)
      }
      throw error
    }
  }

  // ===== BALANCE OPERATIONS =====

  async getBalance(address?: string): Promise<string> {
    const targetAddress = address || walletService.getCurrentWallet()?.address
    if (!targetAddress) {
      throw new Error('No wallet connected')
    }

    // Check cache first
    const cacheKey = `balance:${targetAddress}`
    const cached = this.getCachedData(cacheKey)
    if (cached) {
      return cached
    }

    const wallet = walletService.getCurrentWallet()
    const networkId = wallet?.networkId

    return this.withNetworkFallback(async () => {
      const provider = walletService.getProvider()
      if (!provider) {
        throw new Error('Provider not available')
      }

      const balance = await provider.getBalance(targetAddress)
      const formatted = ethers.formatEther(balance)
      
      // Cache the result
      this.setCachedData(cacheKey, formatted, this.BALANCE_CACHE_TTL)
      
      return formatted
    }, networkId)
  }

  async getFormattedBalance(address?: string, decimals: number = 3, unit: string = 'ether'): Promise<string> {
    const targetAddress = address || walletService.getCurrentWallet()?.address
    if (!targetAddress) {
      throw new Error('No wallet connected')
    }

    const provider = walletService.getProvider()
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      const balance = await provider.getBalance(targetAddress)
      
      if (unit === 'gwei') {
        return ethers.formatUnits(balance, 'gwei')
      }
      
      const formatted = ethers.formatEther(balance)
      return parseFloat(formatted).toFixed(decimals)
    } catch (error) {
      console.error('Error fetching formatted balance:', error)
      throw new Error(`Failed to get formatted balance: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getTokenBalance(walletAddress: string, tokenAddress: string): Promise<Balance> {
    const provider = walletService.getProvider()
    if (!provider) {
      throw new Error('Provider not available')
    }

    // ERC-20 token contract ABI (minimal)
    const tokenABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)', 
      'function symbol() view returns (string)'
    ]

    try {
      const contract = new ethers.Contract(tokenAddress, tokenABI, provider)
      
      // Get token info in parallel
      const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
        contract.symbol()
      ])

      const formattedBalance = ethers.formatUnits(balance, decimals)

      return {
        balance: formattedBalance,
        decimals: Number(decimals),
        symbol: symbol,
        address: tokenAddress
      }
    } catch (error) {
      console.error('Error fetching token balance:', error)
      throw new Error(`Failed to get token balance: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ===== TRANSACTION OPERATIONS =====

  async estimateGas(params: SendTransactionParams): Promise<GasEstimate> {
    const gasLimit = await this.estimateGasLimit(params.to, params.value, params.data)
    const feeData = await this.getGasPrice()
    const gasPrice = feeData.gasPrice

    // Calculate total cost
    const totalCost = gasLimit * gasPrice
    const totalCostInEth = ethers.formatEther(totalCost)

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      totalCost: totalCostInEth
    }
  }

  async sendTransaction(to: string, value: string, options?: { gasLimit?: bigint; gasPrice?: bigint; data?: string }): Promise<{ hash: string }> {
    const signer = walletService.getSigner()
    
    if (!signer) {
      throw new Error('Signer not available')
    }

    try {
      const transaction: any = {
        to,
        value: ethers.parseEther(value)
      }

      if (options?.gasLimit) {
        transaction.gasLimit = options.gasLimit
      }
      if (options?.gasPrice) {
        transaction.gasPrice = options.gasPrice
      }
      if (options?.data) {
        transaction.data = options.data
      }

      const tx = await signer.sendTransaction(transaction)
      
      // Clear relevant caches after transaction
      this.clearBalanceCaches()
      
      return { hash: tx.hash }
    } catch (error) {
      console.error('Transaction send error:', error)
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async estimateGasLimit(to: string, value: string, data?: string): Promise<bigint> {
    const provider = walletService.getProvider()
    const wallet = walletService.getCurrentWallet()
    
    if (!provider || !wallet) {
      throw new Error('Provider or wallet not available')
    }

    try {
      const transaction: any = {
        to,
        value: ethers.parseEther(value),
        from: wallet.address
      }

      if (data) {
        transaction.data = data
      }

      const gasLimit = await provider.estimateGas(transaction)
      // Add 20% buffer to gas estimate
      return gasLimit + (gasLimit * BigInt(20)) / BigInt(100)
    } catch (error) {
      console.error('Gas estimation error:', error)
      // Return a default gas limit if estimation fails
      return BigInt(21000) // Standard ETH transfer gas limit
    }
  }

  async getGasPrice(): Promise<{ gasPrice: bigint; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint }> {
    // Check cache first
    const cacheKey = 'gasPrice'
    const cached = this.getCachedData(cacheKey)
    if (cached) {
      return cached
    }

    const provider = walletService.getProvider()
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      const feeData = await provider.getFeeData()
      
      const result = {
        gasPrice: feeData.gasPrice || BigInt(0),
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined
      }

      // Cache the result
      this.setCachedData(cacheKey, result, this.GAS_PRICE_CACHE_TTL)
      
      return result
    } catch (error) {
      console.error('Error fetching gas price:', error)
      throw new Error(`Failed to get gas price: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getTransactionHistory(address: string): Promise<Transaction[]> {
    // Check cache first
    const cacheKey = `txHistory:${address}`
    const cached = this.getCachedData(cacheKey)
    if (cached) {
      return cached
    }

    const provider = walletService.getProvider()
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      // Get recent blocks
      const currentBlock = await provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 10000) // Last ~10k blocks

      // This is a simplified implementation
      // In a real app, you'd want to use an indexing service like The Graph or Alchemy
      const transactions: Transaction[] = []
      
      // For demo purposes, we'll return an empty array
      // In production, you would use provider.getLogs() with proper filters
      // or integrate with a blockchain indexing service
      
      // Cache the result
      this.setCachedData(cacheKey, transactions, this.TRANSACTION_CACHE_TTL)
      
      return transactions
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      throw new Error(`Failed to get transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async waitForTransaction(hash: string): Promise<Transaction> {
    const provider = walletService.getProvider()
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      const receipt = await provider.waitForTransaction(hash)
      if (!receipt) {
        throw new Error('Transaction receipt not found')
      }

      return {
        hash: receipt.hash,
        from: receipt.from,
        to: receipt.to || '',
        value: '0', // Would need to parse logs for actual value
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
        blockNumber: receipt.blockNumber,
        timestamp: Date.now() // Would need to get block timestamp
      }
    } catch (error) {
      console.error('Error waiting for transaction:', error)
      throw new Error(`Failed to wait for transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }


  // ===== MONITORING AND UTILITIES =====

  startBalanceMonitoring(address: string, callback: (balance: string) => void, intervalMs: number = 30000): void {
    if (this.intervalId) {
      this.stopBalanceMonitoring()
    }

    this.intervalId = setInterval(async () => {
      try {
        const balance = await this.getBalance(address)
        callback(balance)
      } catch (error) {
        console.error('Balance monitoring error:', error)
      }
    }, intervalMs)
  }

  stopBalanceMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  // ===== CACHE MANAGEMENT =====

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private clearBalanceCaches(): void {
    for (const [key] of this.cache) {
      if (key.startsWith('balance:')) {
        this.cache.delete(key)
      }
    }
  }

  clearAllCaches(): void {
    this.cache.clear()
  }

  // ===== NETWORK UTILITIES =====

  async getBlockNumber(): Promise<number> {
    const wallet = walletService.getCurrentWallet()
    const networkId = wallet?.networkId

    return this.withNetworkFallback(async () => {
      const provider = walletService.getProvider()
      if (!provider) {
        throw new Error('Provider not available')
      }

      return await provider.getBlockNumber()
    }, networkId)
  }

  async getNetwork(): Promise<{ name: string; chainId: number }> {
    const provider = walletService.getProvider()
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      const network = await provider.getNetwork()
      return {
        name: network.name,
        chainId: Number(network.chainId)
      }
    } catch (error) {
      console.error('Error getting network:', error)
      throw new Error(`Failed to get network: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ===== BATCH PROCESSING OPERATIONS =====

  async batchBalanceQuery(addresses: string[]): Promise<Map<string, string>> {
    const provider = walletService.getProvider()
    if (!provider) {
      throw new Error('Provider not available')
    }

    const results = new Map<string, string>()
    const promises: Promise<void>[] = []

    // Check cache first and create promises for uncached addresses
    for (const address of addresses) {
      const cacheKey = `balance:${address}`
      const cached = this.getCachedData(cacheKey)
      
      if (cached) {
        results.set(address, cached)
      } else {
        promises.push(
          provider.getBalance(address).then(balance => {
            const formatted = ethers.formatEther(balance)
            this.setCachedData(cacheKey, formatted, this.BALANCE_CACHE_TTL)
            results.set(address, formatted)
          }).catch(error => {
            console.error(`Error fetching balance for ${address}:`, error)
            results.set(address, '0')
          })
        )
      }
    }

    // Execute all pending requests in parallel
    await Promise.all(promises)
    return results
  }

  async batchTokenBalanceQuery(walletAddress: string, tokenAddresses: string[]): Promise<Map<string, Balance>> {
    const provider = walletService.getProvider()
    if (!provider) {
      throw new Error('Provider not available')
    }

    const results = new Map<string, Balance>()
    const promises: Promise<void>[] = []

    // ERC-20 token contract ABI (minimal)
    const tokenABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)', 
      'function symbol() view returns (string)'
    ]

    for (const tokenAddress of tokenAddresses) {
      const cacheKey = `token_balance:${walletAddress}:${tokenAddress}`
      const cached = this.getCachedData(cacheKey)
      
      if (cached) {
        results.set(tokenAddress, cached)
      } else {
        promises.push(
          (async () => {
            try {
              const contract = new ethers.Contract(tokenAddress, tokenABI, provider)
              
              const [balance, decimals, symbol] = await Promise.all([
                contract.balanceOf(walletAddress),
                contract.decimals(),
                contract.symbol()
              ])

              const formattedBalance = ethers.formatUnits(balance, decimals)
              const result: Balance = {
                balance: formattedBalance,
                decimals: Number(decimals),
                symbol: symbol,
                address: tokenAddress
              }

              this.setCachedData(cacheKey, result, this.BALANCE_CACHE_TTL)
              results.set(tokenAddress, result)
            } catch (error) {
              console.error(`Error fetching token balance for ${tokenAddress}:`, error)
              results.set(tokenAddress, {
                balance: '0',
                decimals: 18,
                symbol: 'UNKNOWN',
                address: tokenAddress
              })
            }
          })()
        )
      }
    }

    await Promise.all(promises)
    return results
  }

  // Enhanced caching with automatic cleanup
  private startCacheCleanup(): void {
    if (this.intervalId) return

    this.intervalId = setInterval(() => {
      const now = Date.now()
      for (const [key, cached] of this.cache) {
        if (now > cached.timestamp + cached.ttl) {
          this.cache.delete(key)
        }
      }
    }, 60000) // Clean every minute
  }

  private stopCacheCleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  // Performance monitoring
  async measureRpcLatency(): Promise<number> {
    const wallet = walletService.getCurrentWallet()
    const networkId = wallet?.networkId

    try {
      return await this.withNetworkFallback(async () => {
        const provider = walletService.getProvider()
        if (!provider) {
          throw new Error('Provider not available')
        }

        const start = performance.now()
        await provider.getBlockNumber()
        return performance.now() - start
      }, networkId)
    } catch (error) {
      console.error('Error measuring RPC latency:', error)
      return -1
    }
  }

  // Preload commonly used data
  async preloadEssentialData(address: string): Promise<void> {
    try {
      await Promise.all([
        this.getBalance(address),
        this.getGasPrice(),
        this.getBlockNumber()
      ])
    } catch (error) {
      console.warn('Failed to preload essential data:', error)
    }
  }

  // Initialize service
  init(): void {
    this.startCacheCleanup()
  }

  // Cleanup service
  destroy(): void {
    this.stopCacheCleanup()
    this.clearAllCaches()
    this.balanceRequestQueue.clear()
    if (this.batchProcessTimer) {
      clearTimeout(this.batchProcessTimer)
      this.batchProcessTimer = null
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService()

// Initialize the service
blockchainService.init()

// Legacy exports for backward compatibility
export const transactionService = blockchainService
export const balanceService = blockchainService