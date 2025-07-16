import { ethers } from 'ethers'
import { SendTransactionParams, GasEstimate, TransactionStatus, Transaction } from '../types'
import { walletService } from './WalletService'

export class TransactionService {
  async estimateGas(params: SendTransactionParams): Promise<GasEstimate> {
    const provider = walletService.getProvider()
    const signer = walletService.getSigner()
    
    if (!provider || !signer) {
      throw new Error('Provider or signer not available')
    }

    try {
      // Create transaction object
      const transaction = {
        to: params.to,
        value: ethers.parseEther(params.value)
      }

      // Estimate gas limit
      const gasLimit = await provider.estimateGas({
        ...transaction,
        from: await signer.getAddress()
      })

      // Get current gas price
      const feeData = await provider.getFeeData()
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei')

      // Calculate total cost
      const totalCost = gasLimit * gasPrice
      const totalCostInEth = ethers.formatEther(totalCost)

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        totalCost: totalCostInEth
      }
    } catch (error) {
      console.error('Gas estimation error:', error)
      throw new Error('Failed to estimate gas')
    }
  }

  async sendTransaction(params: SendTransactionParams, _password: string): Promise<string> {
    const provider = walletService.getProvider()
    const signer = walletService.getSigner()
    
    if (!provider || !signer) {
      throw new Error('Provider or signer not available')
    }

    try {
      // For MetaMask, we don't need password verification
      // For local wallets, we would verify the password here
      
      const transaction = {
        to: params.to,
        value: ethers.parseEther(params.value),
        gasLimit: params.gasLimit,
        gasPrice: params.gasPrice
      }

      const tx = await signer.sendTransaction(transaction)
      return tx.hash
    } catch (error) {
      console.error('Transaction send error:', error)
      throw new Error('Failed to send transaction')
    }
  }

  async getTransactionHistory(address: string, limit: number = 10): Promise<Transaction[]> {
    const provider = walletService.getProvider()
    
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      // This is a simplified implementation
      // In a real app, you would use a block explorer API or index transactions
      const transactions: Transaction[] = []

      // For demonstration, we'll create mock transactions
      // In reality, you would query the blockchain or use an API
      for (let i = 0; i < Math.min(limit, 5); i++) {
        const mockTx: Transaction = {
          hash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          from: address,
          to: `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          value: (Math.random() * 0.1).toFixed(6),
          gasPrice: '20000000000',
          gasUsed: '21000',
          timestamp: Date.now() - (i * 60000), // i minutes ago
          status: TransactionStatus.SUCCESS,
          networkId: walletService.getCurrentWallet()?.networkId || 'sepolia' as any
        }
        transactions.push(mockTx)
      }

      return transactions
    } catch (error) {
      console.error('Transaction history error:', error)
      throw new Error('Failed to fetch transaction history')
    }
  }

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    const provider = walletService.getProvider()
    
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      const receipt = await provider.getTransactionReceipt(txHash)
      
      if (!receipt) {
        return TransactionStatus.PENDING
      }
      
      return receipt.status === 1 ? TransactionStatus.SUCCESS : TransactionStatus.FAILED
    } catch (error) {
      console.error('Transaction status error:', error)
      return TransactionStatus.FAILED
    }
  }
}

export const transactionService = new TransactionService()