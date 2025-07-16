import { ElectronAPI } from '../../electron/preload'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

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
}

export interface WalletInfo {
  address: string
  connectionMethod: ConnectionMethod
  isLocked: boolean
  networkId: NetworkId
}

export interface Balance {
  balance: string
  symbol: string
  decimals: number
  usdValue?: number
}

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

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
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