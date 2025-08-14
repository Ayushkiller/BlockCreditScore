import React from 'react'
import CompetitivePositioningDashboard from './components/CompetitivePositioningDashboard'
import { CreditScore, BenchmarkingData } from './services/apiService'

// Mock data for testing the competitive positioning dashboard
const mockScore: CreditScore = {
  address: '0x1234567890123456789012345678901234567890',
  score: 750,
  confidence: 85,
  timestamp: Date.now(),
  version: '2.0',
  breakdown: {
    transactionVolume: {
      score: 200,
      weight: 0.3,
      weightedScore: 60,
      confidence: 90,
      explanation: 'Strong transaction volume with consistent activity',
      strengths: ['High volume transactions', 'Consistent activity'],
      weaknesses: [],
      improvementPotential: 50,
      insights: {
        trend: 'INCREASING' as const,
        averageVolume: '5.2 ETH',
        peakVolume: '12.8 ETH',
        consistency: 85
      }
    },
    transactionFrequency: {
      score: 180,
      weight: 0.25,
      weightedScore: 45,
      confidence: 88,
      explanation: 'Regular transaction frequency showing active usage',
      strengths: ['Regular activity pattern'],
      weaknesses: ['Could increase frequency'],
      improvementPotential: 30,
      insights: {
        pattern: 'REGULAR' as const,
        averageInterval: 3.2,
        consistency: 82
      }
    },
    stakingActivity: {
      score: 220,
      weight: 0.25,
      weightedScore: 55,
      confidence: 92,
      explanation: 'Excellent staking activity across multiple protocols',
      strengths: ['Multi-protocol staking', 'Long-term commitment'],
      weaknesses: [],
      improvementPotential: 20,
      insights: {
        totalStaked: '25.5 ETH',
        stakingDuration: 180,
        protocols: ['Ethereum 2.0', 'Lido', 'Rocket Pool'],
        yield: 4.2
      }
    },
    defiInteractions: {
      score: 190,
      weight: 0.2,
      weightedScore: 38,
      confidence: 80,
      explanation: 'Good DeFi engagement with room for diversification',
      strengths: ['Active DeFi usage'],
      weaknesses: ['Limited protocol diversity'],
      improvementPotential: 40,
      insights: {
        protocolCount: 5,
        sophisticationLevel: 'INTERMEDIATE' as const,
        favoriteProtocols: ['Uniswap', 'Compound', 'Aave'],
        riskLevel: 'MEDIUM' as const
      }
    },
    gasEfficiency: {
      score: 160,
      weight: 0.1,
      weightedScore: 16,
      confidence: 75,
      explanation: 'Average gas efficiency with optimization opportunities',
      strengths: ['Basic optimization'],
      weaknesses: ['Could improve timing', 'Limited batching'],
      improvementPotential: 60,
      insights: {
        gasOptimization: 65,
        timingScore: 70,
        batchingUsage: 40
      }
    },
    consistencyScore: {
      score: 185,
      weight: 0.05,
      weightedScore: 9.25,
      confidence: 88,
      explanation: 'High consistency in behavioral patterns',
      strengths: ['Consistent behavior', 'Predictable patterns'],
      weaknesses: [],
      improvementPotential: 15,
      insights: {
        behavioralConsistency: 88,
        timingConsistency: 85,
        volumeConsistency: 82
      }
    },
    diversificationScore: {
      score: 170,
      weight: 0.05,
      weightedScore: 8.5,
      confidence: 80,
      explanation: 'Good diversification with room for improvement',
      strengths: ['Multiple protocols'],
      weaknesses: ['Concentration in specific areas'],
      improvementPotential: 30,
      insights: {
        protocolDiversity: 75,
        transactionTypeDiversity: 80,
        concentrationRisk: 25
      }
    },
    riskAdjustment: {
      score: -10,
      weight: 0.05,
      weightedScore: -0.5,
      confidence: 85,
      explanation: 'Low risk adjustment due to good risk management',
      strengths: ['Low risk profile'],
      weaknesses: [],
      improvementPotential: 5,
      insights: {
        riskFactors: ['Minor concentration risk'],
        mitigationSuggestions: ['Diversify further'],
        confidenceLevel: 85
      }
    }
  }
}

