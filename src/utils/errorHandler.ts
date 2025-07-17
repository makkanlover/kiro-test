export enum ErrorCategory {
  WALLET = 'WALLET',
  NETWORK = 'NETWORK',
  TRANSACTION = 'TRANSACTION',
  CONTRACT = 'CONTRACT',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  STORAGE = 'STORAGE',
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

export interface AppError {
  category: ErrorCategory
  code: ErrorCode
  message: string
  userMessage: string
  timestamp: Date
  details?: string
  stack?: string
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
    category: ErrorCategory,
    code: ErrorCode,
    message: string,
    userMessage?: string,
    details?: string,
    originalError?: Error
  ): AppError {
    return {
      category,
      code,
      message,
      userMessage: userMessage || this.userMessages[code] || 'An error occurred',
      timestamp: new Date(),
      details,
      stack: originalError?.stack
    }
  }

  handleUnknownError(error: any): AppError {
    const message = error instanceof Error ? error.message : String(error)
    return this.createError(
      ErrorCategory.UNKNOWN,
      ERROR_CODES.UNKNOWN_ERROR,
      message,
      this.userMessages[ERROR_CODES.UNKNOWN_ERROR],
      undefined,
      error instanceof Error ? error : undefined
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
      ErrorCategory.VALIDATION,
      code,
      message,
      userMessage
    )
  }

  walletError(code: ErrorCode, message: string, userMessage?: string): AppError {
    return this.createError(
      ErrorCategory.WALLET,
      code,
      message,
      userMessage
    )
  }

  networkError(code: ErrorCode, message: string, userMessage?: string): AppError {
    return this.createError(
      ErrorCategory.NETWORK,
      code,
      message,
      userMessage
    )
  }

  transactionError(code: ErrorCode, message: string, userMessage?: string): AppError {
    return this.createError(
      ErrorCategory.TRANSACTION,
      code,
      message,
      userMessage
    )
  }

  contractError(code: ErrorCode, message: string, userMessage?: string): AppError {
    return this.createError(
      ErrorCategory.CONTRACT,
      code,
      message,
      userMessage
    )
  }
}

export const errorHandler = new ErrorHandler()