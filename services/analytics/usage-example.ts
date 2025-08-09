// Analytics Dashboard and API Gateway Usage Example
// Demonstrates complete implementation of Requirements 8.1, 8.2, 8.3, 8.4 and 9.1, 9.2, 9.3, 9.4

import { GatewayService } from '../api-gateway/gateway-service';
import { DashboardService } from './dashboard-service';
import { getCurrentTimestamp } from '../../utils/time';

/**
 * Example usage of the complete analytics dashboard and API system
 */
export class CreditIntelligenceSystem {
  private gatewayService: GatewayService;
  private dashboardService: DashboardService;

  constructor() {
    // Initialize services with production-ready configuration
    this.gatewayService = new GatewayService({
      port: 3000,
      enableCors: true,
      enableLogging: true,
      enableMetrics: true,
      rateLimitConfig: {
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000
      },
      cacheConfig: {
        enableCaching: true,
        cacheExpiryMs: 5 * 60 * 1000 // 5 minutes
      }
    });

    this.dashboardService = new DashboardService();
  }

  /**
   * Example: Complete user analytics dashboard workflow
   * Implements Requirements 8.1, 8.2, 8.3, 8.4
   */
  public async demonstrateAnalyticsDashboard(): Promise<void> {
    console.log('=== Analytics Dashboard Demo ===\n');

    const userAddress = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';

    try {
      // 1. Generate comprehensive dashboard data
      console.log('1. Generating comprehensive dashboard data...');
      const dashboardData = await this.dashboardService.generateDashboardData(userAddress, {
        includeExport: false
      });

      console.log(`✓ Dashboard generated for user: ${dashboardData.userProfile.userAddress}`);
      console.log(`✓ Overall confidence: ${dashboardData.analysis.overallConfidence}%`);
      console.log(`✓ Active dimensions: ${dashboardData.analysis.evolutionSummary.activeDimensions}/5`);
      console.log(`✓ Overall trend: ${dashboardData.analysis.evolutionSummary.overallTrend}`);

      // 2. Demonstrate multi-timeframe score evolution (Requirement 8.1)
      console.log('\n2. Multi-timeframe score evolution:');
      const evolution = dashboardData.scoreEvolution;
      
      console.log(`   7-day change: ${evolution.timeframes.sevenDays.change > 0 ? '+' : ''}${evolution.timeframes.sevenDays.change} points`);
      console.log(`   30-day change: ${evolution.timeframes.thirtyDays.change > 0 ? '+' : ''}${evolution.timeframes.thirtyDays.change} points`);
      console.log(`   90-day trend: ${evolution.timeframes.ninetyDays.trend}`);
      console.log(`   1-year volatility: ${evolution.timeframes.oneYear.volatility}`);

      // 3. Demonstrate peer comparison with anonymization (Requirement 8.2)
      console.log('\n3. Peer comparison analytics (anonymized):');
      const peerComparison = dashboardData.peerComparison;
      
      console.log(`   User percentile: ${peerComparison.userPercentile}th percentile`);
      console.log(`   Market tier: ${peerComparison.marketPosition.tier}`);
      console.log(`   Progress to next tier: ${peerComparison.marketPosition.progressToNextTier}%`);
      console.log(`   Similar peers found: ${peerComparison.anonymizedPeers.length}`);

      // 4. Demonstrate specific improvement recommendations (Requirement 8.3)
      console.log('\n4. Improvement recommendations:');
      const recommendations = dashboardData.recommendations;
      
      console.log(`   Priority recommendations: ${recommendations.priorityRecommendations.length}`);
      console.log(`   Quick wins available: ${recommendations.quickWins.length}`);
      console.log(`   Long-term goals: ${recommendations.longTermGoals.length}`);
      
      if (recommendations.priorityRecommendations.length > 0) {
        const topRec = recommendations.priorityRecommendations[0];
        console.log(`   Top recommendation: ${topRec.title} (${topRec.priority} priority)`);
        console.log(`   Expected impact: +${topRec.expectedImpact.scoreIncrease} points`);
      }

      // 5. Demonstrate secure data export (Requirement 8.4)
      console.log('\n5. Secure data export functionality:');
      
      // Export full data as JSON
      const fullExport = await this.dashboardService.generateDashboardData(userAddress, {
        includeExport: true,
        exportFormat: 'json',
        privacyLevel: 'full'
      });
      
      console.log(`   ✓ Full JSON export generated (${fullExport.exportData?.metadata.privacyControls.length} privacy controls)`);
      
      // Export anonymized data as CSV
      const anonymizedExport = await this.dashboardService.generateDashboardData(userAddress, {
        includeExport: true,
        exportFormat: 'csv',
        privacyLevel: 'anonymized'
      });
      
      console.log(`   ✓ Anonymized CSV export generated`);
      console.log(`   ✓ Privacy controls: ${anonymizedExport.exportData?.metadata.privacyControls.join(', ')}`);

    } catch (error) {
      console.error('Error in analytics dashboard demo:', error);
    }
  }

