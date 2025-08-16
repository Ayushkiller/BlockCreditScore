// Enhanced interfaces matching the design document
interface ComponentScore {
  score: number
  weight: number
  weightedScore: number
  confidence: number
  explanation: string
  strengths: string[]
  weaknesses: string[]
  improvementPotential: number
}

interface VolumeInsights {
  trend: 'INCREASING' | 'STABLE' | 'DECREASING'
  averageVolume: string
  peakVolume: string
  consistency: number
}

interface FrequencyInsights {
  pattern: 'REGULAR' | 'SPORADIC' | 'INACTIVE'
  averageInterval: number
  consistency: number
}

interface StakingInsights {
  totalStaked: string
  stakingDuration: number
  protocols: string[]
  yield: number
}

interface DefiInsights {
  protocolCount: number
  sophisticationLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  favoriteProtocols: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface EfficiencyInsights {
  gasOptimization: number
  timingScore: number
  batchingUsage: number
}

interface ConsistencyInsights {
  behavioralConsistency: number
  timingConsistency: number
  volumeConsistency: number
}

interface DiversificationInsights {
  protocolDiversity: number
  transactionTypeDiversity: number
  concentrationRisk: number
}

interface RiskInsights {
  riskFactors: string[]
  mitigationSuggestions: string[]
  confidenceLevel: number
}

interface EnhancedScoreBreakdown {
  transactionVolume: ComponentScore & { insights: VolumeInsights }
  transactionFrequency: ComponentScore & { insights: FrequencyInsights }
  stakingActivity: ComponentScore & { insights: StakingInsights }
  defiInteractions: ComponentScore & { insights: DefiInsights }
  gasEfficiency: ComponentScore & { insights: EfficiencyInsights }
  consistencyScore: ComponentScore & { insights: ConsistencyInsights }
  diversificationScore: ComponentScore & { insights: DiversificationInsights }
  riskAdjustment: ComponentScore & { insights: RiskInsights }
}

interface RiskFactor {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  score: number
  confidence: number
  explanation: string
  indicators: string[]
  mitigationSuggestions: string[]
}

interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskScore: number
  confidence: number
  riskFactors: {
    concentrationRisk: RiskFactor
    volatilityRisk: RiskFactor
    inactivityRisk: RiskFactor
    newAccountRisk: RiskFactor
    anomalyRisk: RiskFactor
    liquidityRisk: RiskFactor
  }
  flags: {
    suspiciousActivity: boolean
    washTrading: boolean
    botBehavior: boolean
    coordinatedActivity: boolean
    unusualPatterns: boolean
  }
  recommendations?: RiskMitigationRecommendation[]
}

interface RiskMitigationRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  category: 'DIVERSIFICATION' | 'ACTIVITY' | 'SECURITY' | 'BEHAVIORAL'
  title: string
  description: string
  actionItems: string[]
  expectedImpact: string
  timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM'
}

interface ActionItem {
  description: string
  type: 'TRANSACTION' | 'STAKING' | 'DEFI' | 'OPTIMIZATION'
  specificGuidance: string
  estimatedCost?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface PersonalizedRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  category: 'VOLUME' | 'FREQUENCY' | 'STAKING' | 'DEFI' | 'RISK' | 'EFFICIENCY'
  title: string
  description: string
  expectedScoreImpact: number
  implementationDifficulty: 'EASY' | 'MEDIUM' | 'HARD'
  timeToImpact: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM'
  actionItems: ActionItem[]
  successMetrics: string[]
  trackingEnabled: boolean
  currentProgress?: number
}

interface BehavioralInsights {
  activityPattern: 'REGULAR' | 'SPORADIC' | 'INACTIVE' | 'HYPERACTIVE'
  consistencyScore: number
  userArchetype?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'SPECULATIVE'
  sophisticationLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  growthTrend: 'IMPROVING' | 'STABLE' | 'DECLINING'
  diversificationLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  gasEfficiency: number
  preferredProtocols: string[]
}

// Enhanced Benchmarking Data interfaces matching backend
interface PercentileRanking {
  percentile: number // 0-100
  rank: number // Actual rank within peer group
  totalInGroup: number
  category: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR'
  explanation: string
  improvementPotential: number // Points to next category
}

