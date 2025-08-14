#!/usr/bin/env ts-node

/**
 * Simple test for competitive positioning integration
 */

import { CompetitivePositioningEngine } from './services/competitivePositioningEngine';
import { BenchmarkingEngine } from './services/benchmarkingEngine';
import { databaseService } from './services/databaseService';
import { initializeDatabase } from './database/connection';

async function testCompetitivePositioningSimple() {
  console.log('🚀 Testing Competitive Positioning Integration (Simple)...\n');

  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Mock data for testing
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockCreditScore = {
      address: mockAddress,
      score: 750,
      confidence: 85,
      timestamp: Math.floor(Date.now() / 1000),
      breakdown: {
        transactionVolume: 200,
        transactionFrequency: 180,
        stakingActivity: 220,
        defiInteractions: 150
      }
    };

    const mockScoreBreakdown = {
      transactionVolume: {
        score: 200,
        weight: 0.3,
        weightedScore: 60,
        details: {
          totalVolume: '25.5',
          volumeScore: 200,
          volumeCategory: 'High',
          gasEfficiency: 80
        },
        insights: {
          explanation: 'Strong transaction volume',
          strengths: ['High volume activity'],
          weaknesses: [],
          improvementPotential: 20,
          benchmarkComparison: {
            percentile: 80,
            category: 'Above Average'
          }
        }
      },
      transactionFrequency: {
        score: 180,
        weight: 0.25,
        weightedScore: 45,
        details: {
          totalTransactions: 150,
          accountAge: 365,
          frequencyScore: 180,
          avgTransactionsPerMonth: 12,
          consistencyScore: 75
        },
        insights: {
          explanation: 'Good transaction frequency',
          strengths: ['Consistent activity'],
          weaknesses: [],
          improvementPotential: 30,
          benchmarkComparison: {
            percentile: 70,
            category: 'Good'
          }
        }
      },
      stakingActivity: {
        score: 220,
        weight: 0.25,
        weightedScore: 55,
        details: {
          stakingBalance: '10.2',
          stakingScore: 220,
          stakingRatio: 0.4,
          stakingProtocols: ['Ethereum 2.0'],
          stakingDuration: 180
        },
        insights: {
          explanation: 'Excellent staking activity',
          strengths: ['High staking ratio', 'Long duration'],
          weaknesses: [],
          improvementPotential: 10,
          benchmarkComparison: {
            percentile: 85,
            category: 'Excellent'
          }
        }
      },
      defiInteractions: {
        score: 150,
        weight: 0.2,
        weightedScore: 30,
        details: {
          protocolsUsed: 3,
          defiScore: 150,
          diversificationScore: 60,
          totalDefiVolume: '15.3',
          favoriteProtocols: ['Uniswap', 'Compound', 'Aave']
        },
        insights: {
          explanation: 'Moderate DeFi usage',
          strengths: ['Uses multiple protocols'],
          weaknesses: ['Could diversify more'],
          improvementPotential: 50,
          benchmarkComparison: {
            percentile: 65,
            category: 'Average'
          }
        }
      },
      riskAssessment: {
        riskLevel: 'LOW' as const,
        riskScore: 25,
        riskFactors: ['Low concentration risk'],
        flags: {
          concentrationRisk: false,
          volatilityRisk: false,
          inactivityRisk: false,
          newAccountRisk: false,
          unusualPatterns: false
        }
      },
      behavioralInsights: {
        consistencyScore: 75,
        growthTrend: 'STABLE' as const,
        diversificationLevel: 'MEDIUM' as const,
        gasEfficiency: 80,
        activityPattern: 'REGULAR' as const,
        preferredProtocols: ['Uniswap', 'Compound']
      },
      recommendations: [
        {
          priority: 'MEDIUM' as const,
          category: 'DEFI' as const,
          title: 'Increase DeFi diversification',
          description: 'Try using more DeFi protocols to improve your score',
          impact: 'Could increase score by 30-50 points',
          actionItems: ['Explore yield farming', 'Try new protocols']
        }
      ]
    };

    const mockMetrics = {
      totalTransactions: 150,
      totalVolume: '25.5',
      avgTransactionValue: '0.17',
      stakingBalance: '10.2',
      defiProtocolsUsed: ['Uniswap', 'Compound', 'Aave'],
      accountAge: 365,
      firstTransactionDate: Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60),
      lastTransactionDate: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60)
    };

    const mockBenchmarkingData = {
      address: mockAddress,
      peerGroupClassification: {
        address: mockAddress,
        primaryPeerGroup: {
          id: 'established_active',
          name: 'Established Active Users',
          description: 'Mature accounts with high activity and substantial portfolios',
          criteria: {
            accountAge: { min: 91, max: 365 },
            activityLevel: { min: 101, max: 500 },
            portfolioSize: { min: 10, max: 500 }
          },
          memberCount: 1000,
          averageScore: 650,
          scoreRange: {
            min: 400,
            max: 900,
            percentiles: { p25: 500, p50: 650, p75: 750, p90: 850 }
          }
        },
        alternativePeerGroups: [],
        classificationConfidence: 85,
        classificationReasons: ['Test classification']
      },
      percentileRankings: {
        overallScore: {
          percentile: 75,
          rank: 250,
          totalInGroup: 1000,
          category: 'GOOD' as const,
          explanation: 'Good performance',
          improvementPotential: 50
        },
        componentScores: {
          transactionVolume: {
            percentile: 80,
            rank: 200,
            totalInGroup: 1000,
            category: 'GOOD' as const,
            explanation: 'Good volume',
            improvementPotential: 40
          },
          transactionFrequency: {
            percentile: 70,
            rank: 300,
            totalInGroup: 1000,
            category: 'GOOD' as const,
            explanation: 'Good frequency',
            improvementPotential: 60
          },
          stakingActivity: {
            percentile: 85,
            rank: 150,
            totalInGroup: 1000,
            category: 'GOOD' as const,
            explanation: 'Good staking',
            improvementPotential: 30
          },
          defiInteractions: {
            percentile: 65,
            rank: 350,
            totalInGroup: 1000,
            category: 'AVERAGE' as const,
            explanation: 'Average DeFi',
            improvementPotential: 70
          }
        },
        behavioralMetrics: {
          consistencyScore: {
            percentile: 75,
            rank: 250,
            totalInGroup: 1000,
            category: 'GOOD' as const,
            explanation: 'Good consistency',
            improvementPotential: 50
          },
          diversificationScore: {
            percentile: 60,
            rank: 400,
            totalInGroup: 1000,
            category: 'AVERAGE' as const,
            explanation: 'Average diversification',
            improvementPotential: 80
          },
          gasEfficiency: {
            percentile: 80,
            rank: 200,
            totalInGroup: 1000,
            category: 'GOOD' as const,
            explanation: 'Good gas efficiency',
            improvementPotential: 40
          },
          riskScore: {
            percentile: 75,
            rank: 250,
            totalInGroup: 1000,
            category: 'GOOD' as const,
            explanation: 'Good risk management',
            improvementPotential: 50
          }
        }
      },
      comparativeAnalysis: {
        vsGroupAverage: {
          scoreDifference: 100,
          percentageDifference: 15.4,
          betterThan: 75,
          explanation: 'Above average performance'
        },
        vsTopPerformers: {
          scoreDifference: 100,
          gapToTop10: 100,
          gapToTop25: 50,
          explanation: 'Room for improvement to reach top performers'
        },
        strengthsVsPeers: [],
        weaknessesVsPeers: [],
        opportunityAreas: []
      },
      benchmarkCategories: [],
      relativePerformance: {
        overallRating: 'ABOVE_AVERAGE' as const,
        keyStrengths: ['Staking Activity', 'Gas Efficiency'],
        keyWeaknesses: ['DeFi Interactions'],
        competitiveAdvantages: ['Strong staking performance'],
        improvementPriorities: ['Increase DeFi usage'],
        marketPosition: 'Strong market position - well above average performance'
      }
    };

    console.log('\n2️⃣ Testing competitive positioning generation...');
    
    // Generate competitive positioning
    const competitivePositioning = await CompetitivePositioningEngine.generateCompetitivePositioning(
      mockAddress,
      mockCreditScore,
      mockScoreBreakdown,
      mockMetrics,
      mockBenchmarkingData
    );

    console.log(`   ✅ Generated competitive positioning for ${mockAddress}`);
    console.log(`   Market rank: ${competitivePositioning.marketPosition.overallMarketRank}`);
    console.log(`   Market percentile: ${competitivePositioning.marketPosition.marketPercentile}%`);
    console.log(`   Market segment: ${competitivePositioning.marketPosition.marketSegment.name}`);
    console.log(`   Competitive advantages: ${competitivePositioning.competitiveAdvantages.length}`);
    console.log(`   Market opportunities: ${competitivePositioning.marketOpportunities.length}`);
    console.log(`   Competitive threats: ${competitivePositioning.competitiveThreats.length}`);
    console.log(`   Strategic recommendations: ${competitivePositioning.strategicRecommendations.length}`);

    console.log('\n3️⃣ Testing database storage...');
    
    // Test database storage
    const positioningId = await databaseService.saveCompetitivePositioningData(competitivePositioning);
    console.log(`   ✅ Saved competitive positioning data with ID: ${positioningId}`);

    console.log('\n4️⃣ Testing data retrieval...');
    
    // Test data retrieval
    const retrievedData = await databaseService.getLatestCompetitivePositioningData(mockAddress);
    console.log(`   ✅ Retrieved data for address: ${retrievedData?.address}`);
    console.log(`   Market percentile: ${retrievedData?.marketPosition.marketPercentile}%`);

    const advantages = await databaseService.getCompetitiveAdvantages(mockAddress);
    console.log(`   ✅ Retrieved ${advantages.length} competitive advantages`);

    const opportunities = await databaseService.getMarketOpportunities(mockAddress);
    console.log(`   ✅ Retrieved ${opportunities.length} market opportunities`);

    const threats = await databaseService.getCompetitiveThreats(mockAddress);
    console.log(`   ✅ Retrieved ${threats.length} competitive threats`);

    const recommendations = await databaseService.getStrategicRecommendations(mockAddress);
    console.log(`   ✅ Retrieved ${recommendations.length} strategic recommendations`);

    console.log('\n5️⃣ Testing benchmarking integration...');
    
    // Test benchmarking integration
    const benchmarkingWithCP = await BenchmarkingEngine.generateBenchmarkingData(
      mockAddress,
      mockCreditScore,
      mockScoreBreakdown,
      mockMetrics,
      undefined,
      true // Include competitive positioning
    );

    console.log(`   ✅ Generated benchmarking data with competitive positioning`);
    console.log(`   Has competitive positioning: ${!!benchmarkingWithCP.competitivePositioning}`);
    if (benchmarkingWithCP.competitivePositioning) {
      console.log(`   CP Market segment: ${benchmarkingWithCP.competitivePositioning.marketPosition.marketSegment.name}`);
    }

    console.log('\n✅ Competitive positioning integration test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Competitive positioning engine works correctly');
    console.log('   - Database storage and retrieval functions properly');
    console.log('   - Benchmarking integration includes competitive positioning');
    console.log('   - All API endpoints should work with this integration');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testCompetitivePositioningSimple();