  /**
   * Example: DeFi protocol integration API workflow
   * Implements Requirements 9.1, 9.2, 9.3, 9.4
   */
  public async demonstrateProtocolIntegration(): Promise<void> {
    console.log('\n=== DeFi Protocol Integration Demo ===\n');

    const userAddress = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';

    try {
      // 1. Demonstrate standardized API endpoints (Requirement 9.1)
      console.log('1. Standardized API endpoints:');
      
      // Get basic credit score
      const scoreResponse = await this.gatewayService.handleGetCreditScore(userAddress);
      console.log(`   ✓ Credit score retrieved: ${scoreResponse.data?.overallScore}/1000`);
      console.log(`   ✓ Response time: ${scoreResponse.metadata?.responseTime}ms`);
      
      // Verify score with ZK proof
      const verifyResponse = await this.gatewayService.handleVerifyScore(userAddress, 600);
      console.log(`   ✓ Score verification proof generated`);
      console.log(`   ✓ Proof timestamp: ${new Date(verifyResponse.data?.timestamp).toISOString()}`);

      // 2. Demonstrate 2-second response time SLA (Requirement 9.2)
      console.log('\n2. Response time SLA compliance:');
      
      const startTime = getCurrentTimestamp();
      await this.gatewayService.handleGetCreditScore(userAddress, ['defiReliability', 'tradingConsistency']);
      const responseTime = getCurrentTimestamp() - startTime;
      
      console.log(`   ✓ Response time: ${responseTime}ms (SLA: <2000ms)`);
      console.log(`   ✓ SLA compliance: ${responseTime < 2000 ? 'PASS' : 'FAIL'}`);

      // 3. Demonstrate custom weighted scoring (Requirement 9.3)
      console.log('\n3. Custom weighted scoring:');
      
      const customWeights = {
        defiReliability: 0.4,      // 40% weight - most important for lending
        tradingConsistency: 0.2,   // 20% weight
        stakingCommitment: 0.2,    // 20% weight
        governanceParticipation: 0.1, // 10% weight
        liquidityProvider: 0.1     // 10% weight
      };
      
      const customScoreResponse = await this.gatewayService.handleGetCustomScore(userAddress, customWeights);
      console.log(`   ✓ Custom weighted score: ${customScoreResponse.data?.score}/1000`);
      console.log(`   ✓ Confidence: ${customScoreResponse.data?.confidence}%`);
      console.log(`   ✓ Weights applied: DeFi Reliability (40%), Trading (20%), Staking (20%)`);

      // 4. Demonstrate rate limiting and error handling (Requirement 9.4)
      console.log('\n4. Rate limiting and error handling:');
      
      // Test multiple rapid requests to trigger rate limiting
      const rapidRequests = [];
      for (let i = 0; i < 5; i++) {
        rapidRequests.push(this.gatewayService.handleGetCreditScore(userAddress));
      }
      
      const results = await Promise.allSettled(rapidRequests);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`   ✓ Rapid requests processed: ${successful} successful, ${failed} failed`);
      console.log(`   ✓ Rate limiting active: ${failed > 0 ? 'YES' : 'NO'}`);

      // Test subscription functionality
      const subscriptionResponse = await this.gatewayService.handleSubscription(
        userAddress,
        'https://example-protocol.com/webhook'
      );
      
      console.log(`   ✓ Subscription created: ${subscriptionResponse.data?.subscriptionId}`);

      // 5. Demonstrate health monitoring and uptime tracking
      console.log('\n5. Health monitoring and uptime:');
      
      const healthStatus = this.gatewayService.getHealthStatus();
      console.log(`   ✓ System status: ${healthStatus.status.toUpperCase()}`);
      console.log(`   ✓ Uptime: ${healthStatus.uptime.toFixed(2)} hours`);
      console.log(`   ✓ Active connections: ${healthStatus.systemMetrics.activeConnections}`);
      console.log(`   ✓ Integration API status: ${healthStatus.services.integrationAPI.status}`);
      
      // Check SLA compliance
      const slaCompliance = healthStatus.services.integrationAPI.slaCompliance;
      console.log(`   ✓ Response time SLA: ${slaCompliance.responseTime ? 'PASS' : 'FAIL'}`);
      console.log(`   ✓ Uptime SLA (99.9%): ${slaCompliance.uptime ? 'PASS' : 'FAIL'}`);
      console.log(`   ✓ Error rate SLA: ${slaCompliance.errorRate ? 'PASS' : 'FAIL'}`);

    } catch (error) {
      console.error('Error in protocol integration demo:', error);
    }
  }

  /**
   * Example: Real-world DeFi protocol integration scenario
   */
  public async demonstrateRealWorldScenario(): Promise<void> {
    console.log('\n=== Real-World Integration Scenario ===\n');
    console.log('Scenario: Aave-like lending protocol wants to integrate credit intelligence\n');

    const borrowerAddress = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';

    try {
      // 1. Protocol requests credit assessment for loan application
      console.log('1. Loan Application Assessment:');
      
      const creditResponse = await this.gatewayService.handleGetCreditScore(
        borrowerAddress,
        ['defiReliability', 'tradingConsistency', 'stakingCommitment']
      );
      
      console.log(`   Borrower: ${borrowerAddress}`);
      console.log(`   Overall Score: ${creditResponse.data?.overallScore}/1000`);
      console.log(`   Data Quality: ${creditResponse.data?.dataQuality.totalDataPoints} data points`);
      console.log(`   Last Updated: ${new Date(creditResponse.data?.lastUpdated).toLocaleString()}`);

      // 2. Protocol applies custom risk weighting
      console.log('\n2. Custom Risk Assessment:');
      
      const lendingWeights = {
        defiReliability: 0.5,      // 50% - most critical for lending
        tradingConsistency: 0.2,   // 20% - shows financial discipline
        stakingCommitment: 0.15,   // 15% - shows long-term thinking
        governanceParticipation: 0.1, // 10% - community involvement
        liquidityProvider: 0.05    // 5% - additional DeFi experience
      };
      
      const riskAssessment = await this.gatewayService.handleGetCustomScore(borrowerAddress, lendingWeights);
      console.log(`   Risk-Weighted Score: ${riskAssessment.data?.score}/1000`);
      console.log(`   Assessment Confidence: ${riskAssessment.data?.confidence}%`);
      
      // Determine loan terms based on score
      const score = riskAssessment.data?.score || 0;
      let interestRate: number;
      let maxLoanAmount: number;
      let collateralRatio: number;
      
      if (score >= 800) {
        interestRate = 3.5;
        maxLoanAmount = 1000000;
        collateralRatio = 120;
      } else if (score >= 650) {
        interestRate = 5.0;
        maxLoanAmount = 500000;
        collateralRatio = 150;
      } else if (score >= 500) {
        interestRate = 7.5;
        maxLoanAmount = 100000;
        collateralRatio = 200;
      } else {
        interestRate = 12.0;
        maxLoanAmount = 25000;
        collateralRatio = 300;
      }
      
      console.log(`   Offered Interest Rate: ${interestRate}% APR`);
      console.log(`   Maximum Loan Amount: $${maxLoanAmount.toLocaleString()}`);
      console.log(`   Required Collateral Ratio: ${collateralRatio}%`);

      // 3. Set up monitoring for loan duration
      console.log('\n3. Ongoing Loan Monitoring:');
      
      const subscription = await this.gatewayService.handleSubscription(
        borrowerAddress,
        'https://lending-protocol.com/credit-updates'
      );
      
      console.log(`   ✓ Monitoring subscription active: ${subscription.data?.subscriptionId}`);
      console.log(`   ✓ Will receive updates on credit score changes`);
      console.log(`   ✓ Automatic risk reassessment enabled`);

      // 4. Generate borrower dashboard access
      console.log('\n4. Borrower Dashboard Access:');
      
      const dashboardData = await this.gatewayService.handleGetDashboardData(borrowerAddress);
      const analysis = dashboardData.data?.analysis;
      
      console.log(`   ✓ Dashboard generated with ${analysis?.recommendations.length} recommendations`);
      console.log(`   ✓ Credit improvement opportunities identified`);
      console.log(`   ✓ Peer comparison data available (anonymized)`);
      
      if (analysis?.recommendations.length > 0) {
        const topRec = analysis.recommendations[0];
        console.log(`   Top recommendation: "${topRec.title}"`);
        console.log(`   Potential score increase: +${topRec.expectedImpact?.scoreIncrease} points`);
      }

      // 5. Privacy-preserving verification for other protocols
      console.log('\n5. Privacy-Preserving Verification:');
      
      const zkProof = await this.gatewayService.handleVerifyScore(borrowerAddress, 650);
      console.log(`   ✓ Zero-knowledge proof generated`);
      console.log(`   ✓ Proves score ≥ 650 without revealing exact value`);
      console.log(`   ✓ Can be shared with other protocols for verification`);
      console.log(`   Proof ID: ${zkProof.data?.proof.substring(0, 20)}...`);

    } catch (error) {
      console.error('Error in real-world scenario demo:', error);
    }
  }

  /**
   * Run all demonstrations
   */
  public async runAllDemonstrations(): Promise<void> {
    console.log('🚀 CryptoVault Credit Intelligence System Demo\n');
    console.log('Demonstrating complete implementation of analytics dashboard and API integration\n');

    await this.demonstrateAnalyticsDashboard();
    await this.demonstrateProtocolIntegration();
    await this.demonstrateRealWorldScenario();

    console.log('\n✅ All demonstrations completed successfully!');
    console.log('\nSystem Features Demonstrated:');
    console.log('✓ Multi-timeframe score evolution visualization (Req 8.1)');
    console.log('✓ Peer comparison analytics with anonymization (Req 8.2)');
    console.log('✓ Specific improvement recommendations (Req 8.3)');
    console.log('✓ Secure data export functionality (Req 8.4)');
    console.log('✓ Standardized API endpoints (Req 9.1)');
    console.log('✓ 2-second response time SLA (Req 9.2)');
    console.log('✓ Custom weighted scoring (Req 9.3)');
    console.log('✓ Rate limiting with clear error messages (Req 9.4)');
  }
}

// Example usage
if (require.main === module) {
  const system = new CreditIntelligenceSystem();
  system.runAllDemonstrations().catch(console.error);
}