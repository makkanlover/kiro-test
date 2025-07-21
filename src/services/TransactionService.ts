import { ethers } from 'ethers'
import { SendTransactionParams, GasEstimate, TransactionStatus, Transaction } from '../types'
import { walletService } from './WalletService'

export class TransactionService {
  async estimateGas(params: SendTransactionParams): Promise<GasEstimate> {
    const gasLimit = await this.estimateGasLimit(params.to, params.value)
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

  async sendTransaction(to: string, value: string, options?: { gasLimit?: bigint; gasPrice?: bigint }): Promise<{ hash: string }> {
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

      const tx = await signer.sendTransaction(transaction)
      return { hash: tx.hash }
    } catch (error) {
      console.error('Transaction send error:', error)
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async estimateGasLimit(to: string, value: string, data?: string): Promise<bigint> {
    const provider = walletService.getProvider()
    const signer = walletService.getSigner()
    
    if (!provider || !signer) {
      throw new Error('Provider not available')
    }

    try {
      const transaction: any = {
        to,
        value: ethers.parseEther(value),
        from: await signer.getAddress()
      }

      if (data) {
        transaction.data = data
      }

      return await provider.estimateGas(transaction)
    } catch (error) {
      console.error('Gas estimation error:', error)
      throw new Error(`Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getGasPrice(): Promise<{ gasPrice: bigint; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint }> {
    const provider = walletService.getProvider()
    
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      const feeData = await provider.getFeeData()
      return {
        gasPrice: feeData.gasPrice || ethers.parseUnits('20', 'gwei'),
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined
      }
    } catch (error) {
      console.error('Fee data error:', error)
      throw new Error(`Fee data failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getTransactionCount(address?: string): Promise<number> {
    const provider = walletService.getProvider()
    const signer = walletService.getSigner()
    
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      const targetAddress = address || (signer ? await signer.getAddress() : undefined)
      if (!targetAddress) {
        throw new Error('Signer not available')
      }

      return await provider.getTransactionCount(targetAddress)
    } catch (error) {
      console.error('Transaction count error:', error)
      throw new Error(`Nonce failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async waitForTransaction(txHash: string, confirmations?: number): Promise<{ status: number; gasUsed: bigint; blockNumber: number }> {
    const provider = walletService.getProvider()
    
    if (!provider) {
      throw new Error('Provider not available')
    }

    try {
      const tx = await provider.getTransaction(txHash)
      if (!tx) {
        throw new Error('Transaction not found')
      }

      const receipt = await tx.wait(confirmations)
      if (!receipt) {
        throw new Error('Transaction receipt not available')
      }

      return {
        status: receipt.status || 0,
        gasUsed: receipt.gasUsed,
        blockNumber: receipt.blockNumber
      }
    } catch (error) {
      console.error('Wait for transaction error:', error)
      throw new Error(`Transaction not found: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sendTransactionWithParams(params: SendTransactionParams, _password: string): Promise<string> {
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