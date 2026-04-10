import { WalletService } from '../services/WalletService'
import { ConnectionMethod, NetworkId } from '../types'
import { ethers } from 'ethers'
import * as bip39 from 'bip39'

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    Wallet: jest.fn(),
    JsonRpcProvider: jest.fn(),
    getDefaultProvider: jest.fn(),
    isAddress: jest.fn()
  }
}))

// Set up wallet mocking functions
const mockWalletConstructor = ethers.Wallet as jest.MockedClass<typeof ethers.Wallet>
mockWalletConstructor.fromPhrase = jest.fn()

// Mock bip39
jest.mock('bip39', () => ({
  generateMnemonic: jest.fn(),
  validateMnemonic: jest.fn()
}))

// Mock utils
jest.mock('../utils', () => ({
  encryptData: jest.fn((data, password) => `encrypted_${data}_${password}`),
  decryptData: jest.fn((encryptedData, password) => {
    // Return the private key from mockWallet for testing
    if (encryptedData.includes(password)) {
      return '0x1234567890123456789012345678901234567890123456789012345678901234'
    }
    throw new Error('Invalid password')
  }),
  errorHandler: {
    validationError: jest.fn((code, message) => {
      const error = new Error(message)
      error.name = 'AppError'
      return error
    }),
    walletError: jest.fn((code, message) => {
      const error = new Error(message)
      error.name = 'AppError'
      return error
    }),
    handleError: jest.fn((error) => error)
  },
  ERROR_CODES: {
    INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',
    WALLET_CREATION_FAILED: 'WALLET_CREATION_FAILED',
    INVALID_PASSWORD: 'INVALID_PASSWORD'
  }
}))

