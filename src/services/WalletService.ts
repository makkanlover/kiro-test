import { ethers } from 'ethers'
import * as bip39 from 'bip39'
import { encryptData, decryptData, SUPPORTED_NETWORKS } from '../utils'
import { ConnectionMethod, WalletInfo, NetworkId } from '../types'
import { errorHandler, ERROR_CODES } from '../utils'

export class WalletService {
  private provider: ethers.Provider | null = null
  private signer: ethers.Signer | null = null
  private currentWallet: WalletInfo | null = null

  async createNewWallet(password: string): Promise<{
    walletInfo: WalletInfo
    mnemonic: string
  }> {
    const mnemonic = bip39.generateMnemonic()
    const wallet = ethers.Wallet.fromPhrase(mnemonic)
    
    const encryptedPrivateKey = encryptData(wallet.privateKey, password)
    
    // Store wallet data
    const walletData = {
      encryptedPrivateKey,
      connectionMethod: ConnectionMethod.NEW_WALLET,
      address: wallet.address,
      mnemonic: encryptData(mnemonic, password)
    }
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.store.set('wallet', walletData)
    } else {
      localStorage.setItem('wallet', JSON.stringify(walletData))
    }
    
    const walletInfo: WalletInfo = {
      address: wallet.address,
      connectionMethod: ConnectionMethod.NEW_WALLET,
      isLocked: false,
      networkId: NetworkId.SEPOLIA
    }
    
    this.currentWallet = walletInfo
    this.signer = wallet
    