interface PercentileRankings {
  overallScore: PercentileRanking
  componentScores: {
    transactionVolume: PercentileRanking
    transactionFrequency: PercentileRanking
    stakingActivity: PercentileRanking
    defiInteractions: PercentileRanking
  }
  behavioralMetrics: {
    consistencyScore: PercentileRanking
    diversificationScore: PercentileRanking
    gasEfficiency: PercentileRanking
    riskScore: PercentileRanking
  }
}

interface ComponentComparison {
  component: string
  userScore: number
  peerAverage: number
  percentileDifference: number
  significance: 'HIGH' | 'MEDIUM' | 'LOW'
  explanation: string
}

interface OpportunityArea {
  area: string
  currentPercentile: number
  potentialPercentile: number
  impactOnOverallScore: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'
  actionItems: string[]
}

interface ComparativeAnalysis {
  vsGroupAverage: {
    scoreDifference: number
    percentageDifference: number
    betterThan: number // Percentage of peer group
    explanation: string
  }
  vsTopPerformers: {
    scoreDifference: number
    gapToTop10: number
    gapToTop25: number
    explanation: string
  }
  strengthsVsPeers: ComponentComparison[]
  weaknessesVsPeers: ComponentComparison[]
  opportunityAreas: OpportunityArea[]
}

interface BenchmarkCategory {
  name: string
  description: string
  userQualifies: boolean
  requirements: string[]
  benefits: string[]
  percentageOfUsers: number
}

interface RelativePerformance {
  overallRating: 'EXCEPTIONAL' | 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE' | 'NEEDS_IMPROVEMENT'
  keyStrengths: string[]
  keyWeaknesses: string[]
  competitiveAdvantages: string[]
  improvementPriorities: string[]
  marketPosition: string
}

interface PeerGroup {
  name: string
  description: string
  memberCount: number
  averageScore: number
  scoreRange: {
    min: number
    max: number
    percentiles: {
      p25: number
      p50: number
      p75: number
      p90: number
    }
  }
}

interface UserPeerGroupClassification {
  primaryPeerGroup: PeerGroup
  secondaryPeerGroups: PeerGroup[]
  classificationFactors: string[]
  confidence: number
}

interface BenchmarkingData {
  address: string
  peerGroupClassification: UserPeerGroupClassification
  percentileRankings: PercentileRankings
  comparativeAnalysis: ComparativeAnalysis
  benchmarkCategories: BenchmarkCategory[]
  relativePerformance: RelativePerformance
  competitivePositioning?: any // CompetitivePositioningData from backend
}

interface PredictiveInsights {
  scoreTrend: 'IMPROVING' | 'STABLE' | 'DECLINING'
  predictedScoreChange: number
  confidence: number
  keyFactors: string[]
  timeframe: string
}

// Actual backend response structure
interface BackendScoreBreakdown {
  transactionVolume: {
    score: number
    weight: number
    weightedScore: number
    details: {
      totalVolume: string
      volumeScore: number
      volumeCategory: string
      gasEfficiency: number
    }
    insights: {
      explanation: string
      strengths: string[]
      weaknesses: string[]
      improvementPotential: number
      benchmarkComparison: {
        percentile: number
        category: string
      }
    }
  }
  transactionFrequency: {
    score: number
    weight: number
    weightedScore: number
    details: {
      totalTransactions: number
      accountAge: number
      frequencyScore: number
      avgTransactionsPerMonth: number
      consistencyScore: number
    }
    insights: {
      explanation: string
      strengths: string[]
      weaknesses: string[]
      improvementPotential: number
      benchmarkComparison: {
        percentile: number
        category: string
      }
    }
  }
  stakingActivity: {
    score: number
    weight: number
    weightedScore: number
    details: {
      stakingBalance: string
      stakingScore: number
      stakingRatio: number
      stakingProtocols: string[]
      stakingDuration: number
    }
    insights: {
      explanation: string
      strengths: string[]
      weaknesses: string[]
      improvementPotential: number
      benchmarkComparison: {
        percentile: number
        category: string
      }
    }
  }
  defiInteractions: {
    score: number
    weight: number
    weightedScore: number
    details: {
      protocolsUsed: number
      defiScore: number
      diversificationScore: number
      favoriteProtocols: string[]
      sophisticationLevel: string
    }
    insights: {
      explanation: string
      strengths: string[]
      weaknesses: string[]
      improvementPotential: number
      benchmarkComparison: {
        percentile: number
        category: string
      }
    }
  }
}

