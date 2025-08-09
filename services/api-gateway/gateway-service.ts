// API Gateway Service - Main orchestration service for all API endpoints
// Implements Requirements 9.1, 9.2, 9.3, 9.4: Complete API gateway with monitoring and error handling

import { IntegrationAPI } from './integration-api';
import { DashboardService } from '../analytics/dashboard-service';
import { getCurrentTimestamp } from '../../utils/time';
import { formatError } from '../../utils/errors';

export interface GatewayConfig {
  port: number;
  enableCors: boolean;
  enableLogging: boolean;
  enableMetrics: boolean;
  rateLimitConfig: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
  cacheConfig: {
    enableCaching: boolean;
    cacheExpiryMs: number;
  };
}

export interface EndpointMetrics {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastAccessed: number;
}

export interface GatewayHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  services: {
    integrationAPI: any;
    dashboardService: any;
  };
  endpoints: EndpointMetrics[];
  systemMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}

export class GatewayService {
  private integrationAPI: IntegrationAPI;
  private dashboardService: DashboardService;
  private config: GatewayConfig;
  private endpointMetrics: Map<string, EndpointMetrics> = new Map();
  private startTime: number;
  private activeConnections: number = 0;

  constructor(config: Partial<GatewayConfig> = {}) {
    this.config = {
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
        cacheExpiryMs: 5 * 60 * 1000
      },
      ...config
    };

    this.integrationAPI = new IntegrationAPI({
      maxRequestsPerMinute: this.config.rateLimitConfig.maxRequestsPerMinute,
      maxRequestsPerHour: this.config.rateLimitConfig.maxRequestsPerHour,
      enableCaching: this.config.cacheConfig.enableCaching,
      cacheExpiryMs: this.config.cacheConfig.cacheExpiryMs
    });

    this.dashboardService = new DashboardService();
    this.startTime = getCurrentTimestamp();

