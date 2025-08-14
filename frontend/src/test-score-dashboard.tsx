// Simple test to verify ScoreDashboard component compiles correctly
import React from 'react'
import ScoreDashboard from './components/ScoreDashboard'

// Mock data matching the enhanced interface
const mockScore = {
  address: '0x1234567890123456789012345678901234567890',
  score: 750,
  confidence: 85,
  timestamp: Date.now() / 1000,
  version: '2.0',
  breakdown: {
    transactionVolume: {
      score: 200,
      weight: 0.3,
      weightedScore: 60,
      confidence: 90,
      explanation: 'Strong transaction volume with consistent activity',
      strengths: ['High volume transactions', 'Consistent activity'],
      weaknesses: ['Could increase frequency'],
      improvementPotential: 50,
      insights: {
        trend: 'INCREASING' as const,
        averageVolume: '1.5 ETH',
        peakVolume: '5.2 ETH',
        consistency: 85
      }
    },
    transactionFrequency: {
      score: 180,
      weight: 0.25,
      weightedScore: 45,
      confidence: 88,
      explanation: 'Good transaction frequency with regular patterns',
      strengths: ['Regular transaction patterns'],
      weaknesses: ['Some gaps in activity'],
      improvementPotential: 30,
      insights: {
        pattern: 'REGULAR' as const,
        averageInterval: 3,
        consistency: 80
      }
    },
    stakingActivity: {
      score: 150,
      weight: 0.25,
      weightedScore: 37.5,
      confidence: 75,
      explanation: 'Moderate staking activity',
      strengths: ['Participates in staking'],
      weaknesses: ['Could stake more consistently'],
      improvementPotential: 75,
      insights: {
        totalStaked: '2.5 ETH',
        stakingDuration: 180,
        protocols: ['Ethereum 2.0'],
        yield: 4.2
      }
    },
    defiInteractions: {
      score: 120,
      weight: 0.2,
      weightedScore: 24,
      confidence: 82,
      explanation: 'Basic DeFi interactions',
      strengths: ['Uses multiple protocols'],
      weaknesses: ['Limited to basic interactions'],
      improvementPotential: 60,
      insights: {
        protocolCount: 3,
        sophisticationLevel: 'INTERMEDIATE' as const,
        favoriteProtocols: ['Uniswap', 'Compound'],
        riskLevel: 'MEDIUM' as const
      }
    },
    gasEfficiency: {
      score: 140,
      weight: 0.1,
      weightedScore: 14,
      confidence: 78,
      explanation: 'Good gas optimization practices',
      strengths: ['Uses gas optimization'],
      weaknesses: ['Could batch more transactions'],
      improvementPotential: 40,
      insights: {
        gasOptimization: 75,
        timingScore: 80,
        batchingUsage: 60
      }
    },
    consistencyScore: {
      score: 160,
      weight: 0.15,
      weightedScore: 24,
      confidence: 85,
      explanation: 'Consistent behavioral patterns',
      strengths: ['Consistent timing', 'Stable patterns'],
      weaknesses: ['Minor volume fluctuations'],
      improvementPotential: 25,
      insights: {
        behavioralConsistency: 85,
        timingConsistency: 80,
        volumeConsistency: 75
      }
    },
    diversificationScore: {
      score: 130,
      weight: 0.1,
      weightedScore: 13,
      confidence: 80,
      explanation: 'Moderate diversification across protocols',
      strengths: ['Uses multiple protocols'],
      weaknesses: ['Concentrated in few areas'],
      improvementPotential: 45,
      insights: {
        protocolDiversity: 70,
        transactionTypeDiversity: 65,
        concentrationRisk: 35
      }
    },
    riskAdjustment: {
      score: -20,
      weight: 0.05,
      weightedScore: -1,
      confidence: 90,
      explanation: 'Minor risk adjustments applied',
      strengths: ['Low risk profile'],
      weaknesses: ['Some concentration risk'],
      improvementPotential: 10,
      insights: {
        riskFactors: ['Concentration risk'],
        mitigationSuggestions: ['Diversify across more protocols'],
        confidenceLevel: 90
      }
    }
  },
  recommendations: [
    {
      priority: 'HIGH' as const,
      category: 'STAKING' as const,
      title: 'Increase Staking Activity',
      description: 'Stake more ETH to improve your credit score',
      expectedScoreImpact: 50,
      implementationDifficulty: 'EASY' as const,
      timeToImpact: 'SHORT_TERM' as const,
      actionItems: [
        {
          description: 'Stake additional 1 ETH',
          type: 'STAKING' as const,
          specificGuidance: 'Use Ethereum 2.0 staking through a reputable validator',
          estimatedCost: '~$5 gas fees',
          riskLevel: 'LOW' as const
        }
      ],
      successMetrics: ['Increased staking balance', 'Improved consistency score'],
      trackingEnabled: true,
      currentProgress: 25
    }
  ],
  behavioralInsights: {
    activityPattern: 'REGULAR' as const,
    consistencyScore: 85,
    userArchetype: 'MODERATE' as const,
    sophisticationLevel: 'INTERMEDIATE' as const,
    growthTrend: 'IMPROVING' as const,
    diversificationLevel: 'MEDIUM' as const
  },
  benchmarking: {
    percentileRank: 75,
    peerGroupSize: 1000,
    peerGroupType: 'Similar Activity Level',
    comparisonAreas: {
      volume: { rank: 250, percentile: 75 },
      frequency: { rank: 200, percentile: 80 },
      staking: { rank: 400, percentile: 60 },
      defi: { rank: 300, percentile: 70 }
    }
  }
}

// Test component
function TestScoreDashboard() {
  return (
    <div>
      <h1>Testing Enhanced Score Dashboard</h1>
      <ScoreDashboard />
    </div>
  )
}

export default TestScoreDashboard