// Unified type definitions for the Web3 Wallet application
// Combines global.d.ts and types/index.ts for better organization

// Global type declarations
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, handler: (accounts: string[]) => void) => void
      removeListener: (event: string, handler: (accounts: string[]) => void) => void
    }
    electronAPI?: {
      selectEnvFile: () => Promise<string | null>
      readEnvFile: () => Promise<string>
      store: {
        get: (key: string) => Promise<any>
        set: (key: string, value: any) => Promise<void>
        delete: (key: string) => Promise<void>
        clear: () => Promise<void>
      }
    }
  }
}

// Environment variable types
interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_INFURA_PROJECT_ID: string
  readonly VITE_ALCHEMY_API_KEY: string
  readonly VITE_ETHERSCAN_API_KEY: string
  readonly VITE_POLYGONSCAN_API_KEY: string
  readonly VITE_PRIVATE_KEY: string
  readonly VITE_SEPOLIA_RPC_URL: string
  readonly VITE_AMOY_RPC_URL: string
  readonly VITE_SEPOLIA_RPC_URL_FALLBACK: string
  readonly VITE_AMOY_RPC_URL_FALLBACK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Enums
export enum ConnectionMethod {
  NEW_WALLET = 'new_wallet',
  ENV_FILE = 'env_file',
  METAMASK = 'metamask',
  WALLET_CONNECT = 'wallet_connect'
}

export enum NetworkId {
  SEPOLIA = 'sepolia',
  AMOY = 'amoy'
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
}

// Network interfaces
export interface Network {
  id: NetworkId
  name: string
  rpcUrl: string
  chainId: number
  blockExplorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  fallbackRpcUrls?: string[]
  maxRetries?: number
  retryDelay?: number
}

// Wallet interfaces
export interface WalletInfo {
  address: string
  connectionMethod: ConnectionMethod
  isLocked: boolean
  networkId: NetworkId
}

// Balance interfaces
export interface Balance {
  balance: string
  symbol: string
  decimals: number
  usdValue?: number
}

// Transaction interfaces
export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  gasUsed: string
  timestamp: number
  status: TransactionStatus
  networkId: NetworkId
}

export interface SendTransactionParams {
  to: string
  value: string
  gasLimit?: string
  gasPrice?: string
}

export interface GasEstimate {
  gasLimit: string
  gasPrice: string
  totalCost: string
}

// Contract interfaces
export interface DeployParams {
  bytecode: string
  constructorArgs?: any[]
  gasLimit?: string
  gasPrice?: string
}

export interface DeployResult {
  contractAddress: string
  transactionHash: string
  gasUsed: string
}

export interface VerifyParams {
  contractAddress: string
  sourceCode: string
  compilerVersion: string
  optimizationUsed: boolean
  runs?: number
}

export interface VerificationResult {
  success: boolean
  message: string
  verificationId?: string
}

// Additional utility types for better type safety
export type Address = string
export type Hash = string
export type Wei = string
export type Ether = string

// Error types
export interface WalletError {
  code: string
  message: string
  details?: any
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

// Component prop types
export interface ComponentError {
  message: string
  code?: string
  timestamp: number
}

// Hook return types
export interface UseWalletReturn {
  wallet: WalletInfo | null
  isLoading: boolean
  error: string | null
  connect: (method: ConnectionMethod, params?: any) => Promise<void>
  disconnect: () => Promise<void>
  unlock: (password: string) => Promise<void>
  lock: () => void
}

export interface UseBalanceReturn {
  balance: string | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export interface UseTransactionReturn {
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  sendTransaction: (params: SendTransactionParams) => Promise<string>
  estimateGas: (params: SendTransactionParams) => Promise<GasEstimate>
}

// Service interfaces
export interface WalletService {
  connect(method: ConnectionMethod, params?: any): Promise<WalletInfo>
  disconnect(): Promise<void>
  unlock(password: string): Promise<void>
  lock(): void
  getBalance(): Promise<string>
  sendTransaction(params: SendTransactionParams): Promise<string>
}

export interface BlockchainService {
  getBalance(address: string): Promise<string>
  sendTransaction(params: SendTransactionParams): Promise<string>
  getTransactionHistory(address: string): Promise<Transaction[]>
  estimateGas(params: SendTransactionParams): Promise<GasEstimate>
}

export interface ContractService {
  deploy(params: DeployParams): Promise<DeployResult>
  verify(params: VerifyParams): Promise<VerificationResult>
  getContractInfo(address: string): Promise<any>
}

// Configuration types
export interface NetworkConfig {
  networks: Record<NetworkId, Network>
  defaultNetwork: NetworkId
}

export interface AppConfig {
  networks: NetworkConfig
  wallet: {
    autoLockTimeout: number
    defaultGasLimit: string
    defaultGasPrice: string
  }
  ui: {
    theme: 'light' | 'dark'
    language: 'en' | 'ja'
  }
}

// Event types
export interface WalletEvent {
  type: 'connect' | 'disconnect' | 'accountsChanged' | 'chainChanged'
  payload?: any
  timestamp: number
}

export interface TransactionEvent {
  type: 'sent' | 'confirmed' | 'failed'
  transaction: Transaction
  timestamp: number
}

// Cache types
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

export interface CacheConfig {
  defaultTtl: number
  maxEntries: number
  cleanupInterval: number
}

// Performance monitoring types
export interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
}

export interface PerformanceReport {
  metrics: PerformanceMetric[]
  averages: Record<string, number>
  errors: PerformanceMetric[]
}

// Validation types
export interface ValidationRule {
  field: string
  type: 'required' | 'format' | 'range' | 'custom'
  value?: any
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

// Export statement to make this a module
export {}