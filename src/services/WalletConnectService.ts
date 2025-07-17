import { SignClient } from '@walletconnect/sign-client'
import { getSdkError } from '@walletconnect/utils'
import { WalletConnectModal } from '@walletconnect/modal'
import { WalletInfo, ConnectionMethod, NetworkId } from '../types'

export class WalletConnectService {
  private signClient: InstanceType<typeof SignClient> | null = null
  private modal: WalletConnectModal | null = null
  private session: any = null
  private onSessionUpdate: ((accounts: string[]) => void) | null = null

  async initializeWalletConnect(): Promise<{ uri: string }> {
    try {
      // Use a demo project ID for now - in production, get this from WalletConnect Cloud
      const projectId = process.env.WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'
      
      // Initialize the modal
      this.modal = new WalletConnectModal({
        projectId,
        chains: ['eip155:11155111', 'eip155:80002'] // Sepolia and Amoy
      })

      // Initialize SignClient
      this.signClient = await SignClient.init({
        projectId,
        metadata: {
          name: 'Web3 Wallet App',
          description: 'A standalone Web3 wallet application',
          url: 'https://web3wallet.app',
          icons: ['https://web3wallet.app/icon.png']
        }
      })

      // Set up event listeners
      this.signClient.on('session_event', (args: any) => {
        console.log('WalletConnect session event:', args)
      })

      this.signClient.on('session_update', (args: any) => {
        console.log('WalletConnect session update:', args)
        if (this.onSessionUpdate && args.params?.namespaces?.eip155?.accounts) {
          const accounts = args.params.namespaces.eip155.accounts.map((account: string) => 
            account.split(':')[2]
          )
          this.onSessionUpdate(accounts)
        }
      })

      this.signClient.on('session_delete', () => {
        console.log('WalletConnect session deleted')
        this.session = null
      })

      // Create a session proposal
      const { uri, approval } = await this.signClient.connect({
        requiredNamespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData'
            ],
            chains: ['eip155:11155111', 'eip155:80002'],
            events: ['chainChanged', 'accountsChanged']
          }
        }
      })

      if (uri) {
        // Show QR code modal
        this.modal.openModal({ uri })
        
        // Await session approval
        this.session = await approval()
        
        // Close modal
        this.modal.closeModal()
      }

      return { uri: uri || '' }
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error)
      throw new Error(`WalletConnect initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async connectWallet(): Promise<WalletInfo> {
    if (!this.session) {
      await this.initializeWalletConnect()
    }

    if (!this.session) {
      throw new Error('Failed to establish WalletConnect session')
    }

    // Get accounts from the session
    const accounts = this.session.namespaces.eip155?.accounts || []
    if (accounts.length === 0) {
      throw new Error('No accounts provided')
    }

    // Extract address from the first account (format: eip155:chainId:address)
    const address = accounts[0].split(':')[2]
    
    // Get chain ID from session
    const chainId = parseInt(this.session.namespaces.eip155?.chains?.[0]?.split(':')[1] || '11155111')

    const walletInfo: WalletInfo = {
      address,
      connectionMethod: ConnectionMethod.WALLET_CONNECT,
      isLocked: false,
      networkId: this.getNetworkIdFromChainId(chainId)
    }

    return walletInfo
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.signClient || !this.session) {
      throw new Error('WalletConnect not connected')
    }

    try {
      const result = await this.signClient.request({
        topic: this.session.topic,
        chainId: 'eip155:11155111', // Default to Sepolia
        request: {
          method: 'eth_sendTransaction',
          params: [transaction]
        }
      })
      return result as string
    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signClient || !this.session) {
      throw new Error('WalletConnect not connected')
    }

    try {
      const accounts = this.session.namespaces.eip155?.accounts || []
      const address = accounts[0]?.split(':')[2]
      
      const result = await this.signClient.request({
        topic: this.session.topic,
        chainId: 'eip155:11155111',
        request: {
          method: 'personal_sign',
          params: [message, address]
        }
      })
      return result as string
    } catch (error) {
      console.error('Message signing failed:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.signClient && this.session) {
      await this.signClient.disconnect({
        topic: this.session.topic,
        reason: getSdkError('USER_DISCONNECTED')
      })
    }
    this.signClient = null
    this.session = null
    this.onSessionUpdate = null
    
    if (this.modal) {
      this.modal.closeModal()
    }
  }

  isConnected(): boolean {
    return !!this.session
  }

  getAccounts(): string[] {
    if (!this.session) return []
    
    const accounts = this.session.namespaces.eip155?.accounts || []
    return accounts.map((account: string) => account.split(':')[2])
  }

  getChainId(): number {
    if (!this.session) return 11155111
    
    const chainId = this.session.namespaces.eip155?.chains?.[0]?.split(':')[1]
    return parseInt(chainId || '11155111')
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