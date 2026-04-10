// Consolidated utility functions for the Web3 Wallet application
// Combines crypto.ts, errorHandler.ts, and networks.ts for better organization

import CryptoJS from 'crypto-js'
import { Network, NetworkId } from '../types'

// ===== CRYPTO UTILITIES =====

export const encryptData = (data: string, password: string): string => {
  return CryptoJS.AES.encrypt(data, password).toString()
}

export const decryptData = (encryptedData: string, password: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, password)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export const validatePasswordStrength = (password: string): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// ===== ERROR HANDLING =====

export enum ErrorCategory {
  WALLET = 'WALLET',
  NETWORK = 'NETWORK',
  TRANSACTION = 'TRANSACTION',
  CONTRACT = 'CONTRACT',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  STORAGE = 'STORAGE',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

export const ERROR_CODES = {
  // Wallet errors
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  WALLET_LOCKED: 'WALLET_LOCKED',
  WALLET_CREATION_FAILED: 'WALLET_CREATION_FAILED',
  INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',
  INVALID_MNEMONIC: 'INVALID_MNEMONIC',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  RPC_ERROR: 'RPC_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  
  // Transaction errors
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  
  // Contract errors
  CONTRACT_DEPLOYMENT_FAILED: 'CONTRACT_DEPLOYMENT_FAILED',
  CONTRACT_CALL_FAILED: 'CONTRACT_CALL_FAILED',
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  
  // Authentication errors
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

export class AppError extends Error {
  public category: ErrorCategory
  public code: ErrorCode
  public userMessage: string
  public timestamp: Date
  public details?: string

  constructor(
    code: ErrorCode,
    category: ErrorCategory,
    message: string,
    userMessage?: string,
    details?: string
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.category = category
    this.userMessage = userMessage || message
    this.timestamp = new Date()
    this.details = details
  }
}

class ErrorHandler {
  private userMessages: Record<ErrorCode, string> = {
    // Wallet errors
    [ERROR_CODES.WALLET_NOT_FOUND]: 'Wallet not found. Please create or import a wallet.',
    [ERROR_CODES.WALLET_LOCKED]: 'Wallet is locked. Please unlock it with your password.',
    [ERROR_CODES.WALLET_CREATION_FAILED]: 'Failed to create wallet. Please try again.',
    [ERROR_CODES.INVALID_PRIVATE_KEY]: 'Invalid private key format. Please check your input.',
    [ERROR_CODES.INVALID_MNEMONIC]: 'Invalid mnemonic phrase. Please check your seed phrase.',
    
    // Network errors
    [ERROR_CODES.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
    [ERROR_CODES.RPC_ERROR]: 'RPC connection failed. Please try again later.',
    [ERROR_CODES.CONNECTION_FAILED]: 'Connection failed. Please check your network settings.',
    
    // Transaction errors
    [ERROR_CODES.TRANSACTION_FAILED]: 'Transaction failed. Please try again.',
    [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds for this transaction.',
    [ERROR_CODES.GAS_ESTIMATION_FAILED]: 'Failed to estimate gas. Please try again.',
    
    // Contract errors
    [ERROR_CODES.CONTRACT_DEPLOYMENT_FAILED]: 'Contract deployment failed. Please check your code and try again.',
    [ERROR_CODES.CONTRACT_CALL_FAILED]: 'Contract call failed. Please check the contract address and method.',
    [ERROR_CODES.CONTRACT_NOT_FOUND]: 'Contract not found at the specified address.',
    
    // Validation errors
    [ERROR_CODES.INVALID_INPUT]: 'Invalid input. Please check your data and try again.',
    [ERROR_CODES.INVALID_ADDRESS]: 'Invalid Ethereum address format.',
    [ERROR_CODES.INVALID_AMOUNT]: 'Invalid amount. Please enter a valid number.',
    
    // Authentication errors
    [ERROR_CODES.INVALID_PASSWORD]: 'Invalid password. Please try again.',
    [ERROR_CODES.UNAUTHORIZED]: 'Unauthorized access. Please log in again.',
    
    // Storage errors
    [ERROR_CODES.STORAGE_ERROR]: 'Storage error occurred. Please try again.',
    [ERROR_CODES.ENCRYPTION_ERROR]: 'Encryption error. Please check your password.',
    
    // Unknown errors
    [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
  }

  createError(
    code: ErrorCode,
    category: ErrorCategory,
    message: string,
    userMessage?: string,
    details?: string
  ): AppError {
    return new AppError(
      code,
      category,
      message,
      userMessage || this.userMessages[code] || 'An error occurred',
      details
    )
  }

  handleUnknownError(error: any): AppError {
    const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Unknown error occurred')
    return this.createError(
      ERROR_CODES.UNKNOWN_ERROR,
      ErrorCategory.UNKNOWN,
      message,
      this.userMessages[ERROR_CODES.UNKNOWN_ERROR]
    )
  }

  getUserFriendlyMessage(error: any): string {
    if (error && typeof error === 'object' && 'userMessage' in error) {
      return error.userMessage
    }
    
    const message = error instanceof Error ? error.message : String(error)
    
    // Try to match common error patterns
    if (message.includes('insufficient funds')) {
      return this.userMessages[ERROR_CODES.INSUFFICIENT_FUNDS]
    }
    if (message.includes('invalid private key')) {
      return this.userMessages[ERROR_CODES.INVALID_PRIVATE_KEY]
    }
    if (message.includes('network')) {
      return this.userMessages[ERROR_CODES.NETWORK_ERROR]
    }
    
    return this.userMessages[ERROR_CODES.UNKNOWN_ERROR]
  }

  validationError(code: ErrorCode, message: string, userMessage?: string): AppError {
    return this.createError(
      code,
      ErrorCategory.VALIDATION,
      message,
      userMessage
    )
  }

  walletError(code: ErrorCode, message: string, userMessage?: string): AppError {
    return this.createError(
      code,
      ErrorCategory.WALLET,
      message,
      userMessage
    )
  }

  networkError(code: ErrorCode, message: string, userMessage?: string): AppError {
    return this.createError(
      code,
      ErrorCategory.NETWORK,
      message,
      userMessage
    )
  }

  transactionError(code: ErrorCode, message: string, userMessage?: string): AppError {
    return this.createError(
      code,
      ErrorCategory.TRANSACTION,
      message,
      userMessage
    )
  }

  contractError(code: ErrorCode, message: string, userMessage?: string): AppError {
    return this.createError(
      code,
      ErrorCategory.CONTRACT,
      message,
      userMessage
    )
  }

  systemError(code: ErrorCode, message: string, userMessage?: string): AppError {
    return this.createError(
      code,
      ErrorCategory.SYSTEM,
      message,
      userMessage
    )
  }

  handleError(error: any): AppError {
    console.error('Handling error:', error)
    
    if (error instanceof AppError) {
      console.error('AppError:', error)
      return error
    }
    
    console.error('Unhandled error:', error)
    return this.handleUnknownError(error)
  }

  formatError(error: any): string {
    if (error instanceof AppError) {
      return `[${error.code}] ${error.category}: ${error.message} (User: ${error.userMessage})`
    }
    
    if (error instanceof Error) {
      return `Error: ${error.message}`
    }
    
    return `Unknown error: ${String(error)}`
  }

  isAppError(error: any): error is AppError {
    return error instanceof AppError
  }
}

export const errorHandler = new ErrorHandler()

// ===== NETWORK UTILITIES =====

// Helper function to get environment variable safely
const getEnvVar = (key: string): string => {
  return process.env[key] || ''
}

// Get RPC URLs from environment variables with fallbacks
const getSepoliaRpcUrl = (): string => {
  return getEnvVar('VITE_SEPOLIA_RPC_URL') || 
         getEnvVar('VITE_SEPOLIA_RPC_URL_FALLBACK') || 
         'https://rpc.sepolia.org'
}

const getAmoyRpcUrl = (): string => {
  return getEnvVar('VITE_AMOY_RPC_URL') || 
         getEnvVar('VITE_AMOY_RPC_URL_FALLBACK') || 
         'https://rpc-amoy.polygon.technology'
}

// Get block explorer URLs with API keys
const getEtherscanUrl = (): string => {
  const apiKey = getEnvVar('VITE_ETHERSCAN_API_KEY')
  return apiKey ? `https://sepolia.etherscan.io?apikey=${apiKey}` : 'https://sepolia.etherscan.io'
}

const getPolygonscanUrl = (): string => {
  const apiKey = getEnvVar('VITE_POLYGONSCAN_API_KEY')
  return apiKey ? `https://www.oklink.com/amoy?apikey=${apiKey}` : 'https://www.oklink.com/amoy'
}

export const SUPPORTED_NETWORKS: Record<NetworkId, Network> = {
  [NetworkId.SEPOLIA]: {
    id: NetworkId.SEPOLIA,
    name: 'Sepolia Testnet',
    rpcUrl: getSepoliaRpcUrl(),
    chainId: 11155111,
    blockExplorerUrl: getEtherscanUrl(),
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    },
    fallbackRpcUrls: [
      'https://rpc.sepolia.org',
      'https://rpc2.sepolia.org',
      'https://sepolia.infura.io/v3/public',
      'https://ethereum-sepolia.blockpi.network/v1/rpc/public'
    ],
    maxRetries: 3,
    retryDelay: 2000
  },
  [NetworkId.AMOY]: {
    id: NetworkId.AMOY,
    name: 'Polygon Amoy Testnet',
    rpcUrl: getAmoyRpcUrl(),
    chainId: 80002,
    blockExplorerUrl: getPolygonscanUrl(),
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18
    },
    fallbackRpcUrls: [
      'https://rpc-amoy.polygon.technology',
      'https://polygon-amoy.blockpi.network/v1/rpc/public',
      'https://amoy.rpc.thirdweb.com'
    ],
    maxRetries: 3,
    retryDelay: 2000
  }
}

export const getNetworkById = (networkId: NetworkId): Network => {
  return SUPPORTED_NETWORKS[networkId]
}

export const getNetworkByChainId = (chainId: number): Network | undefined => {
  return Object.values(SUPPORTED_NETWORKS).find(network => network.chainId === chainId)
}

// Get API keys for external services
export const getApiKeys = () => {
  return {
    etherscan: getEnvVar('VITE_ETHERSCAN_API_KEY'),
    polygonscan: getEnvVar('VITE_POLYGONSCAN_API_KEY')
  }
}

// Get RPC URLs for programmatic access
export const getRpcUrls = () => {
  return {
    sepolia: {
      primary: getEnvVar('VITE_SEPOLIA_RPC_URL'),
      fallback: getEnvVar('VITE_SEPOLIA_RPC_URL_FALLBACK') || 'https://rpc.sepolia.org'
    },
    amoy: {
      primary: getEnvVar('VITE_AMOY_RPC_URL'),
      fallback: getEnvVar('VITE_AMOY_RPC_URL_FALLBACK') || 'https://rpc-amoy.polygon.technology'
    }
  }
}

// ===== VALIDATION UTILITIES =====

export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export const isValidPrivateKey = (privateKey: string): boolean => {
  return /^(0x)?[a-fA-F0-9]{64}$/.test(privateKey)
}

export const formatEther = (wei: string): string => {
  try {
    const value = parseFloat(wei) / Math.pow(10, 18)
    return value.toFixed(6)
  } catch {
    return '0'
  }
}

export const parseEther = (ether: string): string => {
  try {
    const value = parseFloat(ether) * Math.pow(10, 18)
    return Math.floor(value).toString()
  } catch {
    return '0'
  }
}

// ===== COMMON UTILITIES =====

export const truncateAddress = (address: string, startLength = 6, endLength = 4): string => {
  if (!address || address.length < startLength + endLength) return address
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await sleep(delay * (i + 1))
    }
  }
  throw new Error('Retry failed')
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}