import { ContractVerificationService } from '../services/ContractVerificationService'
import { getApiKeys } from '../utils'
import axios from 'axios'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock utils
jest.mock('../utils', () => ({
  getApiKeys: jest.fn()
}))

describe('ContractVerificationService', () => {
  let service: ContractVerificationService
  let mockGetApiKeys: jest.Mock

  beforeEach(() => {
    service = new ContractVerificationService()
    mockGetApiKeys = getApiKeys as jest.Mock
    mockGetApiKeys.mockReturnValue({
      etherscan: 'test-etherscan-key',
      polygonscan: 'test-polygonscan-key'
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyContract', () => {
    test('verifies contract on Sepolia successfully', async () => {
      const mockResponse = {
        data: {
          status: '1',
          message: 'OK',
          result: 'guid-123'
        }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const request = {
        contractAddress: '0x1234567890123456789012345678901234567890',
        sourceCode: 'pragma solidity ^0.8.0; contract Test {}',
        contractName: 'Test',
        compilerVersion: '0.8.19',
        optimizationEnabled: false,
        optimizationRuns: 200,
        constructorArguments: ''
      }
      
      const result = await service.verifyContract('11155111', request)
      
      expect(result.success).toBe(true)
      expect(result.status).toBe('pending')
      expect(result.guid).toBe('guid-123')
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-sepolia.etherscan.io/api',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      )
    })

    test('verifies contract on Amoy successfully', async () => {
      const mockResponse = {
        data: {
          status: '1',
          message: 'OK',
          result: 'guid-456'
        }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const request = {
        contractAddress: '0x1234567890123456789012345678901234567890',
        sourceCode: 'pragma solidity ^0.8.0; contract Test {}',
        contractName: 'Test',
        compilerVersion: '0.8.19',
        optimizationEnabled: false,
        optimizationRuns: 200,
        constructorArguments: ''
      }
      
      const result = await service.verifyContract('80002', request)
      
      expect(result.success).toBe(true)
      expect(result.status).toBe('pending')
      expect(result.guid).toBe('guid-456')
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-amoy.polygonscan.com/api',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      )
    })

    test('handles verification failure', async () => {
      const mockResponse = {
        data: {
          status: '0',
          message: 'NOTOK',
          result: 'Contract verification failed'
        }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const result = await service.verifyContract('11155111', {
        contractAddress: '0x1234567890123456789012345678901234567890',
        sourceCode: 'invalid solidity code',
        contractName: 'Test',
        compilerVersion: '0.8.19',
        optimizationEnabled: false,
        optimizationRuns: 200,
        constructorArguments: ''
      })
      
      expect(result.success).toBe(false)
      expect(result.status).toBe('failed')
      expect(result.message).toBe('Contract verification failed')
    })

    test('handles network error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'))
      
      await expect(async () => {
        await service.verifyContract('11155111', {
          contractAddress: '0x1234567890123456789012345678901234567890',
          sourceCode: 'pragma solidity ^0.8.0; contract Test {}',
          contractName: 'Test',
          compilerVersion: '0.8.19',
          optimizationEnabled: false,
          optimizationRuns: 200,
          constructorArguments: ''
        })
      }).rejects.toThrow('Verification failed: Network error')
    })

    test('handles unsupported network', async () => {
      await expect(async () => {
        await service.verifyContract('999999', {
          contractAddress: '0x1234567890123456789012345678901234567890',
          sourceCode: 'pragma solidity ^0.8.0; contract Test {}',
          contractName: 'Test',
          compilerVersion: '0.8.19',
          optimizationEnabled: false,
          optimizationRuns: 200,
          constructorArguments: ''
        })
      }).rejects.toThrow('Verification not supported for chain 999999')
    })

    test('handles missing API key with mock verification', async () => {
      mockGetApiKeys.mockReturnValue({
        etherscan: '',
        polygonscan: ''
      })
      
      const result = await service.verifyContract('11155111', {
        contractAddress: '0x1234567890123456789012345678901234567890',
        sourceCode: 'pragma solidity ^0.8.0; contract Test {}',
        contractName: 'Test',
        compilerVersion: '0.8.19',
        optimizationEnabled: false,
        optimizationRuns: 200,
        constructorArguments: ''
      })
      
      expect(result.success).toBe(true)
      expect(result.status).toBe('verified')
      expect(result.message).toBe('Contract verification successful')
    })

    test('includes optimization parameters when enabled', async () => {
      const mockResponse = {
        data: {
          status: '1',
          message: 'OK',
          result: 'guid-789'
        }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      await service.verifyContract('11155111', {
        contractAddress: '0x1234567890123456789012345678901234567890',
        sourceCode: 'pragma solidity ^0.8.0; contract Test {}',
        contractName: 'Test',
        compilerVersion: '0.8.19',
        optimizationEnabled: true,
        optimizationRuns: 1000,
        constructorArguments: '0x123456'
      })
      
      const callArgs = mockedAxios.post.mock.calls[0]
      const formData = callArgs[1] as URLSearchParams
      
      expect(formData.get('optimizationUsed')).toBe('1')
      expect(formData.get('runs')).toBe('1000')
      expect(formData.get('constructorArguements')).toBe('0x123456')
    })
  })
})