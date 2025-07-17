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

module.exports = mockCryptoJS