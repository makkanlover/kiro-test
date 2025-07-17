import { ContractService } from '../services/ContractService'

// Mock ethers
const mockContract = {
  getAddress: jest.fn().mockResolvedValue('0x9876543210987654321098765432109876543210'),
  deploymentTransaction: jest.fn().mockReturnValue({
    wait: jest.fn().mockResolvedValue({
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      blockNumber: 12345
    })
  })
}

const mockContractFactory = {
  getDeployTransaction: jest.fn().mockResolvedValue({}),
  deploy: jest.fn().mockResolvedValue(mockContract)
}

const mockProvider = {
  estimateGas: jest.fn().mockResolvedValue(BigInt(21000)),
  getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(11155111) })
}

const mockSigner = {
  getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
}

jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn(),
    ContractFactory: jest.fn(() => mockContractFactory),
    formatEther: jest.fn((value) => '0.001'),
    parseEther: jest.fn((value) => '1000000000000000')
  }
}))

// Mock wallet service
jest.mock('../services/WalletService', () => ({
  walletService: {
    getProvider: jest.fn(() => mockProvider),
    getSigner: jest.fn(() => mockSigner)
  }
}))

describe('ContractService', () => {
  let contractService: ContractService
  
  beforeEach(() => {
    contractService = new ContractService()
    jest.clearAllMocks()
  })

  describe('compileContract', () => {
    test('compiles valid contract successfully', async () => {
      const validCode = `
        pragma solidity ^0.8.0;
        
        contract SimpleStorage {
          uint256 private value;
          
          constructor(uint256 _initialValue) {
            value = _initialValue;
          }
          
          function getValue() public view returns (uint256) {
            return value;
          }
        }
      `
      
      const result = await contractService.compileContract(validCode, 'SimpleStorage')
      
      expect(result).toBeDefined()
      expect(result.abi).toBeDefined()
      expect(result.bytecode).toBeDefined()
      expect(Array.isArray(result.abi)).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    test('handles compilation errors', async () => {
      const invalidCode = 'invalid solidity code'
      
      await expect(contractService.compileContract(invalidCode, 'Invalid'))
        .rejects.toThrow('Compilation failed')
    })
  })

  describe('deployContract', () => {
    test('deploys contract successfully when wallet connected', async () => {
      const bytecode = '0x608060405234801561001057600080fd5b50'
      const abi = [
        {
          "inputs": [],
          "name": "getValue",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }
      ]
      const constructorArgs = []
      const contractName = 'SimpleStorage'
      
      const result = await contractService.deployContract(bytecode, abi, constructorArgs, contractName)
      
      expect(result).toBeDefined()
      expect(result.name).toBe(contractName)
      expect(result.address).toBe('0x9876543210987654321098765432109876543210')
      expect(result.transactionHash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
      expect(result.blockNumber).toBe(12345)
      expect(result.bytecode).toBe(bytecode)
      expect(result.abi).toEqual(abi)
      expect(result.constructorArgs).toEqual(constructorArgs)
      expect(result.verified).toBe(false)
      expect(mockContractFactory.deploy).toHaveBeenCalledWith(...constructorArgs, { gasLimit: BigInt(21000) })
    })

    test('throws error when wallet not connected', async () => {
      // Mock getSigner to return null
      const { walletService } = require('../services/WalletService')
      walletService.getSigner.mockReturnValueOnce(null)
      
      const bytecode = '0x608060405234801561001057600080fd5b50'
      const abi = []
      
      await expect(contractService.deployContract(bytecode, abi))
        .rejects.toThrow('Wallet not connected')
    })
  })

  describe('estimateDeploymentGas', () => {
    test('estimates gas successfully', async () => {
      const bytecode = '0x608060405234801561001057600080fd5b50'
      const constructorArgs = []
      
      const result = await contractService.estimateDeploymentGas(bytecode, constructorArgs)
      
      expect(result).toBe(BigInt(21000))
      expect(mockProvider.estimateGas).toHaveBeenCalled()
    })

    test('throws error when wallet not connected', async () => {
      const { walletService } = require('../services/WalletService')
      walletService.getSigner.mockReturnValueOnce(null)
      
      const bytecode = '0x608060405234801561001057600080fd5b50'
      
      await expect(contractService.estimateDeploymentGas(bytecode))
        .rejects.toThrow('Wallet not connected')
    })
  })

  describe('getDeployments', () => {
    test('returns deployments array', () => {
      const result = contractService.getDeployments()
      
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('verifyContract', () => {
    test('verifies contract successfully', async () => {
      const deployment = {
        id: '1',
        name: 'TestContract',
        address: '0x1234567890123456789012345678901234567890',
        bytecode: '0x608060405234801561001057600080fd5b50',
        abi: [],
        constructorArgs: [],
        transactionHash: '0xabcdef',
        blockNumber: 12345,
        deployedAt: new Date(),
        verified: false,
        networkId: '11155111'
      }
      
      const sourceCode = 'pragma solidity ^0.8.0; contract Test {}'
      
      const result = await contractService.verifyContract(deployment, sourceCode)
      
      expect(result).toBe(true)
      expect(deployment.verified).toBe(true)
      expect(deployment.sourceCode).toBe(sourceCode)
    })
  })
})