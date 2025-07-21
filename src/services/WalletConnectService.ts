import { SignClient } from '@walletconnect/sign-client'
import { getSdkError } from '@walletconnect/utils'
import { WalletConnectModal } from '@walletconnect/modal'
import { WalletInfo, ConnectionMethod, NetworkId } from '../types'
import { blockchainService } from './BlockchainService'
import { errorHandler, ErrorCategory } from '../utils'

export interface WalletConnectConfig {
  projectId?: string
  metadata?: {
    name: string
    description: string
    url: string
    icons: string[]
  }
  chains?: string[]
  methods?: string[]
  events?: string[]
}

export interface ConnectionState {
  isConnecting: boolean
  isConnected: boolean
  error: string | null
  session: any
  accounts: string[]
  chainId: number
}

export class WalletConnectService {
  private signClient: InstanceType<typeof SignClient> | null = null
  private modal: WalletConnectModal | null = null
  private session: any = null
  private onSessionUpdate: ((accounts: string[]) => void) | null = null
  private onConnectionStateChange: ((state: ConnectionState) => void) | null = null
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private connectionState: ConnectionState = {
    isConnecting: false,
    isConnected: false,
    error: null,
    session: null,
    accounts: [],
    chainId: 11155111
  }
  private readonly CACHE_TTL = 300000 // 5 minutes
  private readonly DEFAULT_CONFIG: WalletConnectConfig = {
    projectId: process.env.WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    metadata: {
      name: 'Web3 Wallet App',
      description: 'A standalone Web3 wallet application with smart contract deployment and verification',
      url: 'https://web3wallet.app',
      icons: ['https://web3wallet.app/icon.png']
    },
    chains: ['eip155:11155111', 'eip155:80002'], // Sepolia and Amoy
    methods: [
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v4',
      'wallet_switchEthereumChain',
      'wallet_addEthereumChain'
    ],
    events: ['chainChanged', 'accountsChanged', 'disconnect']
  }

  // Enhanced initialization with configuration and better error handling
  async initializeWalletConnect(config?: Partial<WalletConnectConfig>): Promise<{ uri: string }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    try {
      this.updateConnectionState({ isConnecting: true, error: null })
      
      // Check if already initialized
      if (this.signClient) {
        console.log('WalletConnect already initialized')
        return this.createNewSession(finalConfig)
      }
      
      // Validate project ID - Allow test mode with demo project ID
      if (!finalConfig.projectId || finalConfig.projectId === 'YOUR_PROJECT_ID') {
        console.warn('Using demo WalletConnect project ID for testing')
        finalConfig.projectId = '2f5e4c9d8b6a3c1e7f9a2b4c8d5e3f7a' // Demo project ID for testing
      }
      
      // Initialize the modal with enhanced configuration
      this.modal = new WalletConnectModal({
        projectId: finalConfig.projectId,
        chains: finalConfig.chains || this.DEFAULT_CONFIG.chains!,
        enableExplorer: true,
        explorerRecommendedWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
          'bc949c5d968ae81310268bf9193f9c9fb7bb4e1283e1284af8f2bd4992535fd6', // SafePal
        ],
        themeMode: 'dark',
        themeVariables: {
          '--wcm-z-index': '999999'
        }
      })

