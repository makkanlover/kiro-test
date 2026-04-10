import { WalletConnectService } from '../services/WalletConnectService'

// Mock WalletConnect dependencies
jest.mock('@walletconnect/sign-client', () => ({
  SignClient: {
    init: jest.fn().mockResolvedValue({
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue({
        uri: 'wc:test-uri',
        approval: jest.fn().mockResolvedValue({
          topic: 'test-topic',
          namespaces: {
            eip155: {
              accounts: ['eip155:11155111:0x1234567890123456789012345678901234567890'],
              chains: ['eip155:11155111']
            }
          },
          expiry: Date.now() / 1000 + 3600
        })
      }),
      request: jest.fn().mockResolvedValue('0xtest-transaction-hash'),
      disconnect: jest.fn().mockResolvedValue(true),
      session: {
        getAll: jest.fn().mockReturnValue([])
      }
    })
  }
}))

jest.mock('@walletconnect/modal', () => ({
  WalletConnectModal: jest.fn().mockImplementation(() => ({
    openModal: jest.fn(),
    closeModal: jest.fn()
  }))
}))

jest.mock('@walletconnect/utils', () => ({
  getSdkError: jest.fn().mockReturnValue({ message: 'USER_DISCONNECTED' })
}))

describe('WalletConnectService', () => {
  let service: WalletConnectService

  beforeEach(() => {
    service = new WalletConnectService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    test('should initialize WalletConnect with default configuration', async () => {
      const result = await service.initializeWalletConnect({ projectId: 'test-project-id' })
      
      expect(result).toHaveProperty('uri')
      expect(typeof result.uri).toBe('string')
    })

    test('should initialize with custom configuration', async () => {
      const customConfig = {
        projectId: 'custom-project-id',
        chains: ['eip155:1', 'eip155:137']
      }
      
      const result = await service.initializeWalletConnect(customConfig)
      expect(result).toHaveProperty('uri')
    })

    test('should handle initialization errors gracefully', async () => {
      // Mock SignClient.init to throw an error
      const { SignClient } = require('@walletconnect/sign-client')
      SignClient.init.mockRejectedValueOnce(new Error('Network error'))
      
      await expect(service.initializeWalletConnect()).rejects.toThrow()
    })
  })

  describe('Connection Management', () => {
    test('should connect wallet successfully', async () => {
      const walletInfo = await service.connectWallet({ projectId: 'test-project-id' })
      
      expect(walletInfo).toHaveProperty('address')
      expect(walletInfo).toHaveProperty('connectionMethod')
      expect(walletInfo).toHaveProperty('isLocked', false)
      expect(walletInfo.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    test('should return connection state', () => {
      const state = service.getConnectionState()
      
      expect(state).toHaveProperty('isConnecting')
      expect(state).toHaveProperty('isConnected')
      expect(state).toHaveProperty('error')
      expect(state).toHaveProperty('accounts')
      expect(state).toHaveProperty('chainId')
    })

    test('should handle connection state callbacks', () => {
      const mockCallback = jest.fn()
      service.setConnectionStateCallback(mockCallback)
      
      // The callback should be set (we can't easily test the actual call without triggering events)
      expect(mockCallback).not.toHaveBeenCalled() // Initially not called
    })
  })

  describe('Transaction Operations', () => {
    beforeEach(async () => {
      // Connect wallet first
      await service.connectWallet({ projectId: 'test-project-id' })
    })

    test('should send transaction successfully', async () => {
      const transaction = {
        to: '0x742d35cc6338c0532c58d82c5ae5f1234567890',
        value: '0x9184e72a000', // 0.01 ETH
        gas: '0x5208'
      }
      
      const txHash = await service.sendTransaction(transaction)
      expect(txHash).toBe('0xtest-transaction-hash')
    })

    test('should validate transaction parameters', async () => {
      const invalidTransaction = {
        // Missing required fields
        gas: '0x5208'
      }
      
      await expect(service.sendTransaction(invalidTransaction)).rejects.toThrow('missing required fields')
    })

    test('should handle transaction errors', async () => {
      const { SignClient } = require('@walletconnect/sign-client')
      const mockClient = await SignClient.init()
      mockClient.request.mockRejectedValueOnce(new Error('Transaction failed'))
      
      const transaction = {
        to: '0x742d35cc6338c0532c58d82c5ae5f1234567890',
        value: '0x9184e72a000'
      }
      
      await expect(service.sendTransaction(transaction)).rejects.toThrow()
    })
  })

  describe('Message Signing', () => {
    beforeEach(async () => {
      await service.connectWallet({ projectId: 'test-project-id' })
    })

    test('should sign message successfully', async () => {
      const message = 'Hello WalletConnect!'
      const signature = await service.signMessage(message)
      
      expect(signature).toBe('0xtest-transaction-hash') // Using same mock return
    })

    test('should handle signing errors', async () => {
      const { SignClient } = require('@walletconnect/sign-client')
      const mockClient = await SignClient.init()
      mockClient.request.mockRejectedValueOnce(new Error('Signing failed'))
      
      await expect(service.signMessage('test')).rejects.toThrow()
    })
  })

  describe('Session Management', () => {
    test('should check connection status', () => {
      expect(service.isConnected()).toBe(false)
    })

    test('should return account information', async () => {
      await service.connectWallet({ projectId: 'test-project-id' })
      
      const accounts = service.getAccounts()
      expect(Array.isArray(accounts)).toBe(true)
      expect(accounts.length).toBeGreaterThan(0)
    })

    test('should return chain ID', async () => {
      await service.connectWallet({ projectId: 'test-project-id' })
      
      const chainId = service.getChainId()
      expect(typeof chainId).toBe('number')
      expect(chainId).toBe(11155111) // Sepolia
    })

    test('should disconnect successfully', async () => {
      await service.connectWallet({ projectId: 'test-project-id' })
      await service.disconnect()
      
      expect(service.isConnected()).toBe(false)
    })
  })

  describe('Configuration and Utilities', () => {
    test('should return supported chains', () => {
      const chains = service.getSupportedChains()
      expect(Array.isArray(chains)).toBe(true)
      expect(chains).toContain('eip155:11155111')
      expect(chains).toContain('eip155:80002')
    })

    test('should return supported methods', () => {
      const methods = service.getSupportedMethods()
      expect(Array.isArray(methods)).toBe(true)
      expect(methods).toContain('eth_sendTransaction')
      expect(methods).toContain('personal_sign')
    })

    test('should generate QR code URI', async () => {
      const uri = await service.generateQRCode({ projectId: 'test-project-id' })
      expect(typeof uri).toBe('string')
      expect(uri).toContain('wc:')
    })

    test('should handle modal operations', () => {
      // These operations should not throw
      expect(() => service.openModal('wc:test-uri')).not.toThrow()
      expect(() => service.closeModal()).not.toThrow()
    })

    test('should manage cache correctly', () => {
      // Test cache operations
      expect(() => service.clearCache()).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    test('should handle missing project ID', async () => {
      const configWithoutProjectId = {
        projectId: 'YOUR_PROJECT_ID' // Invalid default
      }
      
      await expect(service.initializeWalletConnect(configWithoutProjectId)).rejects.toThrow('project ID')
    })

    test('should handle disconnected state gracefully', async () => {
      // Try to send transaction without connecting
      const transaction = {
        to: '0x742d35cc6338c0532c58d82c5ae5f1234567890',
        value: '0x9184e72a000'
      }
      
      await expect(service.sendTransaction(transaction)).rejects.toThrow('not connected')
    })
  })
})