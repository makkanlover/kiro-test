import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'
import { WalletInfo, ConnectionMethod, NetworkId } from '../types'

export class WalletConnectService {
  private connector: WalletConnect | null = null
  private onSessionUpdate: ((accounts: string[]) => void) | null = null

  async initializeWalletConnect(): Promise<{ uri: string; connector: WalletConnect }> {
    // Create a connector
    this.connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org', // Required
      qrcodeModal: QRCodeModal,
    })

    // Check if connection is already established
    if (!this.connector.connected) {
      // Create new session
      await this.connector.createSession()
    }

    // Get URI for QR Code modal
    const uri = this.connector.uri

    return { uri, connector: this.connector }
  }

  async connectWallet(): Promise<WalletInfo> {
    if (!this.connector) {
      throw new Error('WalletConnect not initialized')
    }

    return new Promise((resolve, reject) => {
      // Subscribe to connection events
      this.connector!.on('connect', (error, payload) => {
        if (error) {
          reject(error)
          return
        }

        // Get provided accounts and chainId
        const { accounts, chainId } = payload.params[0]

        if (!accounts || accounts.length === 0) {
          reject(new Error('No accounts provided'))
          return
        }

        const walletInfo: WalletInfo = {
          address: accounts[0],
          connectionMethod: ConnectionMethod.WALLET_CONNECT,
          isLocked: false,
          networkId: this.getNetworkIdFromChainId(chainId)
        }

        resolve(walletInfo)
      })

      this.connector!.on('session_update', (error, payload) => {
        if (error) {
          console.error('Session update error:', error)
          return
        }

        const { accounts } = payload.params[0]
        if (this.onSessionUpdate) {
          this.onSessionUpdate(accounts)
        }
      })

      this.connector!.on('disconnect', (error, payload) => {
        if (error) {
          console.error('Disconnect error:', error)
        }
        
        console.log('WalletConnect disconnected')
      })

      // Enable session (triggers QR Code modal if not connected)
      if (!this.connector.connected) {
        this.connector.createSession()
      }
    })
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.connector || !this.connector.connected) {
      throw new Error('WalletConnect not connected')
    }

    try {
      const result = await this.connector.sendTransaction(transaction)
      return result
    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.connector || !this.connector.connected) {
      throw new Error('WalletConnect not connected')
    }

    try {
      const result = await this.connector.signMessage([
        this.connector.accounts[0], // Required
        message                     // Required
      ])
      return result
    } catch (error) {
      console.error('Message signing failed:', error)
      throw error
    }
  }

  disconnect(): void {
    if (this.connector && this.connector.connected) {
      this.connector.killSession()
    }
    this.connector = null
    this.onSessionUpdate = null
  }

  isConnected(): boolean {
    return this.connector ? this.connector.connected : false
  }

  getAccounts(): string[] {
    return this.connector ? this.connector.accounts : []
  }

  getChainId(): number {
    return this.connector ? this.connector.chainId : 1
  }

  setSessionUpdateCallback(callback: (accounts: string[]) => void): void {
    this.onSessionUpdate = callback
  }

  private getNetworkIdFromChainId(chainId: number): NetworkId {
    switch (chainId) {
      case 11155111:
        return NetworkId.SEPOLIA
      case 80002:
        return NetworkId.AMOY
      default:
        return NetworkId.SEPOLIA // Default fallback
    }
  }
}

export const walletConnectService = new WalletConnectService()