const mockBenchmarkingData: BenchmarkingData = {
  address: '0x1234567890123456789012345678901234567890',
  peerGroupClassification: {
    primaryPeerGroup: {
      name: 'Active DeFi Users',
      description: 'Users with regular DeFi activity and moderate portfolio size',
      memberCount: 2500,
      averageScore: 680,
      scoreRange: {
        min: 400,
        max: 950,
        percentiles: {
          p25: 580,
          p50: 680,
          p75: 780,
          p90: 850
        }
      }
    },
    secondaryPeerGroups: [],
    classificationFactors: ['DeFi activity level', 'Portfolio size', 'Transaction frequency'],
    confidence: 92
  },
  percentileRankings: {
    overallScore: {
      percentile: 78,
      rank: 550,
      totalInGroup: 2500,
      category: 'GOOD',
      explanation: 'Your overall score ranks 550 out of 2500 users in your peer group (78th percentile). This is considered good performance.',
      improvementPotential: 50
    },
    componentScores: {
      transactionVolume: {
        percentile: 82,
        rank: 450,
        totalInGroup: 2500,
        category: 'GOOD',
        explanation: 'Strong transaction volume performance',
        improvementPotential: 30
      },
      transactionFrequency: {
        percentile: 75,
        rank: 625,
        totalInGroup: 2500,
        category: 'GOOD',
        explanation: 'Good transaction frequency',
        improvementPotential: 40
      },
      stakingActivity: {
        percentile: 88,
        rank: 300,
        totalInGroup: 2500,
        category: 'EXCELLENT',
        explanation: 'Excellent staking activity',
        improvementPotential: 20
      },
      defiInteractions: {
        percentile: 70,
        rank: 750,
        totalInGroup: 2500,
        category: 'GOOD',
        explanation: 'Good DeFi interactions',
        improvementPotential: 50
      }
    },
    behavioralMetrics: {
      consistencyScore: {
        percentile: 85,
        rank: 375,
        totalInGroup: 2500,
        category: 'EXCELLENT',
        explanation: 'Excellent consistency',
        improvementPotential: 15
      },
      diversificationScore: {
        percentile: 68,
        rank: 800,
        totalInGroup: 2500,
        category: 'AVERAGE',
        explanation: 'Average diversification',
        improvementPotential: 40
      },
      gasEfficiency: {
        percentile: 60,
        rank: 1000,
        totalInGroup: 2500,
        category: 'AVERAGE',
        explanation: 'Average gas efficiency',
        improvementPotential: 60
      },
      riskScore: {
        percentile: 80,
        rank: 500,
        totalInGroup: 2500,
        category: 'GOOD',
        explanation: 'Good risk management',
        improvementPotential: 25
      }
    }
  },
  comparativeAnalysis: {
    vsGroupAverage: {
      scoreDifference: 70,
      percentageDifference: 10.3,
      betterThan: 78,
      explanation: 'You score 70 points above the average for Active DeFi Users, performing better than 78% of your peers.'
    },
    vsTopPerformers: {
      scoreDifference: 100,
      gapToTop10: 100,
      gapToTop25: 30,
      explanation: 'You need 30 points to reach the top 25% and 100 points to reach the top 10% of performers.'
    },
    strengthsVsPeers: [
      {
        component: 'Staking Activity',
        userScore: 220,
        peerAverage: 170,
        percentileDifference: 29,
        significance: 'HIGH',
        explanation: 'Your Staking Activity score of 220 is 29.4% above the peer average of 170.'
      }
    ],
    weaknessesVsPeers: [
      {
        component: 'Gas Efficiency',
        userScore: 160,
        peerAverage: 180,
        percentileDifference: -11,
        significance: 'MEDIUM',
        explanation: 'Your Gas Efficiency score of 160 is 11.1% below the peer average of 180.'
      }
    ],
    opportunityAreas: [
      {
        area: 'Gas Efficiency',
        currentPercentile: 60,
        potentialPercentile: 80,
        impactOnOverallScore: 40,
        difficulty: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        actionItems: [
          'Optimize transaction timing for lower gas prices',
          'Use gas-efficient protocols and batch transactions',
          'Monitor gas prices and use gas optimization tools'
        ]
      },
      {
        area: 'DeFi Diversification',
        currentPercentile: 70,
        potentialPercentile: 85,
        impactOnOverallScore: 30,
        difficulty: 'EASY',
        timeframe: 'SHORT_TERM',
        actionItems: [
          'Explore new DeFi protocols in different categories',
          'Diversify across lending, DEX, and yield farming',
          'Start with established protocols to minimize risk'
        ]
      }
    ]
  },
  benchmarkCategories: [
    {
      name: 'High Achiever',
      description: 'Top 25% of users with strong performance across most metrics',
      userQualifies: true,
      requirements: [
        'Overall score above 75th percentile',
        'At least 3 component scores above 60th percentile',
        'Account age > 90 days'
      ],
      benefits: [
        'Enhanced credit limits',
        'Reduced fees',
        'Advanced features access',
        'Personalized recommendations'
      ],
      percentageOfUsers: 25
    }
  ],
  relativePerformance: {
    overallRating: 'ABOVE_AVERAGE',
    keyStrengths: ['Staking Activity', 'Consistency Score'],
    keyWeaknesses: ['Gas Efficiency'],
    competitiveAdvantages: [
      'Strong staking activity shows long-term commitment and stability',
      'Exceptional consistency in behavior patterns'
    ],
    improvementPriorities: ['Gas Efficiency', 'DeFi Diversification'],
    marketPosition: 'Strong market position - well above average performance'
  }
}

// Test component
export default function TestCompetitivePositioning() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Competitive Positioning Dashboard Test</h1>
          <p className="text-gray-600 mt-2">Testing the competitive positioning dashboard component with mock data</p>
        </div>
        
        <CompetitivePositioningDashboard 
          score={mockScore}
          benchmarkingData={mockBenchmarkingData}
        />
      </div>
    </div>
  )
}