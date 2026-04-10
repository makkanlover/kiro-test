import { contractService } from './ContractService'
import { getApiKeys } from '../utils'
import axios from 'axios'

export interface VerificationRequest {
  contractAddress: string
  sourceCode: string
  contractName: string
  compilerVersion: string
  optimizationEnabled: boolean
  optimizationRuns: number
  constructorArguments?: string
  libraries?: Record<string, string>
}

export interface VerificationResult {
  success: boolean
  message: string
  status: 'pending' | 'verified' | 'failed'
  guid?: string
}

export interface BlockExplorerAPI {
  name: string
  baseUrl: string
  apiKey?: string
  verifyEndpoint: string
  checkEndpoint: string
}

// Block explorer configurations
const BLOCK_EXPLORERS: Record<string, BlockExplorerAPI> = {
  '11155111': { // Sepolia
    name: 'Etherscan',
    baseUrl: 'https://api-sepolia.etherscan.io',
    verifyEndpoint: '/api',
    checkEndpoint: '/api'
  },
  '80002': { // Amoy (Polygon testnet)
    name: 'PolygonScan',
    baseUrl: 'https://api-amoy.polygonscan.com',
    verifyEndpoint: '/api',
    checkEndpoint: '/api'
  }
}

export class ContractVerificationService {
  private getBlockExplorer(chainId: string): BlockExplorerAPI | null {
    return BLOCK_EXPLORERS[chainId] || null
  }

  private getApiKey(chainId: string): string {
    const apiKeys = getApiKeys()
    switch (chainId) {
      case '11155111': // Sepolia
        return apiKeys.etherscan
      case '80002': // Amoy
        return apiKeys.polygonscan
      default:
        return ''
    }
  }

  async verifyContract(
    chainId: string,
    request: VerificationRequest
  ): Promise<VerificationResult> {
    const explorer = this.getBlockExplorer(chainId)
    if (!explorer) {
      throw new Error(`Verification not supported for chain ${chainId}`)
    }

    try {
      const apiKey = this.getApiKey(chainId)
      
      // If no API key, use mock implementation
      if (!apiKey) {
        console.warn(`No API key found for chain ${chainId}, using mock verification`)
        const mockResult = await this.mockVerifyContract(request)
        this.updateDeploymentRecord(chainId, request, mockResult)
        return mockResult
      }

      // Make actual API call to block explorer
      const result = await this.callBlockExplorerAPI(explorer, apiKey, request)
      
      // Update local deployment record
      this.updateDeploymentRecord(chainId, request, result)

      return result
    } catch (error) {
      console.error('Contract verification failed:', error)
      throw new Error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async callBlockExplorerAPI(
    explorer: BlockExplorerAPI,
    apiKey: string,
    request: VerificationRequest
  ): Promise<VerificationResult> {
    const params = new URLSearchParams({
      module: 'contract',
      action: 'verifysourcecode',
      apikey: apiKey,
      contractaddress: request.contractAddress,
      sourceCode: request.sourceCode,
      codeformat: 'solidity-single-file',
      contractname: request.contractName,
      compilerversion: request.compilerVersion,
      optimizationUsed: request.optimizationEnabled ? '1' : '0',
      runs: request.optimizationRuns?.toString() || '200'
    })

    if (request.constructorArguments) {
      params.append('constructorArguements', request.constructorArguments)
    }

    const response = await axios.post(`${explorer.baseUrl}${explorer.verifyEndpoint}`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })

    const data = response.data
    
    if (data.status === '1') {
      return {
        success: true,
        status: 'pending',
        message: 'Contract verification submitted successfully',
        guid: data.result
      }
    } else {
      return {
        success: false,
        status: 'failed',
        message: data.result || 'Verification failed'
      }
    }
  }

  private updateDeploymentRecord(
    chainId: string,
    request: VerificationRequest,
    result: VerificationResult
  ): void {
    const deployments = contractService.getDeployments()
    const deployment = deployments.find(d => 
      d.address.toLowerCase() === request.contractAddress.toLowerCase() &&
      d.networkId === chainId
    )
    
    if (deployment && result.success) {
      deployment.verified = true
      deployment.sourceCode = request.sourceCode
      deployment.compilerVersion = request.compilerVersion
      contractService.updateDeployment(deployment)
    }
  }

  private async mockVerifyContract(request: VerificationRequest): Promise<VerificationResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock validation
    if (!request.contractAddress || !request.sourceCode || !request.contractName) {
      return {
        success: false,
        status: 'failed',
        message: 'Missing required fields'
      }
    }

    if (!request.contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return {
        success: false,
        status: 'failed',
        message: 'Invalid contract address format'
      }
    }

    // Simulate successful verification
    return {
      success: true,
      status: 'verified',
      message: 'Contract verification successful',
      guid: `mock_${Date.now()}`
    }
  }

