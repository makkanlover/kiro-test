import { 
  SUPPORTED_NETWORKS, 
  getNetworkById, 
  getNetworkByChainId, 
  getApiKeys, 
  getRpcUrls 
} from '../utils'
import { NetworkId } from '../types'

describe('Networks Utils', () => {
  describe('SUPPORTED_NETWORKS', () => {
    test('contains Sepolia network', () => {
      const sepolia = SUPPORTED_NETWORKS[NetworkId.SEPOLIA]
      
      expect(sepolia).toBeDefined()
      expect(sepolia.id).toBe(NetworkId.SEPOLIA)
      expect(sepolia.name).toBe('Sepolia Testnet')
      expect(sepolia.chainId).toBe(11155111)
      expect(sepolia.nativeCurrency.symbol).toBe('ETH')
      expect(sepolia.nativeCurrency.decimals).toBe(18)
    })

    test('contains Amoy network', () => {
      const amoy = SUPPORTED_NETWORKS[NetworkId.AMOY]
      
      expect(amoy).toBeDefined()
      expect(amoy.id).toBe(NetworkId.AMOY)
      expect(amoy.name).toBe('Polygon Amoy Testnet')
      expect(amoy.chainId).toBe(80002)
      expect(amoy.nativeCurrency.symbol).toBe('POL')
      expect(amoy.nativeCurrency.decimals).toBe(18)
    })

    test('has valid RPC URLs', () => {
      const sepolia = SUPPORTED_NETWORKS[NetworkId.SEPOLIA]
      const amoy = SUPPORTED_NETWORKS[NetworkId.AMOY]
      
      expect(sepolia.rpcUrl).toBeTruthy()
      expect(sepolia.rpcUrl).toMatch(/https?:\/\//)
      expect(amoy.rpcUrl).toBeTruthy()
      expect(amoy.rpcUrl).toMatch(/https?:\/\//)
    })

    test('has valid block explorer URLs', () => {
      const sepolia = SUPPORTED_NETWORKS[NetworkId.SEPOLIA]
      const amoy = SUPPORTED_NETWORKS[NetworkId.AMOY]
      
      expect(sepolia.blockExplorerUrl).toBeTruthy()
      expect(sepolia.blockExplorerUrl).toMatch(/https?:\/\//)
      expect(amoy.blockExplorerUrl).toBeTruthy()
      expect(amoy.blockExplorerUrl).toMatch(/https?:\/\//)
    })
  })

  describe('getNetworkById', () => {
    test('returns network by ID', () => {
      const network = getNetworkById(NetworkId.SEPOLIA)
      
      expect(network).toBeDefined()
      expect(network.id).toBe(NetworkId.SEPOLIA)
      expect(network.name).toBe('Sepolia Testnet')
    })

    test('returns different network for different ID', () => {
      const network = getNetworkById(NetworkId.AMOY)
      
      expect(network).toBeDefined()
      expect(network.id).toBe(NetworkId.AMOY)
      expect(network.name).toBe('Polygon Amoy Testnet')
    })
  })

  describe('getNetworkByChainId', () => {
    test('returns network by chain ID', () => {
      const network = getNetworkByChainId(11155111)
      
      expect(network).toBeDefined()
      expect(network!.id).toBe(NetworkId.SEPOLIA)
      expect(network!.chainId).toBe(11155111)
    })

    test('returns different network for different chain ID', () => {
      const network = getNetworkByChainId(80002)
      
      expect(network).toBeDefined()
      expect(network!.id).toBe(NetworkId.AMOY)
      expect(network!.chainId).toBe(80002)
    })

    test('returns undefined for unknown chain ID', () => {
      const network = getNetworkByChainId(999999)
      
      expect(network).toBeUndefined()
    })
  })

  describe('getApiKeys', () => {
    test('returns API keys object', () => {
      const apiKeys = getApiKeys()
      
      expect(apiKeys).toBeDefined()
      expect(typeof apiKeys.etherscan).toBe('string')
      expect(typeof apiKeys.polygonscan).toBe('string')
    })

    test('returns empty strings when no env vars', () => {
      // Clear env vars
      delete process.env.VITE_ETHERSCAN_API_KEY
      delete process.env.VITE_POLYGONSCAN_API_KEY
      
      const apiKeys = getApiKeys()
      
      expect(apiKeys.etherscan).toBe('')
      expect(apiKeys.polygonscan).toBe('')
    })
  })

  describe('getRpcUrls', () => {
    test('returns RPC URLs object', () => {
      const rpcUrls = getRpcUrls()
      
      expect(rpcUrls).toBeDefined()
      expect(rpcUrls.sepolia).toBeDefined()
      expect(rpcUrls.amoy).toBeDefined()
      expect(typeof rpcUrls.sepolia.primary).toBe('string')
      expect(typeof rpcUrls.sepolia.fallback).toBe('string')
      expect(typeof rpcUrls.amoy.primary).toBe('string')
      expect(typeof rpcUrls.amoy.fallback).toBe('string')
    })

    test('has fallback URLs', () => {
      const rpcUrls = getRpcUrls()
      
      expect(rpcUrls.sepolia.fallback).toBe('https://rpc.sepolia.org')
      expect(rpcUrls.amoy.fallback).toBe('https://rpc-amoy.polygon.technology')
    })
  })
})