import React, { useState, useEffect } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  Typography,
  IconButton,
  Snackbar
} from '@mui/material'
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material'
import { AppError, ErrorCategory } from '../utils/errorHandler'

interface ErrorDisplayProps {
  error: AppError | null
  onClose?: () => void
  showDetails?: boolean
  variant?: 'alert' | 'snackbar'
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onClose,
  showDetails = false,
  variant = 'alert'
}) => {
  const [expanded, setExpanded] = useState(false)

  if (!error) return null

  const getSeverity = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return 'warning'
      case ErrorCategory.AUTHENTICATION:
        return 'error'
      case ErrorCategory.NETWORK:
        return 'warning'
      case ErrorCategory.TRANSACTION:
        return 'error'
      case ErrorCategory.CONTRACT:
        return 'error'
      case ErrorCategory.WALLET:
        return 'error'
      default:
        return 'error'
    }
  }

  const getIcon = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return <WarningIcon />
      case ErrorCategory.AUTHENTICATION:
        return <ErrorIcon />
      case ErrorCategory.NETWORK:
        return <WarningIcon />
      default:
        return <ErrorIcon />
    }
  }

  const severity = getSeverity(error.category)

  if (variant === 'snackbar') {
    return (
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={onClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={severity}
          onClose={onClose}
          icon={getIcon(error.category)}
          sx={{ width: '100%' }}
        >
          <AlertTitle>{error.category} Error</AlertTitle>
          {error.userMessage}
        </Alert>
      </Snackbar>
    )
  }

  return (
    <Alert
      severity={severity}
      icon={getIcon(error.category)}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {showDetails && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ mr: 1 }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
          {onClose && (
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      }
      sx={{ mb: 2 }}
    >
      <AlertTitle>{error.category} Error</AlertTitle>
      {error.userMessage}
      
      {showDetails && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Code:</strong> {error.code}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Message:</strong> {error.message}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Timestamp:</strong> {error.timestamp.toLocaleString()}
            </Typography>
            {error.details && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Details:</strong> {error.details}
              </Typography>
            )}
            {error.stack && (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                <strong>Stack:</strong><br />
                {error.stack}
              </Typography>
            )}
          </Box>
        </Collapse>
      )}
    </Alert>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

// Simple error boundary using function component with hook
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [error, setError] = useState<AppError | null>(null)

  useEffect(() => {
    const handleError = (errorEvent: ErrorEvent) => {
      setError({
        category: ErrorCategory.UNKNOWN,
        code: 'COMPONENT_ERROR',
        message: errorEvent.message,
        userMessage: 'A component error occurred. Please refresh the page.',
        timestamp: new Date(),
        stack: errorEvent.error?.stack
      })
    }

    window.addEventListener('error', handleError)
    
    return () => {
      window.removeEventListener('error', handleError)
    }
  }, [])

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorDisplay
          error={error}
          showDetails={true}
          onClose={() => setError(null)}
        />
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Refresh Page
        </Button>
      </Box>
    )
  }

  return <>{children}</>
}

export default ErrorDisplay
