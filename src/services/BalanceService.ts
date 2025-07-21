import { ethers } from 'ethers'
import { Balance } from '../types'
import { walletService } from './WalletService'

export class BalanceService {
  private intervalId: NodeJS.Timeout | null = null

  async getBalance(address?: string): Promise<string> {
    const provider = walletService.getProvider()
    
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      const targetAddress = address || walletService.getCurrentWallet()?.address
      if (!targetAddress) {
        throw new Error('No wallet connected')
      }

      const balance = await provider.getBalance(targetAddress)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Error fetching balance:', error)
      throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getFormattedBalance(address?: string, decimals: number = 3, unit: string = 'ether'): Promise<string> {
    const provider = walletService.getProvider()
    
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      const targetAddress = address || walletService.getCurrentWallet()?.address
      if (!targetAddress) {
        throw new Error('No wallet connected')
      }

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

  watchBalance(callback: (balance: string) => void, address?: string): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    this.intervalId = setInterval(async () => {
      try {
        const balance = await this.getBalance(address)
        callback(balance)
      } catch (error) {
        console.error('Error watching balance:', error)
      }
    }, 10000) // Update every 10 seconds
  }

  stopWatching(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async getBalanceObject(address: string): Promise<Balance> {
    const provider = walletService.getProvider()
    
    if (!provider) {
      throw new Error('Provider not initialized')
    }

    try {
      const balance = await provider.getBalance(address)
      const formattedBalance = ethers.formatEther(balance)
      
      return {
        balance: formattedBalance,
        symbol: 'ETH',
        decimals: 18
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
      throw new Error('Failed to fetch balance')
    }
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<Balance> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    try {
      // ERC-20 token contract ABI for balanceOf and decimals
      const tokenABI = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ]
      
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.provider)
      
      const [balance, decimals, symbol] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals(),
        tokenContract.symbol()
      ])
      
      const formattedBalance = ethers.formatUnits(balance, decimals)
      
      return {
        balance: formattedBalance,
        symbol,
        decimals
      }
    } catch (error) {
      console.error('Error fetching token balance:', error)
      throw new Error('Failed to fetch token balance')
    }
  }
}

export const balanceService = new BalanceService()