    return { walletInfo, mnemonic }
  }

  async loadFromPrivateKey(privateKey: string, password: string): Promise<WalletInfo> {
    // Add 0x prefix if not present
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey
    }
    
    // Validate private key format
    if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
      throw errorHandler.validationError(
        ERROR_CODES.INVALID_PRIVATE_KEY,
        'Invalid private key format',
        'Private key must be a 64-character hexadecimal string'
      )
    }
    
    const wallet = new ethers.Wallet(privateKey)
    
    const encryptedPrivateKey = encryptData(wallet.privateKey, password)
    
    // Store wallet data
    const walletData = {
      encryptedPrivateKey,
      connectionMethod: ConnectionMethod.PRIVATE_KEY,
      address: wallet.address
    }
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.store.set('wallet', walletData)
    } else {
      localStorage.setItem('wallet', JSON.stringify(walletData))
    }
    
    const walletInfo: WalletInfo = {
      address: wallet.address,
      connectionMethod: ConnectionMethod.PRIVATE_KEY,
      isLocked: false,
      networkId: NetworkId.SEPOLIA
    }
    
    this.currentWallet = walletInfo
    this.signer = wallet
    
    return walletInfo
  }

  async loadFromMnemonic(mnemonic: string, password: string): Promise<WalletInfo> {
    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase')
    }
    
    const wallet = ethers.Wallet.fromPhrase(mnemonic)
    
    const encryptedPrivateKey = encryptData(wallet.privateKey, password)
    
    // Store wallet data
    const walletData = {
      encryptedPrivateKey,
      connectionMethod: ConnectionMethod.MNEMONIC,
      address: wallet.address,
      mnemonic: encryptData(mnemonic, password)
    }
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.store.set('wallet', walletData)
    } else {
      localStorage.setItem('wallet', JSON.stringify(walletData))
    }
    
    const walletInfo: WalletInfo = {
      address: wallet.address,
      connectionMethod: ConnectionMethod.MNEMONIC,
      isLocked: false,
      networkId: NetworkId.SEPOLIA
    }
    
    this.currentWallet = walletInfo
    this.signer = wallet
    
    return walletInfo
  }

  async loadFromEnvFile(envContent?: string): Promise<WalletInfo> {
    let content = envContent
    
    // If no content provided, try to read from local .env file
    if (!content) {
      try {
        // Try to read .env file from current directory
        if (typeof window !== 'undefined' && window.electronAPI) {
          // Electron environment
          content = await window.electronAPI.readEnvFile()
        } else {
          // Browser environment - read from Vite environment variables
          const envKey = process.env.VITE_PRIVATE_KEY
          if (envKey) {
            content = `PRIVATE_KEY=${envKey}`
          } else {
            throw new Error('No .env file found and no PRIVATE_KEY environment variable')
          }
        }
      } catch (error) {
        console.error('loadFromEnvFile error:', error)
        throw errorHandler.validationError(
          ERROR_CODES.INVALID_PRIVATE_KEY,
          'Unable to load .env file',
          'Please ensure a .env file exists in the project root with a PRIVATE_KEY variable'
        )
      }
    }
    
    if (!content) {
      throw errorHandler.validationError(
        ERROR_CODES.INVALID_PRIVATE_KEY,
        'No environment content found',
        'Please provide environment content or ensure .env file exists'
      )
    }
    const privateKeyMatch = content.match(/PRIVATE_KEY=(.+)/)
    
    if (!privateKeyMatch) {
      throw errorHandler.validationError(
        ERROR_CODES.INVALID_PRIVATE_KEY,
        'PRIVATE_KEY not found in .env file',
        'The selected file does not contain a valid PRIVATE_KEY variable'
      )
    }
    
    let privateKey = privateKeyMatch[1].trim().replace(/"/g, '')
    
    // Add 0x prefix if not present
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey
    }
    
    // Validate private key format
    if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
      throw errorHandler.validationError(
        ERROR_CODES.INVALID_PRIVATE_KEY,
        'Invalid private key format',
        'Private key must be a 64-character hexadecimal string'
      )
    }
    
    const wallet = new ethers.Wallet(privateKey)
    
    const walletInfo: WalletInfo = {
      address: wallet.address,
      connectionMethod: ConnectionMethod.ENV_FILE,
      isLocked: false,
      networkId: NetworkId.SEPOLIA
    }
    
    this.currentWallet = walletInfo
    this.signer = wallet
    
    return walletInfo
  }

  async connectMetaMask(): Promise<WalletInfo> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    
    const walletInfo: WalletInfo = {
      address,
      connectionMethod: ConnectionMethod.METAMASK,
      isLocked: false,
      networkId: NetworkId.SEPOLIA
    }
    
    this.currentWallet = walletInfo
    this.provider = provider
    this.signer = signer
    
    return walletInfo
  }

  async unlockWallet(password: string): Promise<WalletInfo> {
    let walletData
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      walletData = await window.electronAPI.store.get('wallet')
    } else {
      const storedData = localStorage.getItem('wallet')
      walletData = storedData ? JSON.parse(storedData) : null
    }
    
    if (!walletData) {
      throw new Error('No wallet found')
    }
    
    try {
      const privateKey = decryptData(walletData.encryptedPrivateKey, password)
      const wallet = new ethers.Wallet(privateKey)
      
      const walletInfo: WalletInfo = {
        address: wallet.address,
        connectionMethod: walletData.connectionMethod,
        isLocked: false,
        networkId: NetworkId.SEPOLIA
      }
      
      this.currentWallet = walletInfo
      this.signer = wallet
      
      return walletInfo
    } catch (error) {
      throw new Error('Invalid password')
    }
  }

  lockWallet(): void {
    if (this.currentWallet) {
      this.currentWallet.isLocked = true
    }
    this.signer = null
  }

  disconnect(): void {
    this.currentWallet = null
    this.signer = null
    this.provider = null
  }

  getCurrentWallet(): WalletInfo | null {
    return this.currentWallet
  }

  getSigner(): ethers.Signer | null {
    return this.signer
  }

  getProvider(): ethers.Provider | null {
    return this.provider
  }

  async recoverFromMnemonic(mnemonic: string, newPassword: string): Promise<WalletInfo> {
    try {
      // Validate mnemonic
      const { validateMnemonic } = await import('bip39')
      if (!validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase')
      }

      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic)
      
      // Encrypt and store the wallet
      const encryptedPrivateKey = encryptData(wallet.privateKey, newPassword)
      const encryptedMnemonic = encryptData(mnemonic, newPassword)
      
      const walletData = {
        address: wallet.address,
        encryptedPrivateKey,
        encryptedMnemonic,
        connectionMethod: ConnectionMethod.NEW_WALLET,
        createdAt: new Date().toISOString()
      }

      await window.electronAPI.store.set('wallet', walletData)

      const walletInfo: WalletInfo = {
        address: wallet.address,
        connectionMethod: ConnectionMethod.NEW_WALLET,
        isLocked: false,
        networkId: NetworkId.SEPOLIA
      }

      this.currentWallet = walletInfo
      this.signer = wallet

      return walletInfo
    } catch (error) {
      throw new Error(`Wallet recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async switchNetwork(networkId: NetworkId, rpcUrl?: string): Promise<boolean> {
    if (!this.currentWallet) {
      return false
    }
    
    try {
      const network = SUPPORTED_NETWORKS[networkId]
      const urlToUse = rpcUrl || network.rpcUrl
      
      // Try to connect with the primary RPC URL
      let provider: ethers.JsonRpcProvider
      
      try {
        provider = new ethers.JsonRpcProvider(urlToUse)
        // Test connection
        await provider.getNetwork()
      } catch (error) {
        console.warn(`Failed to connect to primary RPC: ${urlToUse}`, error)
        
        // Try fallback URLs if available
        if (network.fallbackRpcUrls && network.fallbackRpcUrls.length > 0) {
          let connected = false
          
          for (const fallbackUrl of network.fallbackRpcUrls) {
            try {
              console.log(`Trying fallback RPC: ${fallbackUrl}`)
              provider = new ethers.JsonRpcProvider(fallbackUrl)
              await provider.getNetwork()
              console.log(`Successfully connected to fallback RPC: ${fallbackUrl}`)
              connected = true
              break
            } catch (fallbackError) {
              console.warn(`Failed to connect to fallback RPC: ${fallbackUrl}`, fallbackError)
              continue
            }
          }
          
          if (!connected) {
            throw new Error(`Failed to connect to any RPC endpoint for network ${networkId}`)
          }
        } else {
          throw error
        }
      }
      
      this.provider = provider
      
      // Update signer if we have a wallet
      if (this.signer && this.currentWallet.connectionMethod !== ConnectionMethod.METAMASK) {
        this.signer = this.signer.connect(provider)
      }
      
      this.currentWallet.networkId = networkId
      
      // Save updated wallet data
      await this.saveWalletData()
      
      return true
    } catch (error) {
      console.error('Network switch failed:', error)
      return false
    }
  }
  
  private async saveWalletData(): Promise<void> {
    if (!this.currentWallet) return
    
    try {
      const walletData = {
        address: this.currentWallet.address,
        connectionMethod: this.currentWallet.connectionMethod,
        networkId: this.currentWallet.networkId,
        encryptedPrivateKey: this.currentWallet.connectionMethod === ConnectionMethod.NEW_WALLET ? 
          localStorage.getItem('encryptedPrivateKey') : undefined
      }
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.store.set('wallet', walletData)
      } else {
        localStorage.setItem('wallet', JSON.stringify(walletData))
      }
    } catch (error) {
      console.error('Failed to save wallet data:', error)
    }
  }
}

export const walletService = new WalletService()