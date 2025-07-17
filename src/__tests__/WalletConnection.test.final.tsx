import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import WalletConnection from '../components/WalletConnection'

// Mock React completely
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  Component: jest.requireActual('react').Component,
  createElement: jest.requireActual('react').createElement,
  memo: jest.requireActual('react').memo,
  useCallback: jest.requireActual('react').useCallback,
  useContext: jest.requireActual('react').useContext,
  useEffect: jest.requireActual('react').useEffect,
  useMemo: jest.requireActual('react').useMemo,
  useRef: jest.requireActual('react').useRef,
  useState: jest.requireActual('react').useState,
  createContext: jest.requireActual('react').createContext,
  lazy: jest.requireActual('react').lazy,
  Suspense: jest.requireActual('react').Suspense,
  PropsWithChildren: jest.requireActual('react').PropsWithChildren,
}))

// Mock the i18n context
const mockI18nContext = {
  language: 'en',
  setLanguage: jest.fn(),
  t: jest.fn((key) => {
    const translations = {
      'wallet.welcome': 'Welcome to Web3 Wallet',
      'wallet.createNew': 'Create New Wallet',
      'wallet.createNewDesc': 'Generate a new wallet with a secure mnemonic phrase',
      'common.cancel': 'Cancel',
      'common.password': 'Password',
      'wallet.confirmPassword': 'Confirm Password',
      'common.unlock': 'Unlock',
      'common.create': 'Create Wallet'
    }
    return translations[key] || key
  }),
  formatDate: jest.fn(),
  formatNumber: jest.fn(),
  formatCurrency: jest.fn()
}

jest.mock('../contexts/I18nContext', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  useI18n: () => mockI18nContext
}))

// Mock the wallet context
const mockWalletContext = {
  wallet: null,
  connectWallet: jest.fn(),
  unlockWallet: jest.fn(),
  isLoading: false,
  clearError: jest.fn()
}

jest.mock('../contexts/WalletContext', () => ({
  useWallet: () => mockWalletContext
}))

// Mock error handler
jest.mock('../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    currentError: null,
    handleWalletError: jest.fn(),
    handleValidationError: jest.fn(),
    clearError: jest.fn()
  })
}))

// Mock crypto utils
jest.mock('../utils/crypto', () => ({
  validatePasswordStrength: jest.fn(() => ({ isValid: true, errors: [] }))
}))

// Mock electron API
Object.defineProperty(window, 'electronAPI', {
  value: {
    selectEnvFile: jest.fn(),
    store: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
})

const theme = createTheme()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  )
}

describe('WalletConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders wallet connection options', () => {
    renderWithProviders(<WalletConnection />)
    
    expect(screen.getByText('Create New Wallet')).toBeInTheDocument()
    expect(screen.getByText('Load from .env File')).toBeInTheDocument()
    expect(screen.getByText('Connect MetaMask')).toBeInTheDocument()
    expect(screen.getByText('WalletConnect')).toBeInTheDocument()
    expect(screen.getByText('Recover Wallet')).toBeInTheDocument()
  })

  test('opens create wallet dialog', () => {
    renderWithProviders(<WalletConnection />)
    
    fireEvent.click(screen.getByText('Create Wallet'))
    
    expect(screen.getByText('Create New Wallet')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
  })

  test('opens unlock wallet dialog when wallet exists', () => {
    const walletWithLock = {
      address: '0x1234567890123456789012345678901234567890',
      connectionMethod: 'new_wallet',
      isLocked: true,
      networkId: 'sepolia'
    }
    
    mockWalletContext.wallet = walletWithLock
    
    renderWithProviders(<WalletConnection />)
    
    fireEvent.click(screen.getByText('Unlock Wallet'))
    
    expect(screen.getByText('Unlock Wallet')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  test('calls connectWallet when creating new wallet', async () => {
    renderWithProviders(<WalletConnection />)
    
    fireEvent.click(screen.getByText('Create Wallet'))
    
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    
    fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'TestPassword123!' } })
    
    fireEvent.click(screen.getByText('Create Wallet'))
    
    await waitFor(() => {
      expect(mockWalletContext.connectWallet).toHaveBeenCalledWith('new_wallet', {
        password: 'TestPassword123!'
      })
    })
  })

  test('calls unlockWallet when unlocking existing wallet', async () => {
    const walletWithLock = {
      address: '0x1234567890123456789012345678901234567890',
      connectionMethod: 'new_wallet',
      isLocked: true,
      networkId: 'sepolia'
    }
    
    mockWalletContext.wallet = walletWithLock
    
    renderWithProviders(<WalletConnection />)
    
    fireEvent.click(screen.getByText('Unlock Wallet'))
    
    const passwordInput = screen.getByLabelText('Password')
    fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } })
    
    fireEvent.click(screen.getByText('Unlock'))
    
    await waitFor(() => {
      expect(mockWalletContext.unlockWallet).toHaveBeenCalledWith('TestPassword123!')
    })
  })
})