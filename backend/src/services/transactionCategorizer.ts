import { TransactionData } from './blockchainService';
import { TransactionCategory } from './transactionAnalysisEngine';

/**
 * Transaction Categorization System
 * Provides comprehensive categorization of blockchain transactions
 */

export interface CategoryResult {
  primary: TransactionCategory;
  subcategory: string;
  confidence: number; // 0-100
  protocolName?: string;
  protocolType?: ProtocolType;
  sophisticationLevel: SophisticationLevel;
  tags: string[];
}

export enum ProtocolType {
  DEX = 'DEX',
  LENDING = 'LENDING',
  STAKING = 'STAKING',
  YIELD_FARMING = 'YIELD_FARMING',
  DERIVATIVES = 'DERIVATIVES',
  INSURANCE = 'INSURANCE',
  BRIDGE = 'BRIDGE',
  DAO = 'DAO',
  NFT_MARKETPLACE = 'NFT_MARKETPLACE',
  GAMING = 'GAMING',
  SOCIAL = 'SOCIAL'
}

export enum SophisticationLevel {
  BASIC = 'BASIC',           // Simple transfers, basic swaps
  INTERMEDIATE = 'INTERMEDIATE', // Standard DeFi interactions
  ADVANCED = 'ADVANCED',     // Complex DeFi strategies
  EXPERT = 'EXPERT'          // Advanced strategies, MEV, arbitrage
}

/**
 * Comprehensive protocol database with categorization rules
 */
export class ProtocolDatabase {
  
  // Comprehensive protocol mapping with enhanced metadata
  private static readonly PROTOCOLS = {
    // DEX Protocols
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': {
      name: 'Uniswap V2 Router',
      type: ProtocolType.DEX,
      category: TransactionCategory.DEFI_SWAP,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['dex', 'amm', 'swap', 'uniswap']
    },
    '0xE592427A0AEce92De3Edee1F18E0157C05861564': {
      name: 'Uniswap V3 Router',
      type: ProtocolType.DEX,
      category: TransactionCategory.DEFI_SWAP,
      sophistication: SophisticationLevel.ADVANCED,
      tags: ['dex', 'amm', 'swap', 'uniswap', 'concentrated-liquidity']
    },
    '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45': {
      name: 'Uniswap V3 Router 2',
      type: ProtocolType.DEX,
      category: TransactionCategory.DEFI_SWAP,
      sophistication: SophisticationLevel.ADVANCED,
      tags: ['dex', 'amm', 'swap', 'uniswap', 'concentrated-liquidity']
    },
    '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F': {
      name: 'SushiSwap Router',
      type: ProtocolType.DEX,
      category: TransactionCategory.DEFI_SWAP,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['dex', 'amm', 'swap', 'sushiswap']
    },
    '0x1111111254fb6c44bAC0beD2854e76F90643097d': {
      name: '1inch V4 Router',
      type: ProtocolType.DEX,
      category: TransactionCategory.DEFI_SWAP,
      sophistication: SophisticationLevel.EXPERT,
      tags: ['dex', 'aggregator', 'swap', '1inch', 'mev-protection']
    },
    '0x1111111254EEB25477B68fb85Ed929f73A960582': {
      name: '1inch V5 Router',
      type: ProtocolType.DEX,
      category: TransactionCategory.DEFI_SWAP,
      sophistication: SophisticationLevel.EXPERT,
      tags: ['dex', 'aggregator', 'swap', '1inch', 'mev-protection']
    },
    '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7': {
      name: 'Curve 3Pool',
      type: ProtocolType.DEX,
      category: TransactionCategory.DEFI_SWAP,
      sophistication: SophisticationLevel.ADVANCED,
      tags: ['dex', 'curve', 'stableswap', 'liquidity-pool']
    },
    '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5': {
      name: 'Curve Registry',
      type: ProtocolType.DEX,
      category: TransactionCategory.DEFI_LIQUIDITY,
      sophistication: SophisticationLevel.EXPERT,
      tags: ['dex', 'curve', 'registry', 'meta-pool']
    },