      // Initialize SignClient with retry logic
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount < maxRetries) {
        try {
          this.signClient = await SignClient.init({
            projectId: finalConfig.projectId,
            metadata: finalConfig.metadata || this.DEFAULT_CONFIG.metadata!
          })
          break
        } catch (error) {
          retryCount++
          if (retryCount >= maxRetries) throw error
          console.warn(`WalletConnect init retry ${retryCount}/${maxRetries}:`, error)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        }
      }

      // Set up comprehensive event listeners
      this.setupEventListeners()
      
      return this.createNewSession(finalConfig)
    } catch (error) {
      const wcError = errorHandler.createError(
        ErrorCategory.WALLET,
        'WALLETCONNECT_INIT_FAILED',
        error instanceof Error ? error.message : 'Unknown initialization error',
        'Failed to initialize WalletConnect. Please check your internet connection and try again.',
        { config: finalConfig },
        error instanceof Error ? error : undefined
      )
      
      this.updateConnectionState({ isConnecting: false, error: wcError.message })
      throw wcError
    }
  }
  
  private setupEventListeners(): void {
    if (!this.signClient) return
    
    this.signClient.on('session_event', (args: any) => {
      console.log('WalletConnect session event:', args)
      this.handleSessionEvent(args)
    })

    this.signClient.on('session_update', (args: any) => {
      console.log('WalletConnect session update:', args)
      this.handleSessionUpdate(args)
    })

    this.signClient.on('session_delete', (args: any) => {
      console.log('WalletConnect session deleted:', args)
      this.handleSessionDelete()
    })
    
    this.signClient.on('session_expire', (args: any) => {
      console.log('WalletConnect session expired:', args)
      this.handleSessionDelete()
    })
    
    this.signClient.on('session_request', (args: any) => {
      console.log('WalletConnect session request:', args)
      // Handle incoming requests from connected wallet
    })
  }
  
  private async createNewSession(config: WalletConnectConfig): Promise<{ uri: string }> {
    if (!this.signClient) {
      throw new Error('SignClient not initialized')
    }

    try {
      // Create a session proposal with enhanced namespace requirements
      const { uri, approval } = await this.signClient.connect({
        requiredNamespaces: {
          eip155: {
            methods: config.methods || this.DEFAULT_CONFIG.methods!,
            chains: config.chains || this.DEFAULT_CONFIG.chains!,
            events: config.events || this.DEFAULT_CONFIG.events!
          }
        }
      })

      if (uri) {
        // Show enhanced QR code modal with better UX
        if (this.modal) {
          this.modal.openModal({ uri })
        }
        
        // Set up approval timeout
        const approvalTimeout = setTimeout(() => {
          this.updateConnectionState({ 
            isConnecting: false, 
            error: 'Connection timeout. Please try again.' 
          })
          if (this.modal) {
            this.modal.closeModal()
          }
        }, 60000) // 60 seconds timeout
        
        // Await session approval with timeout handling
        try {
          this.session = await approval()
          clearTimeout(approvalTimeout)
          
          // Update connection state
          const accounts = this.getAccounts()
          const chainId = this.getChainId()
          
          this.updateConnectionState({
            isConnecting: false,
            isConnected: true,
            error: null,
            session: this.session,
            accounts,
            chainId
          })
          
          // Close modal
          if (this.modal) {
            this.modal.closeModal()
          }
          
          // Cache the session for quick reconnect
          this.setCachedData('last_session', this.session, 86400000) // 24 hours
          
        } catch (approvalError) {
          clearTimeout(approvalTimeout)
          throw approvalError
        }
      }

      return { uri: uri || '' }
    } catch (error) {
      this.updateConnectionState({ 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      })
      throw error
    }
  }

  // Enhanced connection with better state management
  async connectWallet(config?: Partial<WalletConnectConfig>): Promise<WalletInfo> {
    try {
      // Try to restore previous session first
      const cachedSession = this.getCachedData('last_session')
      if (cachedSession && this.signClient) {
        try {
          // Validate cached session
          const activeSessions = this.signClient.session.getAll()
          const validSession = activeSessions.find(s => s.topic === cachedSession.topic)
          
          if (validSession && validSession.expiry > Date.now() / 1000) {
            this.session = validSession
            console.log('Restored WalletConnect session from cache')
          }
        } catch (cacheError) {
          console.warn('Failed to restore cached session:', cacheError)
        }
      }
      
      // Initialize if no valid session
      if (!this.session) {
        await this.initializeWalletConnect(config)
      }

      if (!this.session) {
        throw errorHandler.createError(
          ErrorCategory.WALLET,
          'SESSION_FAILED',
          'Failed to establish WalletConnect session',
          'Unable to connect to wallet. Please try again.',
          { hasSignClient: !!this.signClient }
        )
      }

      // Get accounts from the session with validation
      const accounts = this.session.namespaces.eip155?.accounts || []
      if (accounts.length === 0) {
        throw errorHandler.createError(
          ErrorCategory.WALLET,
          'NO_ACCOUNTS',
          'No accounts provided by wallet',
          'The connected wallet did not provide any accounts. Please check your wallet and try again.'
        )
      }

      // Extract address from the first account (format: eip155:chainId:address)
      const address = accounts[0].split(':')[2]
      
      // Validate address format
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw errorHandler.createError(
          ErrorCategory.WALLET,
          'INVALID_ADDRESS',
          `Invalid address format: ${address}`,
          'The wallet provided an invalid address format.'
        )
      }
      
      // Get chain ID from session
      const chainId = parseInt(this.session.namespaces.eip155?.chains?.[0]?.split(':')[1] || '11155111')

      const walletInfo: WalletInfo = {
        address,
        connectionMethod: ConnectionMethod.WALLET_CONNECT,
        isLocked: false,
        networkId: this.getNetworkIdFromChainId(chainId)
      }
      
      // Note: BlockchainService integration would be added here
      // Currently just logging for reference
      console.log('WalletConnect wallet connected:', address)

      return walletInfo
    } catch (error) {
      const wcError = error instanceof Error && error.name === 'AppError' 
        ? error 
        : errorHandler.createError(
            ErrorCategory.WALLET,
            'CONNECTION_FAILED',
            error instanceof Error ? error.message : 'Unknown connection error',
            'Failed to connect wallet. Please try again.',
            {},
            error instanceof Error ? error : undefined
          )
      
      this.updateConnectionState({ 
        isConnecting: false, 
        error: wcError.message 
      })
      throw wcError
    }
  }

  // Enhanced transaction handling with better error management
  async sendTransaction(transaction: any, chainId?: number): Promise<string> {
    if (!this.signClient || !this.session) {
      throw errorHandler.createError(
        ErrorCategory.TRANSACTION,
        'NOT_CONNECTED',
        'WalletConnect not connected',
        'Please connect your wallet first before sending transactions.'
      )
    }

    try {
      // Validate transaction object
      if (!transaction.to || !transaction.value) {
        throw errorHandler.createError(
          ErrorCategory.TRANSACTION,
          'INVALID_TRANSACTION',
          'Transaction missing required fields',
          'Invalid transaction parameters.'
        )
      }
      
      // Use provided chainId or current session chainId
      const targetChainId = chainId || this.getChainId()
      const chainString = `eip155:${targetChainId}`
      
      // Ensure we're on the correct network
      const currentChainId = this.getChainId()
      if (targetChainId !== currentChainId) {
        await this.switchChain(targetChainId)
      }
      
      const result = await this.signClient.request({
        topic: this.session.topic,
        chainId: chainString,
        request: {
          method: 'eth_sendTransaction',
          params: [transaction]
        }
      })
      
      // Cache successful transaction
      this.setCachedData(`tx_${result}`, { 
        hash: result, 
        timestamp: Date.now(),
        transaction 
      }, 3600000) // 1 hour
      
      return result as string
    } catch (error) {
      const txError = errorHandler.createError(
        ErrorCategory.TRANSACTION,
        'SEND_FAILED',
        error instanceof Error ? error.message : 'Transaction failed',
        'Transaction failed to send. Please check your wallet and try again.',
        { transaction },
        error instanceof Error ? error : undefined
      )
      throw txError
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

  // Enhanced diagnostic functions for testing
  async runDiagnostics(): Promise<{
    signClientStatus: boolean
    modalStatus: boolean
    sessionStatus: boolean
    networkConnectivity: boolean
    projectIdValid: boolean
    supportedWallets: string[]
    recommendations: string[]
  }> {
    const diagnostics = {
      signClientStatus: !!this.signClient,
      modalStatus: !!this.modal,
      sessionStatus: !!this.session,
      networkConnectivity: false,
      projectIdValid: false,
      supportedWallets: [],
      recommendations: []
    }

    // Test network connectivity
    try {
      await fetch('https://relay.walletconnect.com/health', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      diagnostics.networkConnectivity = true
    } catch (error) {
      diagnostics.recommendations.push('WalletConnectリレーサーバーへの接続を確認してください')
    }

    // Validate project ID
    const projectId = this.DEFAULT_CONFIG.projectId
    if (projectId && projectId !== 'YOUR_PROJECT_ID' && projectId.length > 10) {
      diagnostics.projectIdValid = true
    } else {
      diagnostics.recommendations.push('有効なWalletConnectプロジェクトIDを設定してください')
    }

    // Get supported wallets list
    diagnostics.supportedWallets = [
      'MetaMask', 'Trust Wallet', 'SafePal', 'Rainbow', 
      'Coinbase Wallet', 'imToken', 'TokenPocket'
    ]

    // Add recommendations
    if (!diagnostics.signClientStatus) {
      diagnostics.recommendations.push('WalletConnectを初期化してください')
    }
    if (!diagnostics.sessionStatus && diagnostics.signClientStatus) {
      diagnostics.recommendations.push('モバイルウォレットとの接続を確立してください')
    }

    return diagnostics
  }

  // Test transaction flow
  async testTransactionFlow(): Promise<{
    canEstimateGas: boolean
    canSignMessage: boolean
    canSendTransaction: boolean
    latency: number
    errors: string[]
  }> {
    const testResult = {
      canEstimateGas: false,
      canSignMessage: false,
      canSendTransaction: false,
      latency: 0,
      errors: []
    }

    if (!this.session || !this.signClient) {
      testResult.errors.push('WalletConnect session not established')
      return testResult
    }

    const startTime = Date.now()

    try {
      // Test message signing
      const testMessage = 'WalletConnect診断テスト - ' + new Date().toISOString()
      await this.signMessage(testMessage)
      testResult.canSignMessage = true
    } catch (error) {
      testResult.errors.push(`メッセージ署名テスト失敗: ${error.message}`)
    }

    testResult.latency = Date.now() - startTime
    return testResult
  }

  // Enhanced disconnection with cleanup
  async disconnect(): Promise<void> {
    try {
      if (this.signClient && this.session) {
        await this.signClient.disconnect({
          topic: this.session.topic,
          reason: getSdkError('USER_DISCONNECTED')
        })
      }
    } catch (error) {
      console.warn('Error during WalletConnect disconnect:', error)
    } finally {
      // Clean up state regardless of disconnect success
      this.signClient = null
      this.session = null
      this.onSessionUpdate = null
      this.onConnectionStateChange = null
      
      // Clear cache
      this.cache.clear()
      
      // Update connection state
      this.updateConnectionState({
        isConnecting: false,
        isConnected: false,
        error: null,
        session: null,
        accounts: [],
        chainId: 11155111
      })
      
      if (this.modal) {
        this.modal.closeModal()
      }
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
  
  // Enhanced getters
  getSupportedChains(): string[] {
    return this.DEFAULT_CONFIG.chains || []
  }
  
  getSupportedMethods(): string[] {
    return this.DEFAULT_CONFIG.methods || []
  }
  
  getSession(): any {
    return this.session
  }
  
  isReady(): boolean {
    return !!this.signClient && !!this.session
  }

  // New enhanced methods
  async switchChain(chainId: number): Promise<void> {
    if (!this.signClient || !this.session) {
      throw new Error('WalletConnect not connected')
    }
    
    try {
      await this.signClient.request({
        topic: this.session.topic,
        chainId: `eip155:${this.getChainId()}`,
        request: {
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }]
        }
      })
      
      // Update connection state
      this.updateConnectionState({ chainId })
    } catch (error) {
      throw errorHandler.createError(
        ErrorCategory.NETWORK,
        'CHAIN_SWITCH_FAILED',
        error instanceof Error ? error.message : 'Chain switch failed',
        'Failed to switch network. Please switch manually in your wallet.',
        { targetChainId: chainId }
      )
    }
  }
  
  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }
  
  setConnectionStateCallback(callback: (state: ConnectionState) => void): void {
    this.onConnectionStateChange = callback
  }
  
  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates }
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(this.connectionState)
    }
  }
  
  private handleSessionEvent(args: any): void {
    // Handle specific session events like chain changes
    if (args.params?.event?.name === 'chainChanged') {
      const chainId = parseInt(args.params.event.data, 16)
      this.updateConnectionState({ chainId })
    }
  }
  
  private handleSessionUpdate(args: any): void {
    if (args.params?.namespaces?.eip155?.accounts) {
      const accounts = args.params.namespaces.eip155.accounts.map((account: string) => 
        account.split(':')[2]
      )
      
      this.updateConnectionState({ accounts })
      
      if (this.onSessionUpdate) {
        this.onSessionUpdate(accounts)
      }
    }
  }
  
  private handleSessionDelete(): void {
    this.session = null
    this.updateConnectionState({
      isConnected: false,
      session: null,
      accounts: [],
      error: 'Session disconnected'
    })
  }
  
  // Cache management
  private getCachedData(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCachedData(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }
  
  clearCache(): void {
    this.cache.clear()
  }
  
  // QR Code display helpers
  async generateQRCode(config?: Partial<WalletConnectConfig>): Promise<string> {
    const { uri } = await this.initializeWalletConnect(config)
    return uri
  }
  
  openModal(uri?: string): void {
    if (this.modal && uri) {
      this.modal.openModal({ uri })
    }
  }
  
  closeModal(): void {
    if (this.modal) {
      this.modal.closeModal()
    }
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