import { BalanceService } from '../services/BalanceService'
import { walletService } from '../services/WalletService'
import { ethers } from 'ethers'

// Mock walletService
jest.mock('../services/WalletService', () => ({
  walletService: {
    getProvider: jest.fn(),
    getCurrentWallet: jest.fn()
  }
}))

describe('BalanceService', () => {
  let balanceService: BalanceService
  let mockProvider: any

  beforeEach(() => {
    balanceService = new BalanceService()
    
    mockProvider = {
      getBalance: jest.fn(),
      getNetwork: jest.fn()
    }
    
    ;(walletService.getProvider as jest.Mock).mockReturnValue(mockProvider)
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

  describe('getBalance', () => {
    test('gets balance successfully', async () => {
      const mockBalance = BigInt('1500000000000000000') // 1.5 ETH in wei
      mockProvider.getBalance.mockResolvedValue(mockBalance)
      
      const result = await balanceService.getBalance()
      
      expect(result).toBe('1.5')
      expect(mockProvider.getBalance).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
    })

    test('gets balance for specific address', async () => {
      const address = '0x9876543210987654321098765432109876543210'
      const mockBalance = BigInt('2000000000000000000') // 2.0 ETH in wei
      mockProvider.getBalance.mockResolvedValue(mockBalance)
      
      const result = await balanceService.getBalance(address)
      
      expect(result).toBe('2.0')
      expect(mockProvider.getBalance).toHaveBeenCalledWith(address)
    })

    test('handles provider error', async () => {
      mockProvider.getBalance.mockRejectedValue(new Error('Network error'))
      
      await expect(balanceService.getBalance()).rejects.toThrow('Failed to get balance: Network error')
    })

    test('handles no provider', async () => {
      ;(walletService.getProvider as jest.Mock).mockReturnValue(null)
      
      await expect(balanceService.getBalance()).rejects.toThrow('Provider not available')
    })

    test('handles no current wallet', async () => {
      ;(walletService.getCurrentWallet as jest.Mock).mockReturnValue(null)
      
      await expect(balanceService.getBalance()).rejects.toThrow('No wallet connected')
    })
  })

  describe('getFormattedBalance', () => {
    test('formats balance with default decimals', async () => {
      const mockBalance = BigInt('1123456789000000000') // 1.123456789 ETH in wei
      mockProvider.getBalance.mockResolvedValue(mockBalance)
      
      const result = await balanceService.getFormattedBalance()
      
      expect(result).toBe('1.123')
    })

    test('formats balance with custom decimals', async () => {
      const mockBalance = BigInt('1123456789000000000') // 1.123456789 ETH in wei
      mockProvider.getBalance.mockResolvedValue(mockBalance)
      
      const result = await balanceService.getFormattedBalance(undefined, 6)
      
      expect(result).toBe('1.123457')
    })

    test('formats balance with custom unit', async () => {
      const mockBalance = BigInt('1000000000000000000') // 1.0 ETH in wei
      mockProvider.getBalance.mockResolvedValue(mockBalance)
      
      const result = await balanceService.getFormattedBalance(undefined, 18, 'gwei')
      
      expect(result).toBe('1000000000.0')
    })
  })

  describe('watchBalance', () => {
    test('sets up balance watcher', () => {
      const callback = jest.fn()
      const address = '0x1234567890123456789012345678901234567890'
      
      // Mock setInterval
      const mockSetInterval = jest.fn().mockReturnValue(123)
      global.setInterval = mockSetInterval
      
      balanceService.watchBalance(callback, address)
      
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 10000)
    })

    test('stops balance watcher', () => {
      const callback = jest.fn()
      const mockClearInterval = jest.fn()
      global.clearInterval = mockClearInterval
      
      // Start watching
      const mockSetInterval = jest.fn().mockReturnValue(123)
      global.setInterval = mockSetInterval
      
      balanceService.watchBalance(callback)
      balanceService.stopWatching()
      
      expect(mockClearInterval).toHaveBeenCalledWith(123)
    })
  })
})