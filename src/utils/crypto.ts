import CryptoJS from 'crypto-js'

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