    // Lending Protocols
    '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9': {
      name: 'Aave V2 Lending Pool',
      type: ProtocolType.LENDING,
      category: TransactionCategory.DEFI_LENDING,
      sophistication: SophisticationLevel.ADVANCED,
      tags: ['lending', 'borrowing', 'aave', 'flash-loans']
    },
    '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2': {
      name: 'Aave V3 Pool',
      type: ProtocolType.LENDING,
      category: TransactionCategory.DEFI_LENDING,
      sophistication: SophisticationLevel.ADVANCED,
      tags: ['lending', 'borrowing', 'aave', 'efficiency-mode']
    },
    '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B': {
      name: 'Compound Comptroller',
      type: ProtocolType.LENDING,
      category: TransactionCategory.DEFI_LENDING,
      sophistication: SophisticationLevel.ADVANCED,
      tags: ['lending', 'borrowing', 'compound', 'governance']
    },
    '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5': {
      name: 'Compound cETH',
      type: ProtocolType.LENDING,
      category: TransactionCategory.DEFI_LENDING,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['lending', 'compound', 'ctoken']
    },

    // MakerDAO
    '0x5ef30b9986345249bc32d8928B7ee64DE9435E39': {
      name: 'MakerDAO CDP Manager',
      type: ProtocolType.LENDING,
      category: TransactionCategory.DEFI_BORROWING,
      sophistication: SophisticationLevel.EXPERT,
      tags: ['makerdao', 'cdp', 'dai', 'collateral', 'vault']
    },
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
      name: 'DAI Token',
      type: ProtocolType.LENDING,
      category: TransactionCategory.TRANSFER,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['stablecoin', 'dai', 'makerdao']
    },

    // Staking Protocols
    '0x00000000219ab540356cBB839Cbe05303d7705Fa': {
      name: 'ETH 2.0 Deposit Contract',
      type: ProtocolType.STAKING,
      category: TransactionCategory.STAKING,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['staking', 'eth2', 'validator', 'beacon-chain']
    },
    '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84': {
      name: 'Lido stETH',
      type: ProtocolType.STAKING,
      category: TransactionCategory.STAKING,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['liquid-staking', 'lido', 'steth', 'validator']
    },
    '0xae78736Cd615f374D3085123A210448E74Fc6393': {
      name: 'Rocket Pool rETH',
      type: ProtocolType.STAKING,
      category: TransactionCategory.STAKING,
      sophistication: SophisticationLevel.ADVANCED,
      tags: ['liquid-staking', 'rocket-pool', 'reth', 'decentralized']
    },
    '0x9559Aaa82d9649C7A7b220E7c461d2E74c9a3593': {
      name: 'StaFi rETH',
      type: ProtocolType.STAKING,
      category: TransactionCategory.STAKING,
      sophistication: SophisticationLevel.ADVANCED,
      tags: ['liquid-staking', 'stafi', 'reth']
    },
    '0xA4C637e0F704745D182e4D38cAb7E7485321d059': {
      name: 'Ankr aETH',
      type: ProtocolType.STAKING,
      category: TransactionCategory.STAKING,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['liquid-staking', 'ankr', 'aeth']
    },

    // Yield Farming
    '0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804': {
      name: 'Yearn Registry',
      type: ProtocolType.YIELD_FARMING,
      category: TransactionCategory.DEFI_LIQUIDITY,
      sophistication: SophisticationLevel.EXPERT,
      tags: ['yield-farming', 'yearn', 'vault', 'strategy']
    },

    // NFT Marketplaces
    '0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b': {
      name: 'OpenSea',
      type: ProtocolType.NFT_MARKETPLACE,
      category: TransactionCategory.NFT_TRADE,
      sophistication: SophisticationLevel.BASIC,
      tags: ['nft', 'marketplace', 'opensea']
    },
    '0x7f268357A8c2552623316e2562D90e642bB538E5': {
      name: 'OpenSea Registry',
      type: ProtocolType.NFT_MARKETPLACE,
      category: TransactionCategory.NFT_TRADE,
      sophistication: SophisticationLevel.BASIC,
      tags: ['nft', 'marketplace', 'opensea', 'registry']
    },

    // Bridges
    '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640': {
      name: 'Arbitrum Bridge',
      type: ProtocolType.BRIDGE,
      category: TransactionCategory.BRIDGE,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['bridge', 'arbitrum', 'layer2']
    },
    '0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f': {
      name: 'Arbitrum Inbox',
      type: ProtocolType.BRIDGE,
      category: TransactionCategory.BRIDGE,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['bridge', 'arbitrum', 'layer2', 'inbox']
    },
    '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a': {
      name: 'Arbitrum Bridge',
      type: ProtocolType.BRIDGE,
      category: TransactionCategory.BRIDGE,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['bridge', 'arbitrum', 'layer2']
    },
    '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1': {
      name: 'Optimism Gateway',
      type: ProtocolType.BRIDGE,
      category: TransactionCategory.BRIDGE,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['bridge', 'optimism', 'layer2']
    },
    '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65': {
      name: 'Polygon Bridge',
      type: ProtocolType.BRIDGE,
      category: TransactionCategory.BRIDGE,
      sophistication: SophisticationLevel.INTERMEDIATE,
      tags: ['bridge', 'polygon', 'sidechain']
    }
  };

  /**
   * Get protocol information by address
   */
  public static getProtocolInfo(address: string): {
    name: string;
    type: ProtocolType;
    category: TransactionCategory;
    sophistication: SophisticationLevel;
    tags: string[];
  } | null {
    const normalizedAddress = address.toLowerCase();
    
    for (const [protocolAddress, info] of Object.entries(this.PROTOCOLS)) {
      if (protocolAddress.toLowerCase() === normalizedAddress) {
        return info;
      }
    }
    
    return null;
  }

  /**
   * Search protocols by name or tag
   */
  public static searchProtocols(query: string): Array<{
    address: string;
    name: string;
    type: ProtocolType;
    category: TransactionCategory;
    sophistication: SophisticationLevel;
    tags: string[];
  }> {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [address, info] of Object.entries(this.PROTOCOLS)) {
      if (
        info.name.toLowerCase().includes(lowerQuery) ||
        info.tags.some(tag => tag.includes(lowerQuery))
      ) {
        results.push({ address, ...info });
      }
    }
    
    return results;
  }

  /**
   * Get all protocols by type
   */
  public static getProtocolsByType(type: ProtocolType): Array<{
    address: string;
    name: string;
    category: TransactionCategory;
    sophistication: SophisticationLevel;
    tags: string[];
  }> {
    const results = [];
    
    for (const [address, info] of Object.entries(this.PROTOCOLS)) {
      if (info.type === type) {
        results.push({ address, ...info });
      }
    }
    
    return results;
  }
}

