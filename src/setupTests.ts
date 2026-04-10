import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

// Configure testing library
configure({ testIdAttribute: 'data-testid' })

// Mock import.meta.env for Jest
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_PRIVATE_KEY: 'test-private-key',
        VITE_SEPOLIA_RPC_URL: 'https://sepolia.infura.io/v3/test',
        VITE_AMOY_RPC_URL: 'https://amoy.infura.io/v3/test',
        VITE_SEPOLIA_RPC_URL_FALLBACK: 'https://rpc.sepolia.org',
        VITE_AMOY_RPC_URL_FALLBACK: 'https://rpc-amoy.polygon.technology',
        VITE_ETHERSCAN_API_KEY: 'test-etherscan-key',
        VITE_POLYGONSCAN_API_KEY: 'test-polygonscan-key'
      }
    }
  }
})

// Also mock process.env
Object.assign(process.env, {
  VITE_PRIVATE_KEY: 'test-private-key',
  VITE_SEPOLIA_RPC_URL: 'https://sepolia.infura.io/v3/test',
  VITE_AMOY_RPC_URL: 'https://amoy.infura.io/v3/test',
  VITE_SEPOLIA_RPC_URL_FALLBACK: 'https://rpc.sepolia.org',
  VITE_AMOY_RPC_URL_FALLBACK: 'https://rpc-amoy.polygon.technology',
  VITE_ETHERSCAN_API_KEY: 'test-etherscan-key',
  VITE_POLYGONSCAN_API_KEY: 'test-polygonscan-key'
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock performance.now
Object.defineProperty(global.performance, 'now', {
  value: jest.fn(() => Date.now()),
})

// Mock crypto-js globally
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn((data, password) => ({
      toString: jest.fn(() => `encrypted_${data}_${password}`)
    })),
    decrypt: jest.fn((encryptedData, password) => ({
      toString: jest.fn(() => {
        if (encryptedData.includes(password)) {
          return encryptedData.replace(`encrypted_`, '').replace(`_${password}`, '')
        }
        throw new Error('Invalid password')
      })
    }))
  },
  enc: {
    Utf8: {}
  }
}))

// Mock React properly
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

// Mock electron APIs
Object.defineProperty(window, 'electronAPI', {
  value: {
    selectEnvFile: jest.fn(),
    store: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      has: jest.fn(),
    },
  },
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
})

// Suppress console errors during tests unless they're important
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})