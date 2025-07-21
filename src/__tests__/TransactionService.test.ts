import { TransactionService } from '../services/TransactionService'
import { walletService } from '../services/WalletService'
import { ethers } from 'ethers'

// Mock walletService
jest.mock('../services/WalletService', () => ({
  walletService: {
    getProvider: jest.fn(),
    getSigner: jest.fn(),
    getCurrentWallet: jest.fn()
  }
}))

describe('TransactionService', () => {
  let transactionService: TransactionService
  let mockProvider: any
  let mockSigner: any

  beforeEach(() => {
    transactionService = new TransactionService()
    
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111 }),
      getTransactionCount: jest.fn().mockResolvedValue(1),
      estimateGas: jest.fn().mockResolvedValue(21000n),
      getFeeData: jest.fn().mockResolvedValue({
        gasPrice: BigInt('20000000000'), // 20 gwei
        maxFeePerGas: BigInt('30000000000'), // 30 gwei
        maxPriorityFeePerGas: BigInt('2000000000') // 2 gwei
      }),
      broadcastTransaction: jest.fn().mockResolvedValue({
        hash: '0xtest123',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: 21000n,
          blockNumber: 123456
        })
      })
    }
    
    mockSigner = {
      address: '0x1234567890123456789012345678901234567890',
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      signTransaction: jest.fn().mockResolvedValue('0xsignedtx'),
      sendTransaction: jest.fn().mockResolvedValue({
        hash: '0xtest123',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: 21000n,
          blockNumber: 123456
        })
      })
    }
    
    ;(walletService.getProvider as jest.Mock).mockReturnValue(mockProvider)
    ;(walletService.getSigner as jest.Mock).mockReturnValue(mockSigner)
    ;(walletService.getCurrentWallet as jest.Mock).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      connectionMethod: 'NEW_WALLET',
      isLocked: false,
      networkId: 'sepolia'
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('sendTransaction', () => {
    test('sends transaction successfully', async () => {
      const to = '0x9876543210987654321098765432109876543210'
      const value = '1.0'
      
      const result = await transactionService.sendTransaction(to, value)
      
      expect(result).toBeDefined()
      expect(result.hash).toBe('0xtest123')
      expect(mockSigner.sendTransaction).toHaveBeenCalledWith({
        to,
        value: BigInt('1000000000000000000') // 1 ETH in wei
      })
    })

    test('sends transaction with gas options', async () => {
      const to = '0x9876543210987654321098765432109876543210'
      const value = '1.0'
      const gasLimit = 25000n
      const gasPrice = BigInt('25000000000') // 25 gwei
      
      const result = await transactionService.sendTransaction(to, value, { gasLimit, gasPrice })
      
      expect(result).toBeDefined()
      expect(mockSigner.sendTransaction).toHaveBeenCalledWith({
        to,
        value: BigInt('1000000000000000000'), // 1 ETH in wei
        gasLimit,
        gasPrice
      })
    })

    test('handles send transaction error', async () => {
      const to = '0x9876543210987654321098765432109876543210'
      const value = '1.0'
      
      mockSigner.sendTransaction.mockRejectedValue(new Error('Transaction failed'))
      
      await expect(transactionService.sendTransaction(to, value)).rejects.toThrow('Transaction failed')
    })

    test('handles no signer', async () => {
      ;(walletService.getSigner as jest.Mock).mockReturnValue(null)
      
      await expect(transactionService.sendTransaction('0x123', '1.0')).rejects.toThrow('Signer not available')
    })
  })

  describe('estimateGas', () => {
    test('estimates gas successfully', async () => {
      const params = {
        to: '0x9876543210987654321098765432109876543210',
        value: '1.0'
      }
      
      const result = await transactionService.estimateGas(params)
      
      expect(result).toBeDefined()
      expect(result.gasLimit).toBe('21000')
      expect(result.gasPrice).toBeDefined()
      expect(result.totalCost).toBeDefined()
    })

    test('estimates gas with data', async () => {
      const params = {
        to: '0x9876543210987654321098765432109876543210',
        value: '1.0',
        data: '0x1234'
      }
      
      const result = await transactionService.estimateGas(params)
      
      expect(result).toBeDefined()
      expect(result.gasLimit).toBe('21000')
      expect(result.gasPrice).toBeDefined()
      expect(result.totalCost).toBeDefined()
    })

    test('handles estimate gas error', async () => {
      const to = '0x9876543210987654321098765432109876543210'
      const value = '1.0'
      
      mockProvider.estimateGas.mockRejectedValue(new Error('Gas estimation failed'))
      
      await expect(transactionService.estimateGas(to, value)).rejects.toThrow('Gas estimation failed')
    })
  })

  describe('getGasPrice', () => {
    test('gets gas price successfully', async () => {
      const result = await transactionService.getGasPrice()
      
      expect(result).toBeDefined()
      expect(result.gasPrice).toBe(BigInt('20000000000'))
      expect(result.maxFeePerGas).toBe(BigInt('30000000000'))
      expect(result.maxPriorityFeePerGas).toBe(BigInt('2000000000'))
    })

    test('handles gas price error', async () => {
      mockProvider.getFeeData.mockRejectedValue(new Error('Fee data failed'))
      
      await expect(transactionService.getGasPrice()).rejects.toThrow('Fee data failed')
    })

    test('handles no provider', async () => {
      ;(walletService.getProvider as jest.Mock).mockReturnValue(null)
      
      await expect(transactionService.getGasPrice()).rejects.toThrow('Provider not available')
    })
  })

  describe('getTransactionCount', () => {
    test('gets transaction count successfully', async () => {
      const result = await transactionService.getTransactionCount()
      
      expect(result).toBe(1)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledWith(mockSigner.address)
    })

    test('gets transaction count for specific address', async () => {
      const address = '0x9876543210987654321098765432109876543210'
      
      const result = await transactionService.getTransactionCount(address)
      
      expect(result).toBe(1)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledWith(address)
    })

    test('handles transaction count error', async () => {
      mockProvider.getTransactionCount.mockRejectedValue(new Error('Nonce failed'))
      
      await expect(transactionService.getTransactionCount()).rejects.toThrow('Nonce failed')
    })

    test('handles no signer', async () => {
      ;(walletService.getSigner as jest.Mock).mockReturnValue(null)
      
      await expect(transactionService.getTransactionCount()).rejects.toThrow('Signer not available')
    })
  })

  describe('waitForTransaction', () => {
    test('waits for transaction successfully', async () => {
      const txHash = '0xtest123'
      const mockTx = {
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: 21000n,
          blockNumber: 123456
        })
      }
      
      mockProvider.getTransaction = jest.fn().mockResolvedValue(mockTx)
      
      const result = await transactionService.waitForTransaction(txHash)
      
      expect(result).toBeDefined()
      expect(result.status).toBe(1)
      expect(result.gasUsed).toBe(21000n)
      expect(result.blockNumber).toBe(123456)
    })

    test('waits for transaction with confirmations', async () => {
      const txHash = '0xtest123'
      const confirmations = 3
      const mockTx = {
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: 21000n,
          blockNumber: 123456
        })
      }
      
      mockProvider.getTransaction = jest.fn().mockResolvedValue(mockTx)
      
      const result = await transactionService.waitForTransaction(txHash, confirmations)
      
      expect(result).toBeDefined()
      expect(mockTx.wait).toHaveBeenCalledWith(confirmations)
    })

    test('handles wait for transaction error', async () => {
      const txHash = '0xtest123'
      
      mockProvider.getTransaction = jest.fn().mockRejectedValue(new Error('Transaction not found'))
      
      await expect(transactionService.waitForTransaction(txHash)).rejects.toThrow('Transaction not found')
    })

    test('handles no provider', async () => {
      ;(walletService.getProvider as jest.Mock).mockReturnValue(null)
      
      await expect(transactionService.waitForTransaction('0xtest123')).rejects.toThrow('Provider not available')
    })
  })
})