/**
 * Advanced Transaction Categorizer
 * Provides comprehensive transaction categorization with confidence scoring
 */
export class TransactionCategorizer {
  
  /**
   * Categorize a transaction with confidence scoring
   */
  public static categorizeTransaction(transaction: TransactionData): CategoryResult {
    let confidence = 0;
    let primary = TransactionCategory.UNKNOWN;
    let subcategory = 'Unknown Transaction';
    let protocolName: string | undefined;
    let protocolType: ProtocolType | undefined;
    let sophisticationLevel = SophisticationLevel.BASIC;
    let tags: string[] = [];

    // Check if it's a known protocol interaction
    if (transaction.to) {
      const protocolInfo = ProtocolDatabase.getProtocolInfo(transaction.to);
      
      if (protocolInfo) {
        primary = protocolInfo.category;
        subcategory = protocolInfo.name;
        protocolName = protocolInfo.name;
        protocolType = protocolInfo.type;
        sophisticationLevel = protocolInfo.sophistication;
        tags = [...protocolInfo.tags];
        confidence = 95; // High confidence for known protocols
        
        return {
          primary,
          subcategory,
          confidence,
          protocolName,
          protocolType,
          sophisticationLevel,
          tags
        };
      }
    }

    // Fallback to existing transaction properties
    if (transaction.isStaking) {
      primary = TransactionCategory.STAKING;
      subcategory = transaction.protocolName || 'Unknown Staking Protocol';
      sophisticationLevel = SophisticationLevel.INTERMEDIATE;
      tags = ['staking'];
      confidence = 80;
    } else if (transaction.isDeFi) {
      primary = TransactionCategory.DEFI_SWAP;
      subcategory = transaction.protocolName || 'Unknown DeFi Protocol';
      sophisticationLevel = SophisticationLevel.INTERMEDIATE;
      tags = ['defi'];
      confidence = 75;
    } else {
      // Analyze transaction characteristics
      const value = parseFloat(transaction.value);
      const gasUsed = parseInt(transaction.gasUsed || '0');
      
      if (value === 0 && gasUsed > 21000) {
        primary = TransactionCategory.CONTRACT_INTERACTION;
        subcategory = 'Contract Interaction';
        sophisticationLevel = gasUsed > 200000 ? SophisticationLevel.ADVANCED : SophisticationLevel.INTERMEDIATE;
        tags = ['contract'];
        confidence = 60;
      } else if (value > 0 && gasUsed <= 21000) {
        primary = TransactionCategory.TRANSFER;
        subcategory = value > 1 ? 'Large Transfer' : 'Standard Transfer';
        sophisticationLevel = SophisticationLevel.BASIC;
        tags = ['transfer'];
        confidence = 90;
      } else if (value > 0 && gasUsed > 21000) {
        primary = TransactionCategory.CONTRACT_INTERACTION;
        subcategory = 'Contract Interaction with Value';
        sophisticationLevel = SophisticationLevel.INTERMEDIATE;
        tags = ['contract', 'value-transfer'];
        confidence = 70;
      } else {
        primary = TransactionCategory.UNKNOWN;
        subcategory = 'Unknown Transaction Type';
        sophisticationLevel = SophisticationLevel.BASIC;
        tags = ['unknown'];
        confidence = 20;
      }
    }

    return {
      primary,
      subcategory,
      confidence,
      protocolName,
      protocolType,
      sophisticationLevel,
      tags
    };
  }

