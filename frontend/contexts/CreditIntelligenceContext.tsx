import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ScoreDimension {
  score: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  dataPoints: number;
  lastCalculated: number;
  recommendations: string[];
}

interface SocialCreditData {
  overallRating: number;
  totalTransactions: number;
  successRate: number;
  communityRank: number;
  referrals: number;
  trustScore: number;
  p2pLendingHistory: any[];
  communityFeedback: any[];
  disputeHistory: any[];
}

interface RiskPrediction {
  risk30d: number;
  risk90d: number;
  risk180d: number;
  confidence: number;
  insights: string[];
  marketVolatilityAdjustment: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward: string;
  unlockedAt?: number;
}

interface CreditProfile {
  address: string;
  linkedWallets: string[];
  overallScore: number;
  tier: string;
  dimensions: {
    defiReliability: ScoreDimension;
    tradingConsistency: ScoreDimension;
    stakingCommitment: ScoreDimension;
    governanceParticipation: ScoreDimension;
    liquidityProvider: ScoreDimension;
  };
  socialCredit: SocialCreditData;
  predictions: RiskPrediction;
  achievements: Achievement[];
  lastUpdated: number;
}

interface AnalyticsData {
  scoreHistory: any[];
  behaviorTrends: any[];
  peerComparison: any;
  transactionMetrics: any;
}

interface ZKProof {
  id: string;
  type: 'threshold' | 'selective' | 'full';
  status: 'generating' | 'ready' | 'verified' | 'expired';
  threshold?: number;
  dimensions?: string[];
  proof: string;
  timestamp: number;
  expiresAt: number;
}

interface BlockchainConnectionState {
  isConnected: boolean;
  currentProvider: string | null;
  lastBlockNumber: number;
  connectionTime: number;
  reconnectAttempts: number;
  providerHealth: Array<{
    name: string;
    isHealthy: boolean;
    priority: number;
    latency?: number;
  }>;
}

interface CreditIntelligenceContextType {
  // State
  profile: CreditProfile | null;
  analytics: AnalyticsData | null;
  achievements: Achievement[];
  activeProofs: ZKProof[];
  loading: boolean;
  error: string | null;
  
  // User preferences
  privacyMode: boolean;
  connectedAddress: string | null;
  
  // Blockchain connection state
  blockchainConnection: BlockchainConnectionState;
  
