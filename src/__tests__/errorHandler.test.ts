import { 
  errorHandler, 
  AppError, 
  ErrorCategory, 
  ERROR_CODES 
} from '../utils'

describe('ErrorHandler', () => {
  describe('AppError', () => {
    test('creates AppError with all properties', () => {
      const error = new AppError(
        ERROR_CODES.INVALID_PRIVATE_KEY,
        ErrorCategory.VALIDATION,
        'Invalid private key format',
        'Please check your private key format'
      )
      
      expect(error.code).toBe(ERROR_CODES.INVALID_PRIVATE_KEY)
      expect(error.category).toBe(ErrorCategory.VALIDATION)
      expect(error.message).toBe('Invalid private key format')
      expect(error.userMessage).toBe('Please check your private key format')
      expect(error.timestamp).toBeInstanceOf(Date)
      expect(error.name).toBe('AppError')
    })

    test('creates AppError with minimal properties', () => {
      const error = new AppError(
        ERROR_CODES.UNKNOWN_ERROR,
        ErrorCategory.SYSTEM,
        'Unknown error occurred'
      )
      
      expect(error.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(error.category).toBe(ErrorCategory.SYSTEM)
      expect(error.message).toBe('Unknown error occurred')
      expect(error.userMessage).toBe('Unknown error occurred')
    })
  })

  describe('errorHandler.createError', () => {
    test('creates validation error', () => {
      const error = errorHandler.createError(
        ERROR_CODES.INVALID_MNEMONIC,
        ErrorCategory.VALIDATION,
        'Invalid mnemonic phrase',
        'Please check your recovery phrase'
      )
      
      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(ERROR_CODES.INVALID_MNEMONIC)
      expect(error.category).toBe(ErrorCategory.VALIDATION)
    })

    test('creates network error', () => {
      const error = errorHandler.createError(
        ERROR_CODES.NETWORK_ERROR,
        ErrorCategory.NETWORK,
        'Network connection failed'
      )
      
      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(ERROR_CODES.NETWORK_ERROR)
      expect(error.category).toBe(ErrorCategory.NETWORK)
    })
  })

  describe('errorHandler.validationError', () => {
    test('creates validation error with shorthand', () => {
      const error = errorHandler.validationError(
        ERROR_CODES.INVALID_PASSWORD,
        'Password is too weak'
      )
      
      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(ERROR_CODES.INVALID_PASSWORD)
      expect(error.category).toBe(ErrorCategory.VALIDATION)
      expect(error.message).toBe('Password is too weak')
    })
  })

  describe('errorHandler.networkError', () => {
    test('creates network error with shorthand', () => {
      const error = errorHandler.networkError(
        ERROR_CODES.RPC_ERROR,
        'RPC endpoint not responding'
      )
      
      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(ERROR_CODES.RPC_ERROR)
      expect(error.category).toBe(ErrorCategory.NETWORK)
      expect(error.message).toBe('RPC endpoint not responding')
    })
  })

  describe('errorHandler.systemError', () => {
    test('creates system error with shorthand', () => {
      const error = errorHandler.systemError(
        ERROR_CODES.STORAGE_ERROR,
        'Failed to save to storage'
      )
      
      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(ERROR_CODES.STORAGE_ERROR)
      expect(error.category).toBe(ErrorCategory.SYSTEM)
      expect(error.message).toBe('Failed to save to storage')
    })
  })

  describe('errorHandler.walletError', () => {
    test('creates wallet error with shorthand', () => {
      const error = errorHandler.walletError(
        ERROR_CODES.WALLET_LOCKED,
        'Wallet is locked'
      )
      
      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(ERROR_CODES.WALLET_LOCKED)
      expect(error.category).toBe(ErrorCategory.WALLET)
      expect(error.message).toBe('Wallet is locked')
    })
  })

  describe('errorHandler.contractError', () => {
    test('creates contract error with shorthand', () => {
      const error = errorHandler.contractError(
        ERROR_CODES.CONTRACT_CALL_FAILED,
        'Contract call reverted'
      )
      
      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe(ERROR_CODES.CONTRACT_CALL_FAILED)
      expect(error.category).toBe(ErrorCategory.CONTRACT)
      expect(error.message).toBe('Contract call reverted')
    })
  })

  describe('errorHandler.handleError', () => {
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    test('handles AppError', () => {
      const appError = new AppError(
        ERROR_CODES.INVALID_PRIVATE_KEY,
        ErrorCategory.VALIDATION,
        'Invalid private key'
      )
      
      const result = errorHandler.handleError(appError)
      
      expect(result).toBe(appError)
      expect(consoleErrorSpy).toHaveBeenCalledWith('AppError:', appError)
    })

    test('handles generic Error', () => {
      const genericError = new Error('Generic error')
      
      const result = errorHandler.handleError(genericError)
      
      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.category).toBe(ErrorCategory.UNKNOWN)
      expect(result.message).toBe('Generic error')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled error:', genericError)
    })

    test('handles string error', () => {
      const stringError = 'String error message'
      
      const result = errorHandler.handleError(stringError)
      
      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.category).toBe(ErrorCategory.UNKNOWN)
      expect(result.message).toBe('String error message')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled error:', stringError)
    })

    test('handles unknown error type', () => {
      const unknownError = { some: 'object' }
      
      const result = errorHandler.handleError(unknownError)
      
      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.category).toBe(ErrorCategory.UNKNOWN)
      expect(result.message).toBe('Unknown error occurred')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled error:', unknownError)
    })
  })

  describe('errorHandler.formatError', () => {
    test('formats AppError', () => {
      const error = new AppError(
        ERROR_CODES.INVALID_PRIVATE_KEY,
        ErrorCategory.VALIDATION,
        'Invalid private key format',
        'Please check your private key'
      )
      
      const formatted = errorHandler.formatError(error)
      
      expect(formatted).toContain('INVALID_PRIVATE_KEY')
      expect(formatted).toContain('VALIDATION')
      expect(formatted).toContain('Invalid private key format')
      expect(formatted).toContain('Please check your private key')
    })

    test('formats generic Error', () => {
      const error = new Error('Generic error')
      
      const formatted = errorHandler.formatError(error)
      
      expect(formatted).toContain('Generic error')
    })
  })

  describe('errorHandler.isAppError', () => {
    test('identifies AppError', () => {
      const appError = new AppError(
        ERROR_CODES.INVALID_PRIVATE_KEY,
        ErrorCategory.VALIDATION,
        'Invalid private key'
      )
      
      expect(errorHandler.isAppError(appError)).toBe(true)
    })

    test('identifies non-AppError', () => {
      const genericError = new Error('Generic error')
      
      expect(errorHandler.isAppError(genericError)).toBe(false)
    })

    test('identifies string as non-AppError', () => {
      expect(errorHandler.isAppError('string error')).toBe(false)
    })

    test('identifies null as non-AppError', () => {
      expect(errorHandler.isAppError(null)).toBe(false)
    })
  })

  describe('ERROR_CODES', () => {
    test('contains expected error codes', () => {
      expect(ERROR_CODES.INVALID_PRIVATE_KEY).toBe('INVALID_PRIVATE_KEY')
      expect(ERROR_CODES.INVALID_MNEMONIC).toBe('INVALID_MNEMONIC')
      expect(ERROR_CODES.INVALID_PASSWORD).toBe('INVALID_PASSWORD')
      expect(ERROR_CODES.WALLET_LOCKED).toBe('WALLET_LOCKED')
      expect(ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR')
      expect(ERROR_CODES.RPC_ERROR).toBe('RPC_ERROR')
      expect(ERROR_CODES.CONTRACT_CALL_FAILED).toBe('CONTRACT_CALL_FAILED')
      expect(ERROR_CODES.STORAGE_ERROR).toBe('STORAGE_ERROR')
      expect(ERROR_CODES.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR')
    })
  })

  describe('ErrorCategory', () => {
    test('contains expected categories', () => {
      expect(ErrorCategory.VALIDATION).toBe('VALIDATION')
      expect(ErrorCategory.NETWORK).toBe('NETWORK')
      expect(ErrorCategory.WALLET).toBe('WALLET')
      expect(ErrorCategory.CONTRACT).toBe('CONTRACT')
      expect(ErrorCategory.SYSTEM).toBe('SYSTEM')
    })
  })
})