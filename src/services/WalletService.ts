import { ethers } from 'ethers'
import * as bip39 from 'bip39'
import { encryptData, decryptData } from '../utils/crypto'
import { ConnectionMethod, WalletInfo, NetworkId } from '../types'

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
    
    await window.electronAPI.store.set('wallet', {
      encryptedPrivateKey,
      connectionMethod: ConnectionMethod.NEW_WALLET,
      address: wallet.address,
      mnemonic: encryptData(mnemonic, password)
    })
    
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

  async loadFromEnvFile(envContent: string): Promise<WalletInfo> {
    const privateKeyMatch = envContent.match(/PRIVATE_KEY=(.+)/)
    
    if (!privateKeyMatch) {
      throw new Error('PRIVATE_KEY not found in .env file')
    }
    
    const privateKey = privateKeyMatch[1].trim().replace(/"/g, '')
    
    if (!privateKey.startsWith('0x')) {
      throw new Error('Invalid private key format')
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
    const walletData = await window.electronAPI.store.get('wallet')
    
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

  async switchNetwork(networkId: NetworkId, rpcUrl: string): Promise<void> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected')
    }
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    
    if (this.signer && 'connect' in this.signer) {
      this.signer = this.signer.connect(this.provider)
    }
    
    this.currentWallet.networkId = networkId
  }
}

export const walletService = new WalletService()