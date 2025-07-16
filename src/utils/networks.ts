import { Network, NetworkId } from '../types'

export const SUPPORTED_NETWORKS: Record<NetworkId, Network> = {
  [NetworkId.SEPOLIA]: {
    id: NetworkId.SEPOLIA,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    chainId: 11155111,
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  [NetworkId.AMOY]: {
    id: NetworkId.AMOY,
    name: 'Polygon Amoy Testnet',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    chainId: 80002,
    blockExplorerUrl: 'https://www.oklink.com/amoy',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  }
}

export const getNetworkById = (networkId: NetworkId): Network => {
  return SUPPORTED_NETWORKS[networkId]
}

export const getNetworkByChainId = (chainId: number): Network | undefined => {
  return Object.values(SUPPORTED_NETWORKS).find(network => network.chainId === chainId)
}