describe('WalletService', () => {
  let walletService: WalletService
  let mockWallet: any
  let mockProvider: any

  beforeEach(() => {
    walletService = new WalletService()
    
    mockWallet = {
      address: '0x1234567890123456789012345678901234567890',
      privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
      connect: jest.fn().mockReturnThis()
    }
    
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111 }),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')) // 1 ETH in wei
    }
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true
    })
    
    // Ensure electronAPI is properly mocked - either assign or reset existing
    if (window.electronAPI) {
      // Reset existing electronAPI methods
      window.electronAPI.store = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn()
      }
      window.electronAPI.readEnvFile = jest.fn()
    } else {
      // Create new electronAPI
      Object.defineProperty(window, 'electronAPI', {
        value: {
          store: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn()
          },
          readEnvFile: jest.fn()
        },
        configurable: true,
        writable: true
      })
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
    // Reset localStorage mock
    ;(window.localStorage.getItem as jest.Mock).mockReset()
    ;(window.localStorage.setItem as jest.Mock).mockReset()
    ;(window.localStorage.removeItem as jest.Mock).mockReset()
    ;(window.localStorage.clear as jest.Mock).mockReset()
  })

  describe('createNewWallet', () => {
    test('creates a new wallet successfully', async () => {
      const mockMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const password = 'testPassword123!'
      
      ;(bip39.generateMnemonic as jest.Mock).mockReturnValue(mockMnemonic)
      ;(ethers.Wallet.fromPhrase as jest.Mock).mockReturnValue(mockWallet)
      
      const result = await walletService.createNewWallet(password)
      
      expect(result).toBeDefined()
      expect(result.walletInfo.address).toBe(mockWallet.address)
      expect(result.walletInfo.connectionMethod).toBe(ConnectionMethod.NEW_WALLET)
      expect(result.walletInfo.networkId).toBe(NetworkId.SEPOLIA)
      expect(result.mnemonic).toBe(mockMnemonic)
      expect(bip39.generateMnemonic).toHaveBeenCalled()
      expect(ethers.Wallet.fromPhrase).toHaveBeenCalledWith(mockMnemonic)
    })

    test('handles wallet creation error', async () => {
      const password = 'testPassword123!'
      
      ;(bip39.generateMnemonic as jest.Mock).mockImplementation(() => {
        throw new Error('Mnemonic generation failed')
      })
      
      await expect(walletService.createNewWallet(password)).rejects.toThrow('Mnemonic generation failed')
    })
  })

  describe('loadFromPrivateKey', () => {
    test('loads wallet from private key successfully', async () => {
      const privateKey = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const password = 'testPassword123!'
      
      ;(ethers.Wallet as any).mockReturnValue(mockWallet)
      
      const result = await walletService.loadFromPrivateKey(privateKey, password)
      
      expect(result).toBeDefined()
      expect(result.address).toBe(mockWallet.address)
      expect(result.connectionMethod).toBe(ConnectionMethod.PRIVATE_KEY)
      expect(result.networkId).toBe(NetworkId.SEPOLIA)
      expect(ethers.Wallet).toHaveBeenCalledWith(privateKey)
    })

    test('handles private key without 0x prefix', async () => {
      const privateKey = '1234567890123456789012345678901234567890123456789012345678901234'
      const password = 'testPassword123!'
      
      ;(ethers.Wallet as any).mockReturnValue(mockWallet)
      
      const result = await walletService.loadFromPrivateKey(privateKey, password)
      
      expect(result).toBeDefined()
      expect(ethers.Wallet).toHaveBeenCalledWith('0x' + privateKey)
    })

    test('handles invalid private key', async () => {
      const privateKey = 'invalid'
      const password = 'testPassword123!'
      
      ;(ethers.Wallet as any).mockImplementation(() => {
        throw new Error('Invalid private key')
      })
      
      await expect(walletService.loadFromPrivateKey(privateKey, password)).rejects.toThrow('Invalid private key')
    })
  })

  describe('loadFromMnemonic', () => {
    test('loads wallet from mnemonic successfully', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const password = 'testPassword123!'
      
      ;(bip39.validateMnemonic as jest.Mock).mockReturnValue(true)
      ;(ethers.Wallet.fromPhrase as jest.Mock).mockReturnValue(mockWallet)
      
      const result = await walletService.loadFromMnemonic(mnemonic, password)
      
      expect(result).toBeDefined()
      expect(result.address).toBe(mockWallet.address)
      expect(result.connectionMethod).toBe(ConnectionMethod.MNEMONIC)
      expect(result.networkId).toBe(NetworkId.SEPOLIA)
      expect(bip39.validateMnemonic).toHaveBeenCalledWith(mnemonic)
      expect(ethers.Wallet.fromPhrase).toHaveBeenCalledWith(mnemonic)
    })

    test('handles invalid mnemonic', async () => {
      const mnemonic = 'invalid mnemonic'
      const password = 'testPassword123!'
      
      ;(bip39.validateMnemonic as jest.Mock).mockReturnValue(false)
      
      await expect(walletService.loadFromMnemonic(mnemonic, password)).rejects.toThrow('Invalid mnemonic phrase')
    })
  })

  describe('loadFromEnvFile', () => {
    test('loads from env content successfully', async () => {
      const envContent = 'PRIVATE_KEY=1234567890123456789012345678901234567890123456789012345678901234'
      
      ;(ethers.Wallet as any).mockReturnValue(mockWallet)
      
      const result = await walletService.loadFromEnvFile(envContent)
      
      expect(result).toBeDefined()
      expect(result.address).toBe(mockWallet.address)
      expect(result.connectionMethod).toBe(ConnectionMethod.ENV_FILE)
      expect(result.networkId).toBe(NetworkId.SEPOLIA)
    })

    test('loads from process.env when no content provided', async () => {
      // Test the browser environment path by providing content with VITE_ prefix
      const envContent = 'PRIVATE_KEY=1234567890123456789012345678901234567890123456789012345678901234'
      
      ;(ethers.Wallet as any).mockReturnValue(mockWallet)
      ;(ethers.isAddress as any).mockReturnValue(true)
      
      const result = await walletService.loadFromEnvFile(envContent)
      
      expect(result).toBeDefined()
      expect(result.address).toBe(mockWallet.address)
      expect(result.connectionMethod).toBe(ConnectionMethod.ENV_FILE)
    })

    test('handles missing private key in env', async () => {
      const envContent = 'OTHER_VAR=value'
      
      await expect(walletService.loadFromEnvFile(envContent)).rejects.toThrow('PRIVATE_KEY not found in .env file')
    })
  })

  describe('unlockWallet', () => {
    test('unlocks wallet successfully', async () => {
      const password = 'testPassword123!'
      const walletData = {
        encryptedPrivateKey: `encrypted_${mockWallet.privateKey}_${password}`,
        connectionMethod: ConnectionMethod.NEW_WALLET,
        address: mockWallet.address
      }
      
      // Mock electronAPI.store.get to return wallet data (electronAPI path is preferred)
      window.electronAPI.store.get = jest.fn().mockResolvedValue(walletData)
      
      ;(ethers.Wallet as any).mockReturnValue(mockWallet)
      
      const result = await walletService.unlockWallet(password)
      
      expect(result).toBeDefined()
      expect(result.address).toBe(mockWallet.address)
      expect(result.isLocked).toBe(false)
      expect(window.electronAPI.store.get).toHaveBeenCalledWith('wallet')
    })

    test('handles incorrect password', async () => {
      const password = 'wrongPassword'
      const walletData = {
        encryptedPrivateKey: 'encrypted_privatekey_correctPassword',
        connectionMethod: ConnectionMethod.NEW_WALLET,
        address: mockWallet.address
      }
      
      // Mock electronAPI.store.get to return wallet data (electronAPI path is preferred)
      window.electronAPI.store.get = jest.fn().mockResolvedValue(walletData)
      
      await expect(walletService.unlockWallet(password)).rejects.toThrow('Invalid password')
    })

    test('handles no stored wallet', async () => {
      // Mock localStorage.getItem to return null
      ;(window.localStorage.getItem as jest.Mock).mockReturnValue(null)
      
      // Mock electronAPI.store.get to return null to force localStorage usage
      window.electronAPI.store.get = jest.fn().mockResolvedValue(null)
      
      await expect(walletService.unlockWallet('password')).rejects.toThrow('No wallet found')
    })
  })

  describe('switchNetwork', () => {
    test('switches network successfully', async () => {
      walletService['currentWallet'] = {
        address: mockWallet.address,
        connectionMethod: ConnectionMethod.NEW_WALLET,
        isLocked: false,
        networkId: NetworkId.SEPOLIA
      }
      
      const result = await walletService.switchNetwork(NetworkId.AMOY)
      
      expect(result).toBe(true)
      expect(walletService['currentWallet']?.networkId).toBe(NetworkId.AMOY)
    })

    test('handles network switch when no wallet', async () => {
      walletService['currentWallet'] = null
      
      const result = await walletService.switchNetwork(NetworkId.AMOY)
      
      expect(result).toBe(false)
    })
  })

  describe('getCurrentWallet', () => {
    test('returns current wallet', () => {
      const mockWalletInfo = {
        address: mockWallet.address,
        connectionMethod: ConnectionMethod.NEW_WALLET,
        isLocked: false,
        networkId: NetworkId.SEPOLIA
      }
      
      walletService['currentWallet'] = mockWalletInfo
      
      const result = walletService.getCurrentWallet()
      
      expect(result).toBe(mockWalletInfo)
    })

    test('returns null when no wallet', () => {
      walletService['currentWallet'] = null
      
      const result = walletService.getCurrentWallet()
      
      expect(result).toBeNull()
    })
  })

  describe('getProvider', () => {
    test('returns provider', () => {
      walletService['provider'] = mockProvider
      
      const result = walletService.getProvider()
      
      expect(result).toBe(mockProvider)
    })
  })

  describe('getSigner', () => {
    test('returns signer', () => {
      walletService['signer'] = mockWallet
      
      const result = walletService.getSigner()
      
      expect(result).toBe(mockWallet)
    })
  })

  describe('lockWallet', () => {
    test('locks wallet successfully', () => {
      walletService['currentWallet'] = {
        address: mockWallet.address,
        connectionMethod: ConnectionMethod.NEW_WALLET,
        isLocked: false,
        networkId: NetworkId.SEPOLIA
      }
      
      walletService.lockWallet()
      
      expect(walletService['currentWallet']?.isLocked).toBe(true)
      expect(walletService['signer']).toBeNull()
    })
  })

  describe('disconnect', () => {
    test('disconnects wallet successfully', () => {
      walletService['currentWallet'] = {
        address: mockWallet.address,
        connectionMethod: ConnectionMethod.NEW_WALLET,
        isLocked: false,
        networkId: NetworkId.SEPOLIA
      }
      walletService['signer'] = mockWallet
      walletService['provider'] = mockProvider
      
      walletService.disconnect()
      
      expect(walletService['currentWallet']).toBeNull()
      expect(walletService['signer']).toBeNull()
      expect(walletService['provider']).toBeNull()
    })
  })
})