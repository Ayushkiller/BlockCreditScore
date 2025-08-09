// DeFi Protocol Integration API - Standardized API endpoints for credit score retrieval and verification
// Implements Requirements 9.1, 9.2, 9.3, 9.4: standardized endpoints, 2-second response, custom scoring, rate limiting

import { CreditProfile, ScoreDimension } from '../../types/credit';
import { CreditAPI, CreditResponse, DimensionWeights, WeightedScore, ZKProof, UpdateCallback, Subscription, APIError, RateLimitError } from '../../types/api';
import { ScoringEngineService } from '../scoring-engine/scoring-engine-service';
import { getCurrentTimestamp } from '../../utils/time';
import { formatError } from '../../utils/errors';

export interface APIConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  responseTimeoutMs: number;
  enableCaching: boolean;
  cacheExpiryMs: number;
}

export interface RateLimitInfo {
  requests: number;
  windowStart: number;
  windowDurationMs: number;
}

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rateLimitHits: number;
  cacheHits: number;
  uptime: number;
}

export class IntegrationAPI implements CreditAPI {
  private scoringEngine: ScoringEngineService;
  private config: APIConfig;
  private rateLimitMap: Map<string, RateLimitInfo> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private responseCache: Map<string, { data: any; expiry: number }> = new Map();
  private metrics: APIMetrics;
  private startTime: number;

  constructor(config: Partial<APIConfig> = {}) {
    this.scoringEngine = new ScoringEngineService();
    this.config = {
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000,
      responseTimeoutMs: 2000, // 2-second SLA
      enableCaching: true,
      cacheExpiryMs: 5 * 60 * 1000, // 5 minutes
      ...config
    };
    
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0,
      cacheHits: 0,
      uptime: 0
    };
    
    this.startTime = getCurrentTimestamp();
    