interface CreditScore {
  address: string
  score: number
  confidence: number
  timestamp: number
  breakdown: BackendScoreBreakdown
  riskAssessment?: RiskAssessment
  behavioralInsights?: BehavioralInsights
  recommendations?: PersonalizedRecommendation[]
  benchmarking?: BenchmarkingData
  predictions?: PredictiveInsights
  cached?: boolean
}

interface ScoreHistoryEntry {
  score: number
  timestamp: number
  date: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface ScoreHistoryResponse {
  address: string
  total: number
  history: ScoreHistoryEntry[]
}

class ApiService {
  private baseUrl = '/api'

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Handle specific error codes with user-friendly messages
      if (errorData.error === 'INSUFFICIENT_DATA') {
        throw new Error('This address doesn\'t have enough transaction history for accurate credit scoring. Please try an address with more on-chain activity.')
      } else if (errorData.error === 'INVALID_ADDRESS') {
        throw new Error('Please enter a valid Ethereum address (42 characters starting with 0x)')
      } else if (errorData.error === 'RATE_LIMITED') {
        throw new Error('Too many requests. Please wait a moment before trying again.')
      } else if (errorData.error === 'BLOCKCHAIN_ERROR') {
        throw new Error('Unable to fetch blockchain data. Please try again in a few moments.')
      } else if (errorData.error === 'CALCULATION_ERROR') {
        throw new Error('Error calculating credit score. Please try again or contact support.')
      }
      
      throw new Error(errorData.message || `Network error (${response.status}). Please check your connection and try again.`)
    }

    const result: ApiResponse<T> = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Request failed. Please try again.')
    }

    if (!result.data) {
      throw new Error('No data received. Please try again.')
    }

    // Validate that we have the expected data structure
    if (typeof result.data === 'object' && result.data !== null) {
      const creditScore = result.data as any
      if (creditScore.score !== undefined && creditScore.breakdown !== undefined) {
        // Ensure breakdown has the expected structure
        if (!creditScore.breakdown || typeof creditScore.breakdown !== 'object') {
          throw new Error('Invalid data format received from server')
        }
      }
    }

    return result.data
  }

  async getCreditScore(address: string): Promise<CreditScore> {
    const response = await fetch(`${this.baseUrl}/score/${address}`)
    return this.handleResponse<CreditScore>(response)
  }

  async refreshCreditScore(address: string): Promise<CreditScore> {
    const response = await fetch(`${this.baseUrl}/score/${address}/refresh`, {
      method: 'POST'
    })
    return this.handleResponse<CreditScore>(response)
  }

  async getScoreHistory(address: string, limit?: number): Promise<ScoreHistoryResponse> {
    const url = limit 
      ? `${this.baseUrl}/score/${address}/history?limit=${limit}`
      : `${this.baseUrl}/score/${address}/history`
    
    const response = await fetch(url)
    return this.handleResponse<ScoreHistoryResponse>(response)
  }

  async getBatchScores(addresses: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/score/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ addresses })
    })
    return this.handleResponse<any>(response)
  }
}

export const apiService = new ApiService()
export type { 
  CreditScore, 
  ScoreHistoryEntry, 
  ScoreHistoryResponse,
  ComponentScore,
  EnhancedScoreBreakdown,
  RiskAssessment,
  RiskFactor,
  RiskMitigationRecommendation,
  PersonalizedRecommendation,
  BehavioralInsights,
  BenchmarkingData,
  PercentileRankings,
  PercentileRanking,
  ComparativeAnalysis,
  ComponentComparison,
  OpportunityArea,
  BenchmarkCategory,
  RelativePerformance,
  PeerGroup,
  UserPeerGroupClassification,
  PredictiveInsights,
  ActionItem
}