  // Actions
  connectWallet: (address: string) => Promise<void>;
  disconnectWallet: () => void;
  analyzeAddress: (address: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAnalytics: (timeframe?: string) => Promise<void>;
  refreshAchievements: () => Promise<void>;
  refreshProofs: () => Promise<void>;
  setPrivacyMode: (enabled: boolean) => void;
  generateProof: (type: 'threshold' | 'selective' | 'full', options: any) => Promise<ZKProof | null>;
  claimAchievement: (achievementId: string) => Promise<boolean>;
  exportData: (options: any) => Promise<Blob | null>;
  refreshBlockchainConnection: () => Promise<void>;
}

const CreditIntelligenceContext = createContext<CreditIntelligenceContextType | undefined>(undefined);

interface CreditIntelligenceProviderProps {
  children: ReactNode;
}

export const CreditIntelligenceProvider: React.FC<CreditIntelligenceProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<CreditProfile | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeProofs, setActiveProofs] = useState<ZKProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyMode, setPrivacyModeState] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [blockchainConnection, setBlockchainConnection] = useState<BlockchainConnectionState>({
    isConnected: false,
    currentProvider: null,
    lastBlockNumber: 0,
    connectionTime: 0,
    reconnectAttempts: 0,
    providerHealth: []
  });

  // Mock data for demonstration - in real implementation, this would come from the service


  // Load blockchain connection status and set up real-time monitoring
  useEffect(() => {
    let unsubscribeStatus: (() => void) | undefined;

    const setupBlockchainMonitoring = async () => {
      try {
        // Import the service dynamically
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

        // Get initial blockchain status
        const status = await creditIntelligenceService.getBlockchainStatus();
        if (status) {
          setBlockchainConnection({
            isConnected: status.isConnected,
            currentProvider: status.currentProvider?.name || null,
            lastBlockNumber: status.lastBlockNumber,
            connectionTime: status.connectionTime,
            reconnectAttempts: status.reconnectAttempts,
            providerHealth: status.providerHealth || []
          });
        }

        // Subscribe to real-time blockchain status updates
        unsubscribeStatus = await creditIntelligenceService.subscribeToConnectionStatus((statusUpdate) => {
          setBlockchainConnection({
            isConnected: statusUpdate.isConnected,
            currentProvider: statusUpdate.currentProvider?.name || null,
            lastBlockNumber: statusUpdate.lastBlockNumber,
            connectionTime: statusUpdate.connectionTime,
            reconnectAttempts: statusUpdate.reconnectAttempts,
            providerHealth: statusUpdate.providerHealth || []
          });
        });

      } catch (error) {
        console.error('Failed to set up blockchain monitoring:', error);
        // Set default disconnected state
        setBlockchainConnection({
          isConnected: false,
          currentProvider: null,
          lastBlockNumber: 0,
          connectionTime: 0,
          reconnectAttempts: 0,
          providerHealth: []
        });
      }
    };

    setupBlockchainMonitoring();

    return () => {
      if (unsubscribeStatus) unsubscribeStatus();
    };
  }, []);

  // Load data from API when address is connected
  useEffect(() => {
    if (connectedAddress) {
      loadProfileData(connectedAddress);
    } else {
      setProfile(null);
      setAnalytics(null);
      setAchievements([]);
      setActiveProofs([]);
    }
  }, [connectedAddress]);

  // Add method to analyze any address without connecting wallet
  const analyzeAddress = async (address: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Import the service dynamically
      const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

      // Load profile with real transaction data for any address
      const profileData = await creditIntelligenceService.getCreditProfile(address);
      if (profileData) {
        setProfile(profileData);
        setAchievements(profileData.achievements || []);
      }

      // Load analytics with real blockchain metrics
      const analyticsData = await creditIntelligenceService.getAnalytics(address, '30d');
      if (analyticsData) {
        setAnalytics(analyticsData);
      }

    } catch (error) {
      console.error('Error analyzing address:', error);
      setError('Failed to analyze address');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileData = async (address: string) => {
    setLoading(true);
    try {
      // Import the service dynamically
      const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

      // Load profile with real transaction data
      const profileData = await creditIntelligenceService.getCreditProfile(address);
      if (profileData) {
        setProfile(profileData);
        setAchievements(profileData.achievements || []);
      }

      // Load analytics with real blockchain metrics
      const analyticsData = await creditIntelligenceService.getAnalytics(address, '30d');
      if (analyticsData) {
        setAnalytics(analyticsData);
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async (address: string) => {
    setLoading(true);
    setError(null);
    
    try {
      setConnectedAddress(address);
      // In real implementation, fetch actual data from the service
      // const profile = await creditIntelligenceService.getCreditProfile(address);
      // setProfile(profile);
    } catch (err) {
      setError('Failed to connect wallet and load profile');
      console.error('Wallet connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedAddress(null);
    setProfile(null);
    setAnalytics(null);
    setAchievements([]);
    setActiveProofs([]);
    setError(null);
  };

  const refreshProfile = async () => {
    if (!connectedAddress) return;
    
    setLoading(true);
    try {
      // Import the service dynamically
      const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

      // Refresh profile with real transaction data
      const profileData = await creditIntelligenceService.getCreditProfile(connectedAddress);
      if (profileData) {
        setProfile(profileData);
        setAchievements(profileData.achievements || []);
      } else {
        setError('Failed to refresh profile');
      }
    } catch (err) {
      setError('Failed to refresh profile');
      console.error('Profile refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async (timeframe: string = '30d') => {
    if (!connectedAddress) return;
    
    setLoading(true);
    try {
      // Import the service dynamically
      const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

      // Refresh analytics with real blockchain metrics
      const analyticsData = await creditIntelligenceService.getAnalytics(connectedAddress, timeframe);
      if (analyticsData) {
        setAnalytics(analyticsData);
      } else {
        setError('Failed to refresh analytics');
      }
    } catch (err) {
      setError('Failed to refresh analytics');
      console.error('Analytics refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAchievements = async () => {
    if (!connectedAddress) return;
    
    try {
      // In real implementation:
      // const achievements = await creditIntelligenceService.getAchievements(connectedAddress);
      // setAchievements(achievements);
      
      // For now, just refresh the mock data
      setAchievements(mockAchievements);
    } catch (err) {
      setError('Failed to refresh achievements');
      console.error('Achievements refresh error:', err);
    }
  };

  const refreshProofs = async () => {
    if (!connectedAddress) return;
    
    try {
      // In real implementation:
      // const proofs = await creditIntelligenceService.getActiveProofs(connectedAddress);
      // setActiveProofs(proofs);
      
      // For now, use empty array
      setActiveProofs([]);
    } catch (err) {
      setError('Failed to refresh proofs');
      console.error('Proofs refresh error:', err);
    }
  };

  const setPrivacyMode = (enabled: boolean) => {
    setPrivacyModeState(enabled);
    // In real implementation, this might also update server-side preferences
  };

  const generateProof = async (type: 'threshold' | 'selective' | 'full', options: any): Promise<ZKProof | null> => {
    if (!connectedAddress) return null;
    
    setLoading(true);
    try {
      // In real implementation:
      // const proof = await creditIntelligenceService.generateZKProof(connectedAddress, type, options);
      
      // For now, create a mock proof
      const mockProof: ZKProof = {
        id: Date.now().toString(),
        type,
        status: 'ready',
        threshold: type === 'threshold' ? options.threshold : undefined,
        dimensions: type === 'selective' ? options.dimensions : undefined,
        proof: `zk${Math.random().toString(36).substring(2)}${Date.now()}`,
        timestamp: Date.now(),
        expiresAt: Date.now() + 86400000 // 24 hours
      };
      
      setActiveProofs(prev => [mockProof, ...prev]);
      return mockProof;
    } catch (err) {
      setError('Failed to generate proof');
      console.error('Proof generation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const claimAchievement = async (achievementId: string): Promise<boolean> => {
    if (!connectedAddress) return false;
    
    try {
      // In real implementation:
      // const success = await creditIntelligenceService.claimAchievement(connectedAddress, achievementId);
      
      // For now, just mark as unlocked
      setAchievements(prev => 
        prev.map(achievement => 
          achievement.id === achievementId 
            ? { ...achievement, unlocked: true, unlockedAt: Date.now() }
            : achievement
        )
      );
      return true;
    } catch (err) {
      setError('Failed to claim achievement');
      console.error('Achievement claim error:', err);
      return false;
    }
  };

  const exportData = async (options: any): Promise<Blob | null> => {
    if (!connectedAddress) return null;
    
    try {
      // In real implementation:
      // return await creditIntelligenceService.exportAnalytics(connectedAddress, options);
      
      // For now, create a mock export
      const exportData = {
        profile: privacyMode ? null : profile,
        analytics: privacyMode ? null : analytics,
        achievements,
        timestamp: new Date().toISOString(),
        privacyMode
      };
      
      return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    } catch (err) {
      setError('Failed to export data');
      console.error('Data export error:', err);
      return null;
    }
  };

  const refreshBlockchainConnection = async () => {
    try {
      // Import the service dynamically
      const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

      // Refresh blockchain connection status with real data
      const status = await creditIntelligenceService.getBlockchainStatus();
      if (status) {
        setBlockchainConnection({
          isConnected: status.isConnected,
          currentProvider: status.currentProvider?.name || null,
          lastBlockNumber: status.lastBlockNumber,
          connectionTime: status.connectionTime,
          reconnectAttempts: status.reconnectAttempts,
          providerHealth: status.providerHealth || []
        });
      } else {
        setError('Failed to refresh blockchain connection status');
      }
    } catch (err) {
      setError('Failed to refresh blockchain connection status');
      console.error('Blockchain connection refresh error:', err);
    }
  };

  const value: CreditIntelligenceContextType = {
    // State
    profile,
    analytics,
    achievements,
    activeProofs,
    loading,
    error,
    
    // User preferences
    privacyMode,
    connectedAddress,
    
    // Blockchain connection state
    blockchainConnection,
    
    // Actions
    connectWallet,
    disconnectWallet,
    analyzeAddress,
    refreshProfile,
    refreshAnalytics,
    refreshAchievements,
    refreshProofs,
    setPrivacyMode,
    generateProof,
    claimAchievement,
    exportData,
    refreshBlockchainConnection
  };

  return (
    <CreditIntelligenceContext.Provider value={value}>
      {children}
    </CreditIntelligenceContext.Provider>
  );
};

export const useCreditIntelligence = (): CreditIntelligenceContextType => {
  const context = useContext(CreditIntelligenceContext);
  if (context === undefined) {
    throw new Error('useCreditIntelligence must be used within a CreditIntelligenceProvider');
  }
  return context;
};

export default CreditIntelligenceContext;