    // Start cleanup intervals
    this.startCleanupIntervals();
  }

  /**
   * Get credit score with standardized response format
   * Implements Requirements 9.1, 9.2: standardized endpoints, 2-second response
   */
  public async getCreditScore(
    address: string,
    dimensions?: (keyof CreditProfile['dimensions'])[]
  ): Promise<CreditResponse> {
    const startTime = getCurrentTimestamp();
    const requestId = this.generateRequestId();
    
    try {
      // Rate limiting check
      await this.checkRateLimit(address);
      
      // Check cache first
      const cacheKey = `score_${address}_${dimensions?.join(',') || 'all'}`;
      if (this.config.enableCaching) {
        const cached = this.getCachedResponse(cacheKey);
        if (cached) {
          this.metrics.cacheHits++;
          return cached as CreditResponse;
        }
      }

      // Set timeout for 2-second SLA
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - exceeded 2 second SLA')), this.config.responseTimeoutMs);
      });

      // Get credit profile
      const profilePromise = this.scoringEngine.getCreditProfile(address);
      const profile = await Promise.race([profilePromise, timeoutPromise]);

      // Filter dimensions if specified
      let filteredScores: Partial<CreditProfile['dimensions']>;
      if (dimensions && dimensions.length > 0) {
        filteredScores = {};
        for (const dim of dimensions) {
          if (profile.dimensions[dim]) {
            filteredScores[dim] = profile.dimensions[dim];
          }
        }
      } else {
        filteredScores = profile.dimensions;
      }

      // Calculate overall score and confidence
      const overallScore = this.calculateOverallScore(filteredScores);
      const confidence = this.calculateOverallConfidence(filteredScores);

      const response: CreditResponse = {
        userAddress: address,
        scores: filteredScores,
        overallScore,
        confidence,
        lastUpdated: profile.lastUpdated,
        dataQuality: {
          totalDataPoints: Object.values(filteredScores).reduce((sum, dim) => sum + (dim?.dataPoints || 0), 0),
          dataFreshness: (getCurrentTimestamp() - profile.lastUpdated) / (60 * 60 * 1000), // hours
          crossChainCoverage: 100, // Ethereum only for now
          historicalDepth: 90 // days
        }
      };

      // Cache the response
      if (this.config.enableCaching) {
        this.setCachedResponse(cacheKey, response);
      }

      // Update metrics
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateMetrics(true, responseTime);

      return response;

    } catch (error) {
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateMetrics(false, responseTime);
      
      console.error(`Error getting credit score for ${address}:`, formatError(error));
      throw this.createAPIError('SCORE_RETRIEVAL_ERROR', error.message, { address, requestId });
    }
  }

  /**
   * Verify score using zero-knowledge proofs
   * Implements Requirement 9.1: standardized endpoints
   */
  public async verifyScore(address: string, threshold: number): Promise<ZKProof> {
    const startTime = getCurrentTimestamp();
    
    try {
      await this.checkRateLimit(address);

      // Mock ZK proof generation - in reality, this would use actual ZK circuits
      const proof: ZKProof = {
        proof: this.generateMockProof(address, threshold),
        publicInputs: [threshold.toString(), getCurrentTimestamp().toString()],
        verificationKey: this.generateVerificationKey(),
        timestamp: getCurrentTimestamp()
      };

      const responseTime = getCurrentTimestamp() - startTime;
      this.updateMetrics(true, responseTime);

      return proof;

    } catch (error) {
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateMetrics(false, responseTime);
      
      console.error(`Error verifying score for ${address}:`, formatError(error));
      throw this.createAPIError('SCORE_VERIFICATION_ERROR', error.message, { address, threshold });
    }
  }

  /**
   * Get custom weighted score based on protocol preferences
   * Implements Requirement 9.3: custom weighted scoring
   */
  public async getCustomScore(address: string, weights: DimensionWeights): Promise<WeightedScore> {
    const startTime = getCurrentTimestamp();
    
    try {
      await this.checkRateLimit(address);

      // Validate weights
      this.validateWeights(weights);

      // Get base credit profile
      const profile = await this.scoringEngine.getCreditProfile(address);

      // Calculate weighted score
      const breakdown: Record<keyof DimensionWeights, number> = {
        defiReliability: profile.dimensions.defiReliability.score * weights.defiReliability,
        tradingConsistency: profile.dimensions.tradingConsistency.score * weights.tradingConsistency,
        stakingCommitment: profile.dimensions.stakingCommitment.score * weights.stakingCommitment,
        governanceParticipation: profile.dimensions.governanceParticipation.score * weights.governanceParticipation,
        liquidityProvider: profile.dimensions.liquidityProvider.score * weights.liquidityProvider
      };

      const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      const weightedScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0) / totalWeight;

      // Calculate weighted confidence
      const confidenceBreakdown = {
        defiReliability: profile.dimensions.defiReliability.confidence * weights.defiReliability,
        tradingConsistency: profile.dimensions.tradingConsistency.confidence * weights.tradingConsistency,
        stakingCommitment: profile.dimensions.stakingCommitment.confidence * weights.stakingCommitment,
        governanceParticipation: profile.dimensions.governanceParticipation.confidence * weights.governanceParticipation,
        liquidityProvider: profile.dimensions.liquidityProvider.confidence * weights.liquidityProvider
      };

      const weightedConfidence = Object.values(confidenceBreakdown).reduce((sum, conf) => sum + conf, 0) / totalWeight;

      const result: WeightedScore = {
        score: Math.round(weightedScore),
        weights,
        breakdown,
        confidence: Math.round(weightedConfidence)
      };

      const responseTime = getCurrentTimestamp() - startTime;
      this.updateMetrics(true, responseTime);

      return result;

    } catch (error) {
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateMetrics(false, responseTime);
      
      console.error(`Error calculating custom score for ${address}:`, formatError(error));
      throw this.createAPIError('CUSTOM_SCORE_ERROR', error.message, { address, weights });
    }
  }

  /**
   * Subscribe to score updates
   * Implements Requirement 9.1: standardized endpoints
   */
  public async subscribeToUpdates(address: string, callback: UpdateCallback): Promise<Subscription> {
    try {
      await this.checkRateLimit(address);

      const subscriptionId = this.generateSubscriptionId();
      const subscription: Subscription = {
        id: subscriptionId,
        userAddress: address,
        callback,
        createdAt: getCurrentTimestamp(),
        isActive: true
      };

      this.subscriptions.set(subscriptionId, subscription);

      // Set up cleanup after 24 hours
      setTimeout(() => {
        this.subscriptions.delete(subscriptionId);
      }, 24 * 60 * 60 * 1000);

      return subscription;

    } catch (error) {
      console.error(`Error creating subscription for ${address}:`, formatError(error));
      throw this.createAPIError('SUBSCRIPTION_ERROR', error.message, { address });
    }
  }

  /**
   * Rate limiting implementation with fair queuing
   * Implements Requirement 9.4: rate limiting with clear error messages
   */
  private async checkRateLimit(identifier: string): Promise<void> {
    const now = getCurrentTimestamp();
    const minuteWindow = 60 * 1000; // 1 minute
    const hourWindow = 60 * 60 * 1000; // 1 hour

    // Check minute limit
    const minuteKey = `${identifier}_minute`;
    const minuteLimit = this.rateLimitMap.get(minuteKey);
    
    if (minuteLimit) {
      if (now - minuteLimit.windowStart < minuteWindow) {
        if (minuteLimit.requests >= this.config.maxRequestsPerMinute) {
          this.metrics.rateLimitHits++;
          throw this.createRateLimitError(
            'RATE_LIMIT_EXCEEDED',
            `Rate limit exceeded: ${this.config.maxRequestsPerMinute} requests per minute`,
            Math.ceil((minuteWindow - (now - minuteLimit.windowStart)) / 1000),
            this.config.maxRequestsPerMinute - minuteLimit.requests
          );
        }
        minuteLimit.requests++;
      } else {
        // Reset window
        minuteLimit.requests = 1;
        minuteLimit.windowStart = now;
      }
    } else {
      this.rateLimitMap.set(minuteKey, {
        requests: 1,
        windowStart: now,
        windowDurationMs: minuteWindow
      });
    }

    // Check hour limit
    const hourKey = `${identifier}_hour`;
    const hourLimit = this.rateLimitMap.get(hourKey);
    
    if (hourLimit) {
      if (now - hourLimit.windowStart < hourWindow) {
        if (hourLimit.requests >= this.config.maxRequestsPerHour) {
          this.metrics.rateLimitHits++;
          throw this.createRateLimitError(
            'HOURLY_RATE_LIMIT_EXCEEDED',
            `Hourly rate limit exceeded: ${this.config.maxRequestsPerHour} requests per hour`,
            Math.ceil((hourWindow - (now - hourLimit.windowStart)) / 1000),
            this.config.maxRequestsPerHour - hourLimit.requests
          );
        }
        hourLimit.requests++;
      } else {
        // Reset window
        hourLimit.requests = 1;
        hourLimit.windowStart = now;
      }
    } else {
      this.rateLimitMap.set(hourKey, {
        requests: 1,
        windowStart: now,
        windowDurationMs: hourWindow
      });
    }
  }

  /**
   * Get API health and metrics
   * Implements Requirement 9.2: 99.9% uptime SLA monitoring
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    metrics: APIMetrics;
    slaCompliance: {
      responseTime: boolean;
      uptime: boolean;
      errorRate: boolean;
    };
  } {
    const now = getCurrentTimestamp();
    const uptimeMs = now - this.startTime;
    const uptimeHours = uptimeMs / (60 * 60 * 1000);
    
    this.metrics.uptime = (uptimeHours / (uptimeHours + 0.1)) * 100; // Mock uptime calculation

    const errorRate = this.metrics.totalRequests > 0 ? 
      (this.metrics.failedRequests / this.metrics.totalRequests) * 100 : 0;

    const slaCompliance = {
      responseTime: this.metrics.averageResponseTime < this.config.responseTimeoutMs,
      uptime: this.metrics.uptime >= 99.9,
      errorRate: errorRate < 1.0 // Less than 1% error rate
    };

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (slaCompliance.responseTime && slaCompliance.uptime && slaCompliance.errorRate) {
      status = 'healthy';
    } else if (slaCompliance.uptime && (slaCompliance.responseTime || slaCompliance.errorRate)) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      uptime: this.metrics.uptime,
      metrics: { ...this.metrics },
      slaCompliance
    };
  }

  /**
   * Unsubscribe from updates
   */
  public async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
      return true;
    }
    return false;
  }

  /**
   * Trigger update notifications for subscribers
   */
  public async notifySubscribers(userAddress: string, update: any): Promise<void> {
    const userSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.userAddress === userAddress && sub.isActive);

    for (const subscription of userSubscriptions) {
      try {
        subscription.callback(update);
      } catch (error) {
        console.error(`Error notifying subscriber ${subscription.id}:`, formatError(error));
        // Deactivate problematic subscriptions
        subscription.isActive = false;
      }
    }
  }

  // Helper methods
  private calculateOverallScore(dimensions: Partial<CreditProfile['dimensions']>): number {
    const scores = Object.values(dimensions).filter(dim => dim !== undefined).map(dim => dim!.score);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateOverallConfidence(dimensions: Partial<CreditProfile['dimensions']>): number {
    const confidences = Object.values(dimensions).filter(dim => dim !== undefined).map(dim => dim!.confidence);
    if (confidences.length === 0) return 0;
    return Math.round(confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length);
  }

  private validateWeights(weights: DimensionWeights): void {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight <= 0) {
      throw new Error('Total weight must be greater than 0');
    }

    for (const [dimension, weight] of Object.entries(weights)) {
      if (weight < 0) {
        throw new Error(`Weight for ${dimension} cannot be negative`);
      }
      if (weight > 1) {
        throw new Error(`Weight for ${dimension} cannot exceed 1.0`);
      }
    }
  }

  private getCachedResponse(key: string): any | null {
    const cached = this.responseCache.get(key);
    if (cached && cached.expiry > getCurrentTimestamp()) {
      return cached.data;
    }
    if (cached) {
      this.responseCache.delete(key);
    }
    return null;
  }

  private setCachedResponse(key: string, data: any): void {
    this.responseCache.set(key, {
      data,
      expiry: getCurrentTimestamp() + this.config.cacheExpiryMs
    });
  }

  private updateMetrics(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalResponseTime / this.metrics.totalRequests;
  }

  private createAPIError(code: string, message: string, details?: any): APIError {
    return {
      code,
      message,
      details,
      timestamp: getCurrentTimestamp()
    };
  }

  private createRateLimitError(
    code: string,
    message: string,
    retryAfter: number,
    remainingRequests: number
  ): RateLimitError {
    return {
      code,
      message,
      retryAfter,
      remainingRequests,
      timestamp: getCurrentTimestamp()
    };
  }

  private generateRequestId(): string {
    return `req_${getCurrentTimestamp()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${getCurrentTimestamp()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMockProof(address: string, threshold: number): string {
    // Mock proof generation - in reality, this would use zk-SNARK libraries
    const data = `${address}_${threshold}_${getCurrentTimestamp()}`;
    return Buffer.from(data).toString('base64');
  }

  private generateVerificationKey(): string {
    // Mock verification key - in reality, this would be generated by the ZK circuit
    return `vk_${Math.random().toString(36).substr(2, 16)}`;
  }

  private startCleanupIntervals(): void {
    // Clean up expired rate limit entries every 5 minutes
    setInterval(() => {
      const now = getCurrentTimestamp();
      for (const [key, limit] of this.rateLimitMap.entries()) {
        if (now - limit.windowStart > limit.windowDurationMs) {
          this.rateLimitMap.delete(key);
        }
      }
    }, 5 * 60 * 1000);

    // Clean up expired cache entries every 10 minutes
    setInterval(() => {
      const now = getCurrentTimestamp();
      for (const [key, cached] of this.responseCache.entries()) {
        if (cached.expiry <= now) {
          this.responseCache.delete(key);
        }
      }
    }, 10 * 60 * 1000);

    // Clean up inactive subscriptions every hour
    setInterval(() => {
      for (const [id, subscription] of this.subscriptions.entries()) {
        if (!subscription.isActive) {
          this.subscriptions.delete(id);
        }
      }
    }, 60 * 60 * 1000);
  }
}