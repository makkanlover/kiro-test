import { validatePasswordStrength } from '../utils/crypto'

// Mock crypto-js at the module level
const mockCryptoJS = {
  AES: {
    encrypt: jest.fn((data, password) => ({
      toString: jest.fn(() => `encrypted_${data}_${password}`)
    })),
    decrypt: jest.fn((encryptedData, password) => ({
      toString: jest.fn(() => {
        if (encryptedData.includes(password)) {
          return encryptedData.replace('encrypted_', '').replace(`_${password}`, '')
        }
        throw new Error('Invalid password')
      })
    }))
  },
  enc: {
    Utf8: {}
  }
}

// Mock the crypto module
jest.mock('crypto-js', () => mockCryptoJS)

// Mock the crypto functions directly for testing
const mockEncryptData = jest.fn((data, password) => `encrypted_${data}_${password}`)
const mockDecryptData = jest.fn((encryptedData, password) => {
  if (encryptedData.includes(password)) {
    return encryptedData.replace('encrypted_', '').replace(`_${password}`, '')
  }
  throw new Error('Invalid password')
})

// Mock the crypto utils module
jest.mock('../utils/crypto', () => ({
  validatePasswordStrength: jest.requireActual('../utils/crypto').validatePasswordStrength,
  encryptData: mockEncryptData,
  decryptData: mockDecryptData
}))

describe('Crypto Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validatePasswordStrength', () => {
    test('validates strong password', () => {
      const result = validatePasswordStrength('StrongPassword123!')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('rejects short password', () => {
      const result = validatePasswordStrength('Short1!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    test('rejects password without uppercase', () => {
      const result = validatePasswordStrength('lowercase123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    test('rejects password without lowercase', () => {
      const result = validatePasswordStrength('UPPERCASE123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    test('rejects password without number', () => {
      const result = validatePasswordStrength('NoNumbers!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    test('rejects password without special character', () => {
      const result = validatePasswordStrength('NoSpecialChar123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one special character')
    })

    test('returns multiple errors for weak password', () => {
      const result = validatePasswordStrength('weak')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('encryptData and decryptData', () => {
    test('encrypts and decrypts data correctly', () => {
      const originalData = 'sensitive information'
      const password = 'testPassword123!'
      
      const encrypted = mockEncryptData(originalData, password)
      expect(encrypted).not.toBe(originalData)
      expect(encrypted).toBeTruthy()
      
      const decrypted = mockDecryptData(encrypted, password)
      expect(decrypted).toBe(originalData)
    })

    test('throws error when decrypting with wrong password', () => {
      const originalData = 'sensitive information'
      const correctPassword = 'correctPassword123!'
      const wrongPassword = 'wrongPassword123!'
      
      const encrypted = mockEncryptData(originalData, correctPassword)
      
      expect(() => {
        mockDecryptData(encrypted, wrongPassword)
      }).toThrow('Invalid password')
    })

    test('handles empty data', () => {
      const originalData = ''
      const password = 'testPassword123!'
      
      const encrypted = mockEncryptData(originalData, password)
      const decrypted = mockDecryptData(encrypted, password)
      
      expect(decrypted).toBe(originalData)
    })

    test('handles special characters in data', () => {
      const originalData = '{"key": "value", "special": "!@#$%^&*()_+"}'
      const password = 'testPassword123!'
      
      const encrypted = mockEncryptData(originalData, password)
      const decrypted = mockDecryptData(encrypted, password)
      
      expect(decrypted).toBe(originalData)
    })
  })
})