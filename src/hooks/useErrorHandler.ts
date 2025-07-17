import { useState, useCallback } from 'react'
import { AppError, errorHandler, ErrorCategory } from '../utils/errorHandler'

export const useErrorHandler = () => {
  const [currentError, setCurrentError] = useState<AppError | null>(null)

  const handleError = useCallback((error: any, category?: ErrorCategory, code?: string): AppError => {
    let appError: AppError

    if (error && typeof error === 'object' && 'category' in error) {
      // Already an AppError
      appError = error as AppError
    } else {
      // Convert to AppError
      if (category && code) {
        const userMessage = errorHandler.getUserFriendlyMessage(error)
        appError = errorHandler.createError(
          category,
          code,
          error instanceof Error ? error.message : String(error),
          userMessage,
          undefined,
          error instanceof Error ? error : undefined
        )
      } else {
        appError = errorHandler.handleUnknownError(error)
      }
    }

    setCurrentError(appError)
    return appError
  }, [])

  const clearError = useCallback(() => {
    setCurrentError(null)
  }, [])

  // Specific error handlers
  const handleWalletError = useCallback((error: any, code: string) => {
    return handleError(error, ErrorCategory.WALLET, code)
  }, [handleError])

  const handleNetworkError = useCallback((error: any, code: string) => {
    return handleError(error, ErrorCategory.NETWORK, code)
  }, [handleError])

  const handleTransactionError = useCallback((error: any, code: string) => {
    return handleError(error, ErrorCategory.TRANSACTION, code)
  }, [handleError])

  const handleContractError = useCallback((error: any, code: string) => {
    return handleError(error, ErrorCategory.CONTRACT, code)
  }, [handleError])

  const handleValidationError = useCallback((error: any, code: string) => {
    return handleError(error, ErrorCategory.VALIDATION, code)
  }, [handleError])

  const handleAuthError = useCallback((error: any, code: string) => {
    return handleError(error, ErrorCategory.AUTHENTICATION, code)
  }, [handleError])

  const handleStorageError = useCallback((error: any, code: string) => {
    return handleError(error, ErrorCategory.STORAGE, code)
  }, [handleError])

  return {
    currentError,
    handleError,
    clearError,
    handleWalletError,
    handleNetworkError,
    handleTransactionError,
    handleContractError,
    handleValidationError,
    handleAuthError,
    handleStorageError
  }
}

// Hook for showing toast notifications
export const useErrorToast = () => {
  const [toastError, setToastError] = useState<AppError | null>(null)

  const showErrorToast = useCallback((error: any, category?: ErrorCategory, code?: string) => {
    let appError: AppError

    if (error && typeof error === 'object' && 'category' in error) {
      appError = error as AppError
    } else {
      if (category && code) {
        const userMessage = errorHandler.getUserFriendlyMessage(error)
        appError = errorHandler.createError(
          category,
          code,
          error instanceof Error ? error.message : String(error),
          userMessage,
          undefined,
          error instanceof Error ? error : undefined
        )
      } else {
        appError = errorHandler.handleUnknownError(error)
      }
    }

    setToastError(appError)
  }, [])

  const clearToast = useCallback(() => {
    setToastError(null)
  }, [])

  return {
    toastError,
    showErrorToast,
    clearToast
  }
}