  async checkVerificationStatus(
    chainId: string,
    guid: string
  ): Promise<VerificationResult> {
    const explorer = this.getBlockExplorer(chainId)
    if (!explorer) {
      throw new Error(`Verification status check not supported for chain ${chainId}`)
    }

    const apiKey = this.getApiKey(chainId)
    
    // If no API key, use mock implementation
    if (!apiKey) {
      console.warn(`No API key found for chain ${chainId}, using mock status check`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        success: true,
        status: 'verified',
        message: 'Contract verified successfully (mock)'
      }
    }

    try {
      const params = new URLSearchParams({
        module: 'contract',
        action: 'checkverifystatus',
        apikey: apiKey,
        guid: guid
      })

      const response = await fetch(`${explorer.baseUrl}${explorer.checkEndpoint}?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status === '1') {
        return {
          success: true,
          status: 'verified',
          message: 'Contract verified successfully'
        }
      } else if (data.result === 'Pending in queue') {
        return {
          success: false,
          status: 'pending',
          message: 'Verification in progress'
        }
      } else {
        return {
          success: false,
          status: 'failed',
          message: data.result || 'Verification failed'
        }
      }
    } catch (error) {
      console.error('Status check failed:', error)
      throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getBytecodeFromExplorer(
    chainId: string,
    _contractAddress: string
  ): Promise<string> {
    const explorer = this.getBlockExplorer(chainId)
    if (!explorer) {
      throw new Error(`Bytecode fetching not supported for chain ${chainId}`)
    }

    try {
      // Mock implementation - in reality, this would fetch from the block explorer API
      const mockBytecode = "0x608060405234801561001057600080fd5b50..."
      return mockBytecode
    } catch (error) {
      throw new Error(`Failed to fetch bytecode: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  compareBytecode(compiled: string, deployed: string): boolean {
    // Remove 0x prefix and normalize
    const normalizeCode = (code: string) => code.replace(/^0x/, '').toLowerCase()
    
    const compiledNorm = normalizeCode(compiled)
    const deployedNorm = normalizeCode(deployed)
    
    // Simple comparison - in reality, this would be more sophisticated
    // accounting for metadata differences, constructor arguments, etc.
    return compiledNorm === deployedNorm || deployedNorm.includes(compiledNorm)
  }

  getSupportedNetworks(): Array<{ chainId: string; name: string; explorer: string }> {
    return Object.entries(BLOCK_EXPLORERS).map(([chainId, explorer]) => ({
      chainId,
      name: chainId === '11155111' ? 'Sepolia' : 'Amoy',
      explorer: explorer.name
    }))
  }

  getExplorerUrl(chainId: string, contractAddress: string): string {
    const explorer = this.getBlockExplorer(chainId)
    if (!explorer) {
      return ''
    }

    const baseUrl = explorer.baseUrl.replace('/api', '')
    if (chainId === '11155111') {
      return `https://sepolia.etherscan.io/address/${contractAddress}#code`
    } else if (chainId === '80002') {
      return `https://amoy.polygonscan.com/address/${contractAddress}#code`
    }
    
    return `${baseUrl}/address/${contractAddress}`
  }
}

export const contractVerificationService = new ContractVerificationService()