  /**
   * Batch categorize multiple transactions
   */
  public static categorizeTransactions(transactions: TransactionData[]): CategoryResult[] {
    return transactions.map(tx => this.categorizeTransaction(tx));
  }

  /**
   * Get category statistics for a set of transactions
   */
  public static getCategoryStatistics(transactions: TransactionData[]): {
    totalTransactions: number;
    categoryBreakdown: { [key in TransactionCategory]: number };
    protocolTypeBreakdown: { [key in ProtocolType]: number };
    sophisticationBreakdown: { [key in SophisticationLevel]: number };
    averageConfidence: number;
    topProtocols: Array<{ name: string; count: number }>;
    topTags: Array<{ tag: string; count: number }>;
  } {
    const categorized = this.categorizeTransactions(transactions);
    
    const categoryBreakdown = {} as { [key in TransactionCategory]: number };
    const protocolTypeBreakdown = {} as { [key in ProtocolType]: number };
    const sophisticationBreakdown = {} as { [key in SophisticationLevel]: number };
    const protocolCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    
    // Initialize counters
    Object.values(TransactionCategory).forEach(cat => categoryBreakdown[cat] = 0);
    Object.values(ProtocolType).forEach(type => protocolTypeBreakdown[type] = 0);
    Object.values(SophisticationLevel).forEach(level => sophisticationBreakdown[level] = 0);
    
    let totalConfidence = 0;
    
    for (const result of categorized) {
      categoryBreakdown[result.primary]++;
      sophisticationBreakdown[result.sophisticationLevel]++;
      totalConfidence += result.confidence;
      
      if (result.protocolType) {
        protocolTypeBreakdown[result.protocolType]++;
      }
      
      if (result.protocolName) {
        protocolCounts.set(result.protocolName, (protocolCounts.get(result.protocolName) || 0) + 1);
      }
      
      for (const tag of result.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    
    const topProtocols = Array.from(protocolCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalTransactions: transactions.length,
      categoryBreakdown,
      protocolTypeBreakdown,
      sophisticationBreakdown,
      averageConfidence: totalConfidence / categorized.length,
      topProtocols,
      topTags
    };
  }

  /**
   * Detect transaction patterns based on categorization
   */
  public static detectTransactionPatterns(transactions: TransactionData[]): {
    isDiversified: boolean;
    dominantCategory: TransactionCategory;
    dominantProtocolType?: ProtocolType;
    sophisticationTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    riskProfile: 'LOW' | 'MEDIUM' | 'HIGH';
    patterns: string[];
  } {
    const categorized = this.categorizeTransactions(transactions);
    const stats = this.getCategoryStatistics(transactions);
    
    // Determine if portfolio is diversified
    const categoryCount = Object.values(stats.categoryBreakdown).filter(count => count > 0).length;
    const isDiversified = categoryCount >= 3;
    
    // Find dominant category
    const dominantCategory = Object.entries(stats.categoryBreakdown)
      .reduce((max, [category, count]) => count > max.count ? { category: category as TransactionCategory, count } : max, 
              { category: TransactionCategory.UNKNOWN, count: 0 }).category;
    
    // Find dominant protocol type
    const dominantProtocolType = Object.entries(stats.protocolTypeBreakdown)
      .reduce((max, [type, count]) => count > max.count ? { type: type as ProtocolType, count } : max, 
              { type: undefined as ProtocolType | undefined, count: 0 }).type;
    
    // Analyze sophistication trend
    const recentTxs = categorized.slice(-Math.min(10, categorized.length));
    const olderTxs = categorized.slice(0, Math.min(10, categorized.length));
    
    const sophisticationValues = { BASIC: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };
    
    const recentAvgSophistication = recentTxs.reduce((sum, tx) => sum + sophisticationValues[tx.sophisticationLevel], 0) / recentTxs.length;
    const olderAvgSophistication = olderTxs.reduce((sum, tx) => sum + sophisticationValues[tx.sophisticationLevel], 0) / olderTxs.length;
    
    let sophisticationTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    if (recentAvgSophistication > olderAvgSophistication * 1.2) {
      sophisticationTrend = 'INCREASING';
    } else if (recentAvgSophistication < olderAvgSophistication * 0.8) {
      sophisticationTrend = 'DECREASING';
    } else {
      sophisticationTrend = 'STABLE';
    }
    
    // Assess risk profile
    const expertTxRatio = stats.sophisticationBreakdown.EXPERT / transactions.length;
    const advancedTxRatio = stats.sophisticationBreakdown.ADVANCED / transactions.length;
    
    let riskProfile: 'LOW' | 'MEDIUM' | 'HIGH';
    if (expertTxRatio > 0.3 || advancedTxRatio > 0.5) {
      riskProfile = 'HIGH';
    } else if (advancedTxRatio > 0.2 || expertTxRatio > 0.1) {
      riskProfile = 'MEDIUM';
    } else {
      riskProfile = 'LOW';
    }
    
    // Identify patterns
    const patterns: string[] = [];
    
    if (stats.protocolTypeBreakdown.DEX > transactions.length * 0.5) {
      patterns.push('Heavy DEX trader');
    }
    
    if (stats.protocolTypeBreakdown.LENDING > transactions.length * 0.3) {
      patterns.push('Active DeFi lender');
    }
    
    if (stats.protocolTypeBreakdown.STAKING > transactions.length * 0.2) {
      patterns.push('Staking enthusiast');
    }
    
    if (stats.sophisticationBreakdown.EXPERT > transactions.length * 0.2) {
      patterns.push('Advanced DeFi user');
    }
    
    if (isDiversified) {
      patterns.push('Diversified protocol user');
    }
    
    return {
      isDiversified,
      dominantCategory,
      dominantProtocolType,
      sophisticationTrend,
      riskProfile,
      patterns
    };
  }
}

export default TransactionCategorizer;