    this.initializeEndpointMetrics();
  }

  /**
   * Initialize endpoint metrics tracking
   */
  private initializeEndpointMetrics(): void {
    const endpoints = [
      { endpoint: '/api/v1/credit/score', method: 'GET' },
      { endpoint: '/api/v1/credit/verify', method: 'POST' },
      { endpoint: '/api/v1/credit/custom-score', method: 'POST' },
      { endpoint: '/api/v1/credit/subscribe', method: 'POST' },
      { endpoint: '/api/v1/dashboard/data', method: 'GET' },
      { endpoint: '/api/v1/dashboard/export', method: 'POST' },
      { endpoint: '/api/v1/health', method: 'GET' },
      { endpoint: '/api/v1/metrics', method: 'GET' }
    ];

    for (const { endpoint, method } of endpoints) {
      const key = `${method}:${endpoint}`;
      this.endpointMetrics.set(key, {
        endpoint,
        method,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastAccessed: 0
      });
    }
  }

  /**
   * Handle credit score retrieval requests
   * Implements Requirements 9.1, 9.2: standardized endpoints, 2-second response
   */
  public async handleGetCreditScore(
    address: string,
    dimensions?: string[],
    requestMetadata?: any
  ): Promise<any> {
    const startTime = getCurrentTimestamp();
    const endpointKey = 'GET:/api/v1/credit/score';

    try {
      this.activeConnections++;
      
      // Validate input
      if (!address || !this.isValidAddress(address)) {
        throw new Error('Invalid address format');
      }

      // Convert dimensions to proper type
      const validDimensions = dimensions?.filter(d => 
        ['defiReliability', 'tradingConsistency', 'stakingCommitment', 
         'governanceParticipation', 'liquidityProvider'].includes(d)
      ) as (keyof any)[] | undefined;

      // Call integration API
      const result = await this.integrationAPI.getCreditScore(address, validDimensions);

      // Update metrics
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, true, responseTime);

      // Log request if enabled
      if (this.config.enableLogging) {
        console.log(`[${new Date().toISOString()}] GET /api/v1/credit/score - ${address} - ${responseTime}ms`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          requestId: this.generateRequestId(),
          responseTime,
          timestamp: getCurrentTimestamp()
        }
      };

    } catch (error) {
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, false, responseTime);

      console.error(`Error handling credit score request for ${address}:`, formatError(error));
      
      return {
        success: false,
        error: {
          code: 'CREDIT_SCORE_ERROR',
          message: error.message,
          timestamp: getCurrentTimestamp()
        }
      };
    } finally {
      this.activeConnections--;
    }
  }

  /**
   * Handle score verification requests
   * Implements Requirement 9.1: standardized endpoints
   */
  public async handleVerifyScore(
    address: string,
    threshold: number,
    requestMetadata?: any
  ): Promise<any> {
    const startTime = getCurrentTimestamp();
    const endpointKey = 'POST:/api/v1/credit/verify';

    try {
      this.activeConnections++;

      // Validate input
      if (!address || !this.isValidAddress(address)) {
        throw new Error('Invalid address format');
      }

      if (typeof threshold !== 'number' || threshold < 0 || threshold > 1000) {
        throw new Error('Threshold must be a number between 0 and 1000');
      }

      // Call integration API
      const result = await this.integrationAPI.verifyScore(address, threshold);

      // Update metrics
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, true, responseTime);

      if (this.config.enableLogging) {
        console.log(`[${new Date().toISOString()}] POST /api/v1/credit/verify - ${address} - ${responseTime}ms`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          requestId: this.generateRequestId(),
          responseTime,
          timestamp: getCurrentTimestamp()
        }
      };

    } catch (error) {
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, false, responseTime);

      console.error(`Error handling score verification for ${address}:`, formatError(error));
      
      return {
        success: false,
        error: {
          code: 'SCORE_VERIFICATION_ERROR',
          message: error.message,
          timestamp: getCurrentTimestamp()
        }
      };
    } finally {
      this.activeConnections--;
    }
  }

  /**
   * Handle custom weighted score requests
   * Implements Requirement 9.3: custom weighted scoring
   */
  public async handleGetCustomScore(
    address: string,
    weights: any,
    requestMetadata?: any
  ): Promise<any> {
    const startTime = getCurrentTimestamp();
    const endpointKey = 'POST:/api/v1/credit/custom-score';

    try {
      this.activeConnections++;

      // Validate input
      if (!address || !this.isValidAddress(address)) {
        throw new Error('Invalid address format');
      }

      if (!weights || typeof weights !== 'object') {
        throw new Error('Weights must be provided as an object');
      }

      // Validate weights structure
      const requiredDimensions = [
        'defiReliability', 'tradingConsistency', 'stakingCommitment',
        'governanceParticipation', 'liquidityProvider'
      ];

      for (const dimension of requiredDimensions) {
        if (!(dimension in weights)) {
          throw new Error(`Missing weight for dimension: ${dimension}`);
        }
        if (typeof weights[dimension] !== 'number') {
          throw new Error(`Weight for ${dimension} must be a number`);
        }
      }

      // Call integration API
      const result = await this.integrationAPI.getCustomScore(address, weights);

      // Update metrics
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, true, responseTime);

      if (this.config.enableLogging) {
        console.log(`[${new Date().toISOString()}] POST /api/v1/credit/custom-score - ${address} - ${responseTime}ms`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          requestId: this.generateRequestId(),
          responseTime,
          timestamp: getCurrentTimestamp()
        }
      };

    } catch (error) {
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, false, responseTime);

      console.error(`Error handling custom score request for ${address}:`, formatError(error));
      
      return {
        success: false,
        error: {
          code: 'CUSTOM_SCORE_ERROR',
          message: error.message,
          timestamp: getCurrentTimestamp()
        }
      };
    } finally {
      this.activeConnections--;
    }
  }

  /**
   * Handle dashboard data requests
   * Implements Requirements 8.1, 8.2, 8.3, 8.4: dashboard functionality
   */
  public async handleGetDashboardData(
    address: string,
    options: any = {},
    requestMetadata?: any
  ): Promise<any> {
    const startTime = getCurrentTimestamp();
    const endpointKey = 'GET:/api/v1/dashboard/data';

    try {
      this.activeConnections++;

      // Validate input
      if (!address || !this.isValidAddress(address)) {
        throw new Error('Invalid address format');
      }

      // Call dashboard service
      const result = await this.dashboardService.generateDashboardData(address, options);

      // Update metrics
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, true, responseTime);

      if (this.config.enableLogging) {
        console.log(`[${new Date().toISOString()}] GET /api/v1/dashboard/data - ${address} - ${responseTime}ms`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          requestId: this.generateRequestId(),
          responseTime,
          timestamp: getCurrentTimestamp()
        }
      };

    } catch (error) {
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, false, responseTime);

      console.error(`Error handling dashboard data request for ${address}:`, formatError(error));
      
      return {
        success: false,
        error: {
          code: 'DASHBOARD_DATA_ERROR',
          message: error.message,
          timestamp: getCurrentTimestamp()
        }
      };
    } finally {
      this.activeConnections--;
    }
  }

  /**
   * Handle data export requests
   * Implements Requirement 8.4: secure data export functionality
   */
  public async handleDataExport(
    address: string,
    exportOptions: any,
    requestMetadata?: any
  ): Promise<any> {
    const startTime = getCurrentTimestamp();
    const endpointKey = 'POST:/api/v1/dashboard/export';

    try {
      this.activeConnections++;

      // Validate input
      if (!address || !this.isValidAddress(address)) {
        throw new Error('Invalid address format');
      }

      const validFormats = ['json', 'csv', 'pdf'];
      const validPrivacyLevels = ['full', 'anonymized', 'summary'];

      if (exportOptions.format && !validFormats.includes(exportOptions.format)) {
        throw new Error(`Invalid export format. Must be one of: ${validFormats.join(', ')}`);
      }

      if (exportOptions.privacyLevel && !validPrivacyLevels.includes(exportOptions.privacyLevel)) {
        throw new Error(`Invalid privacy level. Must be one of: ${validPrivacyLevels.join(', ')}`);
      }

      // Set defaults
      const options = {
        includeExport: true,
        exportFormat: exportOptions.format || 'json',
        privacyLevel: exportOptions.privacyLevel || 'full',
        ...exportOptions
      };

      // Call dashboard service
      const result = await this.dashboardService.generateDashboardData(address, options);

      // Update metrics
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, true, responseTime);

      if (this.config.enableLogging) {
        console.log(`[${new Date().toISOString()}] POST /api/v1/dashboard/export - ${address} - ${responseTime}ms`);
      }

      return {
        success: true,
        data: result.exportData,
        metadata: {
          requestId: this.generateRequestId(),
          responseTime,
          timestamp: getCurrentTimestamp()
        }
      };

    } catch (error) {
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, false, responseTime);

      console.error(`Error handling data export request for ${address}:`, formatError(error));
      
      return {
        success: false,
        error: {
          code: 'DATA_EXPORT_ERROR',
          message: error.message,
          timestamp: getCurrentTimestamp()
        }
      };
    } finally {
      this.activeConnections--;
    }
  }

  /**
   * Handle subscription requests
   * Implements Requirement 9.1: standardized endpoints
   */
  public async handleSubscription(
    address: string,
    callbackUrl: string,
    requestMetadata?: any
  ): Promise<any> {
    const startTime = getCurrentTimestamp();
    const endpointKey = 'POST:/api/v1/credit/subscribe';

    try {
      this.activeConnections++;

      // Validate input
      if (!address || !this.isValidAddress(address)) {
        throw new Error('Invalid address format');
      }

      if (!callbackUrl || !this.isValidUrl(callbackUrl)) {
        throw new Error('Invalid callback URL format');
      }

      // Create callback function for HTTP notifications
      const callback = async (update: any) => {
        try {
          // In a real implementation, this would make HTTP requests to the callback URL
          console.log(`Notifying ${callbackUrl} about update for ${address}:`, update);
        } catch (error) {
          console.error(`Failed to notify ${callbackUrl}:`, formatError(error));
        }
      };

      // Call integration API
      const result = await this.integrationAPI.subscribeToUpdates(address, callback);

      // Update metrics
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, true, responseTime);

      if (this.config.enableLogging) {
        console.log(`[${new Date().toISOString()}] POST /api/v1/credit/subscribe - ${address} - ${responseTime}ms`);
      }

      return {
        success: true,
        data: {
          subscriptionId: result.id,
          userAddress: result.userAddress,
          callbackUrl,
          createdAt: result.createdAt,
          isActive: result.isActive
        },
        metadata: {
          requestId: this.generateRequestId(),
          responseTime,
          timestamp: getCurrentTimestamp()
        }
      };

    } catch (error) {
      const responseTime = getCurrentTimestamp() - startTime;
      this.updateEndpointMetrics(endpointKey, false, responseTime);

      console.error(`Error handling subscription request for ${address}:`, formatError(error));
      
      return {
        success: false,
        error: {
          code: 'SUBSCRIPTION_ERROR',
          message: error.message,
          timestamp: getCurrentTimestamp()
        }
      };
    } finally {
      this.activeConnections--;
    }
  }

  /**
   * Get comprehensive health status
   * Implements Requirement 9.2: 99.9% uptime SLA monitoring
   */
  public getHealthStatus(): GatewayHealth {
    const now = getCurrentTimestamp();
    const uptime = ((now - this.startTime) / (60 * 60 * 1000)); // hours

    // Get service health
    const integrationAPIHealth = this.integrationAPI.getHealthStatus();

    // Calculate overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (integrationAPIHealth.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (integrationAPIHealth.status === 'degraded') {
      overallStatus = 'degraded';
    }

    // Check endpoint health
    const endpoints = Array.from(this.endpointMetrics.values());
    const unhealthyEndpoints = endpoints.filter(ep => {
      const errorRate = ep.totalRequests > 0 ? (ep.failedRequests / ep.totalRequests) * 100 : 0;
      return errorRate > 5 || ep.averageResponseTime > 2000; // 5% error rate or >2s response time
    });

    if (unhealthyEndpoints.length > 0) {
      overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
    }

    return {
      status: overallStatus,
      timestamp: now,
      uptime,
      services: {
        integrationAPI: integrationAPIHealth,
        dashboardService: {
          status: 'healthy', // Mock status
          cacheStats: {} // Would include actual cache stats
        }
      },
      endpoints,
      systemMetrics: {
        memoryUsage: process.memoryUsage?.()?.heapUsed || 0,
        cpuUsage: 0, // Would require actual CPU monitoring
        activeConnections: this.activeConnections
      }
    };
  }

  /**
   * Get detailed metrics
   */
  public getMetrics(): any {
    const health = this.getHealthStatus();
    const integrationMetrics = this.integrationAPI.getHealthStatus().metrics;

    return {
      gateway: {
        uptime: health.uptime,
        activeConnections: this.activeConnections,
        totalEndpoints: this.endpointMetrics.size
      },
      integration: integrationMetrics,
      endpoints: Array.from(this.endpointMetrics.values()),
      system: health.systemMetrics
    };
  }

  // Helper methods
  private updateEndpointMetrics(endpointKey: string, success: boolean, responseTime: number): void {
    const metrics = this.endpointMetrics.get(endpointKey);
    if (!metrics) return;

    metrics.totalRequests++;
    metrics.lastAccessed = getCurrentTimestamp();

    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Update average response time
    const totalResponseTime = metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime;
    metrics.averageResponseTime = totalResponseTime / metrics.totalRequests;
  }

  private isValidAddress(address: string): boolean {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private generateRequestId(): string {
    return `req_${getCurrentTimestamp()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}