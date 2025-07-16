import { ethers } from 'ethers'
import { Balance } from '../types'

export class BalanceService {
  private provider: ethers.Provider | null = null

  setProvider(provider: ethers.Provider): void {
    this.provider = provider
  }

  async getBalance(address: string): Promise<Balance> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    try {
      const balance = await this.provider.getBalance(address)
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