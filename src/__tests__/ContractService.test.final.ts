import { ContractService } from '../services/ContractService'

// Mock ethers
const mockContractFactory = {
  deploy: jest.fn().mockResolvedValue({
    address: '0x9876543210987654321098765432109876543210',
    deployTransaction: {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      wait: jest.fn().mockResolvedValue({ status: 1 })
    }
  })
}

jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn(),
    ContractFactory: jest.fn(() => mockContractFactory),
    formatEther: jest.fn((value) => '0.001'),
    parseEther: jest.fn((value) => '1000000000000000')
  }
}))

// Mock solc
jest.mock('solc', () => ({
  compile: jest.fn((input) => {
    const sources = JSON.parse(input).sources
    const contractName = Object.keys(sources)[0]
    
    if (sources[contractName].content.includes('invalid')) {
      return JSON.stringify({
        errors: [{ formattedMessage: 'Compilation failed' }]
      })
    }
    
    return JSON.stringify({
      contracts: {
        [contractName]: {
          [contractName]: {
            abi: [
              {
                "inputs": [{"internalType": "uint256", "name": "_initialValue", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "constructor"
              },
              {
                "inputs": [],
                "name": "getValue",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
              }
            ],
            evm: {
              bytecode: {
                object: '0x608060405234801561001057600080fd5b50604051610123380380610123833981016040819052610031916100a4565b600080546001600160a01b03191633179055600155506100bd565b6000819050919050565b61005d8161004a565b811461006857600080fd5b50565b60008151905061007a81610054565b92915050565b60008060006060848603121561009b5761009a61004f565b5b60006100a98682870161006b565b9350506020848203156100bb575f80fd5b5f80fd5b50505090565b6056806100cb6000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632096525514610041578063b1b0a2331461005f575b600080fd5b61004961007d565b60405161005691906100b3565b60405180910390f35b61006761008a565b60405161007491906100b3565b60405180910390f35b600060015490565b6000600054905090565b61009e81610092565b82525050565b60006020820190506100b86000830184610095565b92915050565b600080fd5b6100cc81610092565b81146100d757600080fd5b50565b6000813590506100e9816100c3565b92915050565b600060208284031215610105576101046100be565b5b6000610113848285016100da565b9150509291505056fea2646970667358221220'
              }
            }
          }
        }
      }
    })
  })
}))

// Mock wallet service
const mockProvider = {
  getCode: jest.fn().mockResolvedValue('0x608060405234801561001057600080fd5b50')
}

const mockSigner = {
  getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
}

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
    })

    test('throws error for invalid contract', async () => {
      const invalidCode = 'invalid solidity code'
      
      await expect(contractService.compileContract(invalidCode, 'Invalid'))
        .rejects.toThrow('Compilation failed')
    })
  })

  describe('deployContract', () => {
    test('deploys contract successfully when wallet connected', async () => {
      const abi = [
        {
          "inputs": [],
          "name": "getValue",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }
      ]
      const bytecode = '0x608060405234801561001057600080fd5b50'
      
      const result = await contractService.deployContract(abi, bytecode)
      
      expect(result).toBeDefined()
      expect(result.address).toBe('0x9876543210987654321098765432109876543210')
      expect(result.transactionHash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
      expect(mockContractFactory.deploy).toHaveBeenCalled()
    })

    test('throws error when wallet not connected', async () => {
      // Mock getSigner to return null
      const { walletService } = require('../services/WalletService')
      walletService.getSigner.mockReturnValueOnce(null)
      
      const abi = []
      const bytecode = '0x608060405234801561001057600080fd5b50'
      
      await expect(contractService.deployContract(abi, bytecode))
        .rejects.toThrow('Wallet not connected')
    })
  })

  describe('verifyContract', () => {
    test('verifies contract successfully', async () => {
      const contractAddress = '0x1234567890123456789012345678901234567890'
      const sourceCode = `
        pragma solidity ^0.8.0;
        contract SimpleStorage {
          uint256 private value;
          function getValue() public view returns (uint256) {
            return value;
          }
        }
      `
      const contractName = 'SimpleStorage'
      const compilerVersion = '0.8.19'
      
      const result = await contractService.verifyContract(
        contractAddress,
        sourceCode,
        contractName,
        compilerVersion
      )
      
      expect(result).toBeDefined()
      expect(result.isVerified).toBe(true)
      expect(result.message).toContain('successfully')
    })

    test('handles verification failure', async () => {
      const contractAddress = '0x1234567890123456789012345678901234567890'
      const sourceCode = 'invalid solidity code'
      const contractName = 'Invalid'
      const compilerVersion = '0.8.19'
      
      const result = await contractService.verifyContract(
        contractAddress,
        sourceCode,
        contractName,
        compilerVersion
      )
      
      expect(result).toBeDefined()
      expect(result.isVerified).toBe(false)
      expect(result.message).toContain('failed')
    })
  })

  describe('getContractInfo', () => {
    test('returns contract info', async () => {
      const contractAddress = '0x1234567890123456789012345678901234567890'
      const result = await contractService.getContractInfo(contractAddress)
      
      expect(result).toBeDefined()
      expect(result.address).toBe(contractAddress)
      expect(result.bytecode).toBe('0x608060405234801561001057600080fd5b50')
      expect(mockProvider.getCode).toHaveBeenCalledWith(contractAddress)
    })
  })
})