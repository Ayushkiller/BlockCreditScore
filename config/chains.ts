// Multi-chain configuration for development and testing

import { ChainConfig } from '../types/transactions';

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {
      creditScore: process.env.ETHEREUM_CREDIT_SCORE_CONTRACT,
      nftCertificate: process.env.ETHEREUM_NFT_CERTIFICATE_CONTRACT,
      zkVerifier: process.env.ETHEREUM_ZK_VERIFIER_CONTRACT
    }
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.alchemyapi.io/v2/your-api-key',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    contracts: {
      creditScore: process.env.POLYGON_CREDIT_SCORE_CONTRACT,
      nftCertificate: process.env.POLYGON_NFT_CERTIFICATE_CONTRACT,
      zkVerifier: process.env.POLYGON_ZK_VERIFIER_CONTRACT
    }
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb-mainnet.alchemyapi.io/v2/your-api-key',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {
      creditScore: process.env.ARBITRUM_CREDIT_SCORE_CONTRACT,
      nftCertificate: process.env.ARBITRUM_NFT_CERTIFICATE_CONTRACT,
      zkVerifier: process.env.ARBITRUM_ZK_VERIFIER_CONTRACT
    }
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://opt-mainnet.alchemyapi.io/v2/your-api-key',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {
      creditScore: process.env.OPTIMISM_CREDIT_SCORE_CONTRACT,
      nftCertificate: process.env.OPTIMISM_NFT_CERTIFICATE_CONTRACT,
      zkVerifier: process.env.OPTIMISM_ZK_VERIFIER_CONTRACT
    }
  }
};

export const TESTNET_CHAINS: Record<string, ChainConfig> = {
  goerli: {
    chainId: 5,
    name: 'Goerli Testnet',
    rpcUrl: process.env.GOERLI_RPC_URL || 'https://eth-goerli.alchemyapi.io/v2/your-api-key',
    blockExplorer: 'https://goerli.etherscan.io',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'GoerliETH',
      decimals: 18
    },
    contracts: {
      creditScore: process.env.GOERLI_CREDIT_SCORE_CONTRACT,
      nftCertificate: process.env.GOERLI_NFT_CERTIFICATE_CONTRACT,
      zkVerifier: process.env.GOERLI_ZK_VERIFIER_CONTRACT
    }
  },
  mumbai: {
    chainId: 80001,
    name: 'Mumbai Testnet',
    rpcUrl: process.env.MUMBAI_RPC_URL || 'https://polygon-mumbai.alchemyapi.io/v2/your-api-key',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    contracts: {
      creditScore: process.env.MUMBAI_CREDIT_SCORE_CONTRACT,
      nftCertificate: process.env.MUMBAI_NFT_CERTIFICATE_CONTRACT,
      zkVerifier: process.env.MUMBAI_ZK_VERIFIER_CONTRACT
    }
  },
  arbitrumGoerli: {
    chainId: 421613,
    name: 'Arbitrum Goerli',
    rpcUrl: process.env.ARBITRUM_GOERLI_RPC_URL || 'https://goerli-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://goerli.arbiscan.io',
    nativeCurrency: {
      name: 'Arbitrum Goerli Ether',
      symbol: 'AGOR',
      decimals: 18
    },
    contracts: {
      creditScore: process.env.ARBITRUM_GOERLI_CREDIT_SCORE_CONTRACT,
      nftCertificate: process.env.ARBITRUM_GOERLI_NFT_CERTIFICATE_CONTRACT,
      zkVerifier: process.env.ARBITRUM_GOERLI_ZK_VERIFIER_CONTRACT
    }
  }
};

export const LOCAL_CHAINS: Record<string, ChainConfig> = {
  hardhat: {
    chainId: 31337,
    name: 'Hardhat Network',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {}
  },
  anvil: {
    chainId: 31337,
    name: 'Anvil Local Network',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {}
  }
};

export function getChainConfig(chainId: number): ChainConfig | undefined {
  const allChains = { ...SUPPORTED_CHAINS, ...TESTNET_CHAINS, ...LOCAL_CHAINS };
  return Object.values(allChains).find(chain => chain.chainId === chainId);
}

export function getChainByName(name: string): ChainConfig | undefined {
  const allChains = { ...SUPPORTED_CHAINS, ...TESTNET_CHAINS, ...LOCAL_CHAINS };
  return allChains[name];
}

export function isTestnet(chainId: number): boolean {
  return Object.values(TESTNET_CHAINS).some(chain => chain.chainId === chainId);
}

export function isMainnet(chainId: number): boolean {
  return Object.values(SUPPORTED_CHAINS).some(chain => chain.chainId === chainId);
}

export function isLocalNetwork(chainId: number): boolean {
  return Object.values(LOCAL_CHAINS).some(chain => chain.chainId === chainId);
}