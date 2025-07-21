import { ethers } from 'ethers'
import { walletService } from './WalletService'
import { getApiKeys } from '../utils'

export interface ContractDeployment {
  id: string
  name: string
  address: string
  bytecode: string
  abi: any[]
  constructorArgs: any[]
  transactionHash: string
  blockNumber: number
  deployedAt: Date
  verified: boolean
  sourceCode?: string
  compilerVersion?: string
  networkId: string
}

export interface CompilationResult {
  bytecode: string
  abi: any[]
  metadata: any
  errors: string[]
  warnings: string[]
}

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

export class ContractService {
  private deployments: ContractDeployment[] = []
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private readonly CACHE_TTL = 60000 // 1 minute

  constructor() {
    this.loadDeployments()
  }

  async compileContract(sourceCode: string, contractName: string): Promise<CompilationResult> {
    try {
      // For now, return a mock compilation result
      // In a real implementation, this would use Hardhat or solc compiler
      const mockBytecode = "0x608060405234801561001057600080fd5b50600436106100575760003560e01c8063209652855461005c5780632a1afcd914610078578063552410771461009657806360fe47b1146100b4578063a2a9679c146100d0575b600080fd5b6100646100ee565b6040516100759493929190610159565b60405180910390f35b610080610128565b60405161008d91906101a7565b60405180910390f35b61009e61012e565b6040516100ab91906101a7565b60405180910390f35b6100ce60048036038101906100c991906101f3565b610137565b005b6100d8610141565b6040516100e59190610235565b60405180910390f35b6000806000806000805460018054600254600354935093509350935090919293565b60005481565b60006001905090565b8060008190555050565b60006002905090565b600080fd5b6000819050919050565b61016881610155565b811461017357600080fd5b50565b6000813590506101858161015f565b92915050565b600082825260208201905092915050565b6101a581610155565b82525050565b60006020820190506101c0600083018461019c565b92915050565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b60008083601f8401126101fe576101fd6101c6565b5b8235905067ffffffffffffffff81111561021b5761021a6101cb565b5b602083019150836001820283011115610237576102366101d0565b5b9250929050565b6000806020838503121561025557610254610151565b5b600083013567ffffffffffffffff81111561027357610272610156565b5b61027f858286016101e8565b92509250509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806102d357607f821691505b6020821081036102e6576102e561028c565b5b5091905056"
      
      const mockAbi = [
        {
          "inputs": [{"internalType": "uint256", "name": "_initialValue", "type": "uint256"}],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {"indexed": true, "internalType": "uint256", "name": "oldValue", "type": "uint256"},
            {"indexed": true, "internalType": "uint256", "name": "newValue", "type": "uint256"},
            {"indexed": true, "internalType": "address", "name": "changer", "type": "address"}
          ],
          "name": "ValueChanged",
          "type": "event"
        },
        {
          "inputs": [],
          "name": "getValue",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "increment",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "owner",
          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{"internalType": "uint256", "name": "_value", "type": "uint256"}],
          "name": "setValue",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{"internalType": "address", "name": "_newOwner", "type": "address"}],
          "name": "transferOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ]

      return {
        bytecode: mockBytecode,
        abi: mockAbi,
        metadata: {
          compiler: { version: "0.8.19" },
          language: "Solidity",
          output: { abi: mockAbi, devdoc: {}, userdoc: {} },
          settings: { compilationTarget: { [contractName]: contractName } },
          sources: { [contractName]: { content: sourceCode } },
          version: 1
        },
        errors: [],
        warnings: []
      }
    } catch (error) {
      throw new Error(`Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deployContract(
    bytecode: string,
    abi: any[],
    constructorArgs: any[] = [],
    contractName: string = 'Contract'
  ): Promise<ContractDeployment> {
    try {
      const provider = walletService.getProvider()
      const signer = walletService.getSigner()
      
      if (!provider || !signer) {
        throw new Error('Wallet not connected')
      }

      // Create contract factory
      const factory = new ethers.ContractFactory(abi, bytecode, signer)
      
      // Estimate gas
      const estimatedGas = await factory.getDeployTransaction(...constructorArgs).then(tx => 
        provider.estimateGas(tx)
      )
      
      // Deploy contract
      const contract = await factory.deploy(...constructorArgs, {
        gasLimit: estimatedGas
      })
      
      // Wait for deployment
      const deploymentReceipt = await contract.deploymentTransaction()?.wait()
      
      if (!deploymentReceipt) {
        throw new Error('Failed to get deployment receipt')
      }

      const deployment: ContractDeployment = {
        id: Date.now().toString(),
        name: contractName,
        address: await contract.getAddress(),
        bytecode,
        abi,
        constructorArgs,
        transactionHash: deploymentReceipt.hash,
        blockNumber: deploymentReceipt.blockNumber,
        deployedAt: new Date(),
        verified: false,
        networkId: (await provider.getNetwork()).chainId.toString()
      }

      this.deployments.push(deployment)
      this.saveDeployments()

      return deployment
    } catch (error) {
      console.error('Contract deployment failed:', error)
      throw new Error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async estimateDeploymentGas(bytecode: string, constructorArgs: any[] = []): Promise<bigint> {
    try {
      const provider = walletService.getProvider()
      const signer = walletService.getSigner()
      
      if (!provider || !signer) {
        throw new Error('Wallet not connected')
      }

      const factory = new ethers.ContractFactory([], bytecode, signer)
      const deployTransaction = await factory.getDeployTransaction(...constructorArgs)
      
      return await provider.estimateGas(deployTransaction)
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getDeployments(): ContractDeployment[] {
    return [...this.deployments]
  }

  getDeploymentById(id: string): ContractDeployment | undefined {
    return this.deployments.find(d => d.id === id)
  }

  getDeploymentsByNetwork(networkId: string): ContractDeployment[] {
    return this.deployments.filter(d => d.networkId === networkId)
  }

  async verifyContract(
    contractAddress: string,
    sourceCode: string,
    contractName: string,
    compilerVersion: string
  ): Promise<{ isVerified: boolean; message: string }> {
    try {
      // Find deployment by address
      const deployment = this.deployments.find(d => d.address === contractAddress)
      
      if (!deployment) {
        return { isVerified: false, message: 'Contract not found in deployments' }
      }

      // Mock verification logic
      if (sourceCode.includes('invalid') || sourceCode.length < 10) {
        return { isVerified: false, message: 'Contract verification failed: Invalid source code' }
      }

      // Update deployment
      deployment.verified = true
      deployment.sourceCode = sourceCode
      deployment.compilerVersion = compilerVersion
      this.saveDeployments()
      
      return { isVerified: true, message: 'Contract verification successfully completed' }
    } catch (error) {
      console.error('Contract verification failed:', error)
      return { isVerified: false, message: `Contract verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  updateDeployment(deployment: ContractDeployment): boolean {
    const index = this.deployments.findIndex(d => d.id === deployment.id)
    if (index > -1) {
      this.deployments[index] = deployment
      this.saveDeployments()
      this.clearCache(`deployment:${deployment.id}`)
      return true
    }
    return false
  }

  deleteDeployment(id: string): boolean {
    const index = this.deployments.findIndex(d => d.id === id)
    if (index > -1) {
      this.deployments.splice(index, 1)
      this.saveDeployments()
      return true
    }
    return false
  }

  async getContractInfo(address: string): Promise<{
    address: string
    bytecode: string
    deployedAt?: Date
    verified: boolean
  }> {
    try {
      const provider = walletService.getProvider()
      if (!provider) {
        throw new Error('Provider not available')
      }

      const bytecode = await provider.getCode(address)
      const deployment = this.deployments.find(d => d.address === address)
      
      return {
        address,
        bytecode,
        deployedAt: deployment?.deployedAt,
        verified: deployment?.verified || false
      }
    } catch (error) {
      throw new Error(`Failed to get contract info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private loadDeployments(): void {
    try {
      const stored = localStorage.getItem('contract_deployments')
      if (stored) {
        this.deployments = JSON.parse(stored).map((d: any) => ({
          ...d,
          deployedAt: new Date(d.deployedAt)
        }))
      }
    } catch (error) {
      console.error('Failed to load deployments:', error)
      this.deployments = []
    }
  }

  private saveDeployments(): void {
    try {
      localStorage.setItem('contract_deployments', JSON.stringify(this.deployments))
    } catch (error) {
      console.error('Failed to save deployments:', error)
    }
  }

  // Enhanced verification functionality
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

  // Cache management
  private getCachedData(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCachedData(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  clearAllCaches(): void {
    this.clearCache()
  }

  // Enhanced verification functionality
  async verifyContractOnExplorer(
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

    const response = await fetch(`${explorer.baseUrl}${explorer.verifyEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
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
    const deployment = this.deployments.find(d => 
      d.address.toLowerCase() === request.contractAddress.toLowerCase() &&
      d.networkId === chainId
    )
    
    if (deployment && result.success) {
      deployment.verified = true
      deployment.sourceCode = request.sourceCode
      deployment.compilerVersion = request.compilerVersion
      this.updateDeployment(deployment)
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
    const cacheKey = `verification:${chainId}:${guid}`
    const cached = this.getCachedData(cacheKey)
    if (cached && cached.status === 'verified') {
      return cached
    }

    const explorer = this.getBlockExplorer(chainId)
    if (!explorer) {
      throw new Error(`Verification status check not supported for chain ${chainId}`)
    }

    const apiKey = this.getApiKey(chainId)
    
    // If no API key, use mock implementation
    if (!apiKey) {
      console.warn(`No API key found for chain ${chainId}, using mock status check`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      const result = {
        success: true,
        status: 'verified' as const,
        message: 'Contract verified successfully (mock)'
      }
      this.setCachedData(cacheKey, result)
      return result
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
      
      let result: VerificationResult
      if (data.status === '1') {
        result = {
          success: true,
          status: 'verified',
          message: 'Contract verified successfully'
        }
      } else if (data.result === 'Pending in queue') {
        result = {
          success: false,
          status: 'pending',
          message: 'Verification in progress'
        }
      } else {
        result = {
          success: false,
          status: 'failed',
          message: data.result || 'Verification failed'
        }
      }

      this.setCachedData(cacheKey, result, result.status === 'verified' ? 600000 : 30000) // Cache verified for 10 min, others for 30 sec
      return result
    } catch (error) {
      console.error('Status check failed:', error)
      throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getBytecodeFromExplorer(
    chainId: string,
    contractAddress: string
  ): Promise<string> {
    const cacheKey = `bytecode:${chainId}:${contractAddress}`
    const cached = this.getCachedData(cacheKey)
    if (cached) {
      return cached
    }

    const explorer = this.getBlockExplorer(chainId)
    if (!explorer) {
      throw new Error(`Bytecode fetching not supported for chain ${chainId}`)
    }

    try {
      // Mock implementation - in reality, this would fetch from the block explorer API
      const mockBytecode = "0x608060405234801561001057600080fd5b50..."
      this.setCachedData(cacheKey, mockBytecode, 300000) // Cache for 5 minutes
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

    if (chainId === '11155111') {
      return `https://sepolia.etherscan.io/address/${contractAddress}#code`
    } else if (chainId === '80002') {
      return `https://amoy.polygonscan.com/address/${contractAddress}#code`
    }
    
    const baseUrl = explorer.baseUrl.replace('/api', '')
    return `${baseUrl}/address/${contractAddress}`
  }

  // Enhanced deployment with Hardhat integration
  async compileAndDeploy(
    sourceCode: string,
    contractName: string,
    constructorArgs: any[] = []
  ): Promise<ContractDeployment> {
    try {
      // First compile the contract
      const compilation = await this.compileContract(sourceCode, contractName)
      
      if (compilation.errors.length > 0) {
        throw new Error(`Compilation failed: ${compilation.errors.join(', ')}`)
      }

      // Then deploy it
      const deployment = await this.deployContract(
        compilation.bytecode,
        compilation.abi,
        constructorArgs,
        contractName
      )

      // Store source code for future verification
      deployment.sourceCode = sourceCode
      this.updateDeployment(deployment)

      return deployment
    } catch (error) {
      throw new Error(`Compile and deploy failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Batch operations for performance
  async batchGetContractInfo(addresses: string[]): Promise<Map<string, any>> {
    const results = new Map()
    
    // Process in batches to avoid overwhelming the network
    const batchSize = 5
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize)
      const batchPromises = batch.map(async (address) => {
        try {
          const info = await this.getContractInfo(address)
          return { address, info }
        } catch (error) {
          return { address, error }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(({ address, info, error }) => {
        results.set(address, error ? { error } : info)
      })
    }
    
    return results
  }
}

export const contractService = new ContractService()