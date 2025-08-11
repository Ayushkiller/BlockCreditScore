/**
 * Real Performance Monitoring Service
 * Tracks actual API call latency, blockchain query times, transaction processing rates,
 * error rates, and provides real-time performance metrics and alerting
 */

export interface PerformanceMetric {
  timestamp: number;
  service: string;
  operation: string;
  duration: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface ThroughputMetric {
  timestamp: number;
  service: string;
  operation: string;
  count: number;
  timeWindow: number; // in milliseconds
  rate: number; // operations per second
}

export interface ErrorRateMetric {
  timestamp: number;
  service: string;
  operation: string;
  totalRequests: number;
  errorCount: number;
  errorRate: number; // percentage
  errorTypes: Record<string, number>;
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'latency' | 'throughput' | 'error_rate' | 'availability';
  service: string;
  operation?: string;
  message: string;
  currentValue: number;
  threshold: number;
  metadata?: Record<string, any>;
}

export interface SystemBottleneck {
  service: string;
  operation: string;
  bottleneckType: 'latency' | 'throughput' | 'error_rate';
  severity: number; // 0-1 scale
  impact: string;
  recommendation: string;
  affectedOperations: string[];
}

export interface PerformanceThresholds {
  latency: {
    warning: number; // milliseconds
    critical: number; // milliseconds
  };
  throughput: {
    warning: number; // operations per second
    critical: number; // operations per second
  };
  errorRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
  availability: {
    warning: number; // percentage
    critical: number; // percentage
  };
}

export interface PerformanceSummary {
  timestamp: number;
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [serviceName: string]: {
      health: 'healthy' | 'degraded' | 'unhealthy';
      avgLatency: number;
      throughput: number;
      errorRate: number;
      availability: number;
      activeAlerts: number;
    };
  };
  activeAlerts: PerformanceAlert[];
  bottlenecks: SystemBottleneck[];
  recommendations: string[];
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private throughputMetrics: ThroughputMetric[] = [];
  private errorRateMetrics: ErrorRateMetric[] = [];
  private activeAlerts: PerformanceAlert[] = [];
  private alertCallbacks: Set<(alert: PerformanceAlert) => void> = new Set();
  
  // Performance thresholds for different services
  private thresholds: Record<string, PerformanceThresholds> = {
    'blockchain': {
      latency: { warning: 2000, critical: 5000 },
      throughput: { warning: 10, critical: 5 },
      errorRate: { warning: 5, critical: 15 },
      availability: { warning: 95, critical: 90 }
    },
    'price-feeds': {
      latency: { warning: 1000, critical: 3000 },
      throughput: { warning: 50, critical: 20 },
      errorRate: { warning: 3, critical: 10 },
      availability: { warning: 98, critical: 95 }
    },
    'market-data': {
      latency: { warning: 1500, critical: 4000 },
      throughput: { warning: 30, critical: 10 },
      errorRate: { warning: 5, critical: 12 },
      availability: { warning: 96, critical: 92 }
    },
    'credit-scoring': {
      latency: { warning: 3000, critical: 8000 },
      throughput: { warning: 20, critical: 8 },
      errorRate: { warning: 2, critical: 8 },
      availability: { warning: 99, critical: 97 }
    }
  };

  // Time windows for different metric calculations (in milliseconds)
  private readonly TIME_WINDOWS = {
    REAL_TIME: 60 * 1000,      // 1 minute
    SHORT_TERM: 5 * 60 * 1000,  // 5 minutes
    MEDIUM_TERM: 30 * 60 * 1000, // 30 minutes
    LONG_TERM: 60 * 60 * 1000   // 1 hour
  };

  constructor() {
    this.startPerformanceAnalysis();
    this.startMetricCleanup();
  }

  /**
   * Record a performance metric for an operation
   */
  recordMetric(
    service: string,
    operation: string,
    duration: number,
    success: boolean,
    errorCode?: string,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      service,
      operation,
      duration,
      success,
      errorCode,
      errorMessage,
      metadata
    };

    this.metrics.push(metric);
    this.updateThroughputMetrics(service, operation);
    this.updateErrorRateMetrics(service, operation, success, errorCode);
    this.checkThresholds(service, operation, metric);
  }

  /**
   * Start an operation timer
   */
  startTimer(service: string, operation: string, metadata?: Record<string, any>): () => void {
    const startTime = Date.now();
    
    return (success: boolean = true, errorCode?: string, errorMessage?: string) => {
      const duration = Date.now() - startTime;
      this.recordMetric(service, operation, duration, success, errorCode, errorMessage, metadata);
    };
  }

  /**
   * Wrap a function with performance monitoring
   */
  monitor<T>(
    service: string,
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timer = this.startTimer(service, operation, metadata);
    
    return fn()
      .then(result => {
        timer(true);
        return result;
      })
      .catch(error => {
        timer(false, error.code || 'UNKNOWN_ERROR', error.message);
        throw error;
      });
  }

  /**
   * Update throughput metrics
   */
  private updateThroughputMetrics(service: string, operation: string): void {
    const now = Date.now();
    const timeWindow = this.TIME_WINDOWS.REAL_TIME;
    const windowStart = now - timeWindow;

    // Count operations in the current time window
    const operationsInWindow = this.metrics.filter(m => 
      m.service === service &&
      m.operation === operation &&
      m.timestamp >= windowStart
    ).length;

    const rate = operationsInWindow / (timeWindow / 1000); // operations per second

    const throughputMetric: ThroughputMetric = {
      timestamp: now,
      service,
      operation,
      count: operationsInWindow,
      timeWindow,
      rate
    };

    this.throughputMetrics.push(throughputMetric);
  }

  /**
   * Update error rate metrics
   */
  private updateErrorRateMetrics(
    service: string,
    operation: string,
    success: boolean,
    errorCode?: string
  ): void {
    const now = Date.now();
    const timeWindow = this.TIME_WINDOWS.SHORT_TERM;
    const windowStart = now - timeWindow;

    // Get all operations in the time window
    const operationsInWindow = this.metrics.filter(m => 
      m.service === service &&
      m.operation === operation &&
      m.timestamp >= windowStart
    );

    const totalRequests = operationsInWindow.length;
    const errorCount = operationsInWindow.filter(m => !m.success).length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Count error types
    const errorTypes: Record<string, number> = {};
    operationsInWindow
      .filter(m => !m.success && m.errorCode)
      .forEach(m => {
        errorTypes[m.errorCode!] = (errorTypes[m.errorCode!] || 0) + 1;
      });

    const errorRateMetric: ErrorRateMetric = {
      timestamp: now,
      service,
      operation,
      totalRequests,
      errorCount,
      errorRate,
      errorTypes
    };

    this.errorRateMetrics.push(errorRateMetric);
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkThresholds(service: string, operation: string, metric: PerformanceMetric): void {
    const serviceThresholds = this.thresholds[service];
    if (!serviceThresholds) return;

    // Check latency threshold
    if (metric.duration > serviceThresholds.latency.critical) {
      this.generateAlert('critical', 'latency', service, operation, 
        `Critical latency detected: ${metric.duration}ms`, 
        metric.duration, serviceThresholds.latency.critical);
    } else if (metric.duration > serviceThresholds.latency.warning) {
      this.generateAlert('high', 'latency', service, operation,
        `High latency detected: ${metric.duration}ms`,
        metric.duration, serviceThresholds.latency.warning);
    }

    // Check error rate threshold
    const recentErrorRate = this.getRecentErrorRate(service, operation);
    if (recentErrorRate > serviceThresholds.errorRate.critical) {
      this.generateAlert('critical', 'error_rate', service, operation,
        `Critical error rate: ${recentErrorRate.toFixed(1)}%`,
        recentErrorRate, serviceThresholds.errorRate.critical);
    } else if (recentErrorRate > serviceThresholds.errorRate.warning) {
      this.generateAlert('high', 'error_rate', service, operation,
        `High error rate: ${recentErrorRate.toFixed(1)}%`,
        recentErrorRate, serviceThresholds.errorRate.warning);
    }

    // Check throughput threshold
    const recentThroughput = this.getRecentThroughput(service, operation);
    if (recentThroughput < serviceThresholds.throughput.critical) {
      this.generateAlert('critical', 'throughput', service, operation,
        `Critical low throughput: ${recentThroughput.toFixed(1)} ops/sec`,
        recentThroughput, serviceThresholds.throughput.critical);
    } else if (recentThroughput < serviceThresholds.throughput.warning) {
      this.generateAlert('medium', 'throughput', service, operation,
        `Low throughput: ${recentThroughput.toFixed(1)} ops/sec`,
        recentThroughput, serviceThresholds.throughput.warning);
    }
  }

  /**
   * Generate a performance alert
   */
  private generateAlert(
    severity: PerformanceAlert['severity'],
    type: PerformanceAlert['type'],
    service: string,
    operation: string,
    message: string,
    currentValue: number,
    threshold: number,
    metadata?: Record<string, any>
  ): void {
    // Check if similar alert already exists (avoid spam)
    const existingAlert = this.activeAlerts.find(alert =>
      alert.service === service &&
      alert.operation === operation &&
      alert.type === type &&
      Date.now() - alert.timestamp < 5 * 60 * 1000 // 5 minutes
    );

    if (existingAlert) return;

    const alert: PerformanceAlert = {
      id: `${service}-${operation}-${type}-${Date.now()}`,
      timestamp: Date.now(),
      severity,
      type,
      service,
      operation,
      message,
      currentValue,
      threshold,
      metadata
    };

    this.activeAlerts.push(alert);
    this.notifyAlertCallbacks(alert);

    // Auto-resolve alerts after 30 minutes
    setTimeout(() => {
      this.resolveAlert(alert.id);
    }, 30 * 60 * 1000);
  }

  /**
   * Get recent error rate for a service/operation
   */
  private getRecentErrorRate(service: string, operation: string): number {
    const now = Date.now();
    const windowStart = now - this.TIME_WINDOWS.SHORT_TERM;

    const recentMetrics = this.metrics.filter(m =>
      m.service === service &&
      m.operation === operation &&
      m.timestamp >= windowStart
    );

    if (recentMetrics.length === 0) return 0;

    const errorCount = recentMetrics.filter(m => !m.success).length;
    return (errorCount / recentMetrics.length) * 100;
  }

  /**
   * Get recent throughput for a service/operation
   */
  private getRecentThroughput(service: string, operation: string): number {
    const now = Date.now();
    const windowStart = now - this.TIME_WINDOWS.REAL_TIME;

    const recentMetrics = this.metrics.filter(m =>
      m.service === service &&
      m.operation === operation &&
      m.timestamp >= windowStart
    );

    return recentMetrics.length / (this.TIME_WINDOWS.REAL_TIME / 1000);
  }

  /**
   * Get average latency for a service/operation
   */
  getAverageLatency(service: string, operation?: string, timeWindow: number = this.TIME_WINDOWS.SHORT_TERM): number {
    const now = Date.now();
    const windowStart = now - timeWindow;

    const relevantMetrics = this.metrics.filter(m =>
      m.service === service &&
      (operation ? m.operation === operation : true) &&
      m.timestamp >= windowStart &&
      m.success
    );

    if (relevantMetrics.length === 0) return 0;

    const totalLatency = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalLatency / relevantMetrics.length;
  }

  /**
   * Get throughput statistics
   */
  getThroughputStats(service: string, operation?: string, timeWindow: number = this.TIME_WINDOWS.SHORT_TERM): {
    current: number;
    average: number;
    peak: number;
  } {
    const now = Date.now();
    const windowStart = now - timeWindow;

    const relevantThroughputMetrics = this.throughputMetrics.filter(m =>
      m.service === service &&
      (operation ? m.operation === operation : true) &&
      m.timestamp >= windowStart
    );

    if (relevantThroughputMetrics.length === 0) {
      return { current: 0, average: 0, peak: 0 };
    }

    const rates = relevantThroughputMetrics.map(m => m.rate);
    const current = rates[rates.length - 1] || 0;
    const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const peak = Math.max(...rates);

    return { current, average, peak };
  }

  /**
   * Get error rate statistics
   */
  getErrorRateStats(service: string, operation?: string, timeWindow: number = this.TIME_WINDOWS.SHORT_TERM): {
    current: number;
    average: number;
    peak: number;
    errorTypes: Record<string, number>;
  } {
    const now = Date.now();
    const windowStart = now - timeWindow;

    const relevantErrorMetrics = this.errorRateMetrics.filter(m =>
      m.service === service &&
      (operation ? m.operation === operation : true) &&
      m.timestamp >= windowStart
    );

    if (relevantErrorMetrics.length === 0) {
      return { current: 0, average: 0, peak: 0, errorTypes: {} };
    }

    const errorRates = relevantErrorMetrics.map(m => m.errorRate);
    const current = errorRates[errorRates.length - 1] || 0;
    const average = errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length;
    const peak = Math.max(...errorRates);

    // Aggregate error types
    const errorTypes: Record<string, number> = {};
    relevantErrorMetrics.forEach(m => {
      Object.entries(m.errorTypes).forEach(([type, count]) => {
        errorTypes[type] = (errorTypes[type] || 0) + count;
      });
    });

    return { current, average, peak, errorTypes };
  }

  /**
   * Get system bottlenecks
   */
  getSystemBottlenecks(): SystemBottleneck[] {
    const bottlenecks: SystemBottleneck[] = [];
    const services = [...new Set(this.metrics.map(m => m.service))];

    services.forEach(service => {
      const operations = [...new Set(this.metrics.filter(m => m.service === service).map(m => m.operation))];
      
      operations.forEach(operation => {
        const avgLatency = this.getAverageLatency(service, operation);
        const throughputStats = this.getThroughputStats(service, operation);
        const errorRateStats = this.getErrorRateStats(service, operation);
        
        const serviceThresholds = this.thresholds[service];
        if (!serviceThresholds) return;

        // Check for latency bottlenecks
        if (avgLatency > serviceThresholds.latency.warning) {
          const severity = avgLatency > serviceThresholds.latency.critical ? 0.9 : 0.6;
          bottlenecks.push({
            service,
            operation,
            bottleneckType: 'latency',
            severity,
            impact: `High response times affecting user experience`,
            recommendation: `Optimize ${operation} operation or scale ${service} service`,
            affectedOperations: [operation]
          });
        }

        // Check for throughput bottlenecks
        if (throughputStats.current < serviceThresholds.throughput.warning) {
          const severity = throughputStats.current < serviceThresholds.throughput.critical ? 0.8 : 0.5;
          bottlenecks.push({
            service,
            operation,
            bottleneckType: 'throughput',
            severity,
            impact: `Low processing capacity limiting system performance`,
            recommendation: `Scale ${service} service or optimize ${operation} processing`,
            affectedOperations: [operation]
          });
        }

        // Check for error rate bottlenecks
        if (errorRateStats.current > serviceThresholds.errorRate.warning) {
          const severity = errorRateStats.current > serviceThresholds.errorRate.critical ? 0.95 : 0.7;
          bottlenecks.push({
            service,
            operation,
            bottleneckType: 'error_rate',
            severity,
            impact: `High error rates causing service degradation`,
            recommendation: `Investigate and fix errors in ${operation} operation`,
            affectedOperations: [operation]
          });
        }
      });
    });

    return bottlenecks.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): PerformanceSummary {
    const services = [...new Set(this.metrics.map(m => m.service))];
    const serviceStats: PerformanceSummary['services'] = {};
    
    let overallHealthScore = 1.0;

    services.forEach(service => {
      const avgLatency = this.getAverageLatency(service);
      const throughputStats = this.getThroughputStats(service);
      const errorRateStats = this.getErrorRateStats(service);
      
      // Calculate availability (percentage of successful requests)
      const now = Date.now();
      const windowStart = now - this.TIME_WINDOWS.MEDIUM_TERM;
      const recentMetrics = this.metrics.filter(m =>
        m.service === service && m.timestamp >= windowStart
      );
      const availability = recentMetrics.length > 0 
        ? (recentMetrics.filter(m => m.success).length / recentMetrics.length) * 100
        : 100;

      // Count active alerts for this service
      const activeAlerts = this.activeAlerts.filter(alert => 
        alert.service === service && Date.now() - alert.timestamp < 30 * 60 * 1000
      ).length;

      // Determine health status
      const serviceThresholds = this.thresholds[service];
      let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (serviceThresholds) {
        if (avgLatency > serviceThresholds.latency.critical ||
            throughputStats.current < serviceThresholds.throughput.critical ||
            errorRateStats.current > serviceThresholds.errorRate.critical ||
            availability < serviceThresholds.availability.critical) {
          health = 'unhealthy';
          overallHealthScore *= 0.3;
        } else if (avgLatency > serviceThresholds.latency.warning ||
                   throughputStats.current < serviceThresholds.throughput.warning ||
                   errorRateStats.current > serviceThresholds.errorRate.warning ||
                   availability < serviceThresholds.availability.warning) {
          health = 'degraded';
          overallHealthScore *= 0.7;
        }
      }

      serviceStats[service] = {
        health,
        avgLatency,
        throughput: throughputStats.current,
        errorRate: errorRateStats.current,
        availability,
        activeAlerts
      };
    });

    const overallHealth: PerformanceSummary['overallHealth'] = 
      overallHealthScore > 0.8 ? 'healthy' :
      overallHealthScore > 0.5 ? 'degraded' : 'unhealthy';

    const bottlenecks = this.getSystemBottlenecks();
    const recommendations = this.generateRecommendations(serviceStats, bottlenecks);

    return {
      timestamp: Date.now(),
      overallHealth,
      services: serviceStats,
      activeAlerts: this.activeAlerts.filter(alert => 
        Date.now() - alert.timestamp < 30 * 60 * 1000
      ),
      bottlenecks,
      recommendations
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    serviceStats: PerformanceSummary['services'],
    bottlenecks: SystemBottleneck[]
  ): string[] {
    const recommendations: string[] = [];

    // High-level recommendations based on bottlenecks
    if (bottlenecks.length > 0) {
      const criticalBottlenecks = bottlenecks.filter(b => b.severity > 0.8);
      if (criticalBottlenecks.length > 0) {
        recommendations.push(`Address ${criticalBottlenecks.length} critical performance bottlenecks immediately`);
      }
    }

    // Service-specific recommendations
    Object.entries(serviceStats).forEach(([service, stats]) => {
      if (stats.health === 'unhealthy') {
        recommendations.push(`${service} service requires immediate attention - consider scaling or optimization`);
      } else if (stats.health === 'degraded') {
        if (stats.avgLatency > 2000) {
          recommendations.push(`Optimize ${service} response times - current average: ${stats.avgLatency.toFixed(0)}ms`);
        }
        if (stats.errorRate > 5) {
          recommendations.push(`Investigate ${service} errors - current rate: ${stats.errorRate.toFixed(1)}%`);
        }
        if (stats.throughput < 10) {
          recommendations.push(`Scale ${service} to improve throughput - current: ${stats.throughput.toFixed(1)} ops/sec`);
        }
      }
    });

    // General recommendations
    const totalActiveAlerts = Object.values(serviceStats).reduce((sum, stats) => sum + stats.activeAlerts, 0);
    if (totalActiveAlerts > 5) {
      recommendations.push(`Review and resolve ${totalActiveAlerts} active performance alerts`);
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Subscribe to performance alerts
   */
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Notify alert callbacks
   */
  private notifyAlertCallbacks(alert: PerformanceAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    this.activeAlerts = this.activeAlerts.filter(alert => alert.id !== alertId);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.activeAlerts.filter(alert => 
      Date.now() - alert.timestamp < 30 * 60 * 1000
    );
  }

  /**
   * Start periodic performance analysis
   */
  private startPerformanceAnalysis(): void {
    setInterval(() => {
      // Analyze trends and generate proactive alerts
      this.analyzePerformanceTrends();
    }, 60 * 1000); // Every minute
  }

  /**
   * Analyze performance trends
   */
  private analyzePerformanceTrends(): void {
    const services = [...new Set(this.metrics.map(m => m.service))];
    
    services.forEach(service => {
      const operations = [...new Set(this.metrics.filter(m => m.service === service).map(m => m.operation))];
      
      operations.forEach(operation => {
        // Check for degrading performance trends
        const recentLatency = this.getAverageLatency(service, operation, this.TIME_WINDOWS.SHORT_TERM);
        const historicalLatency = this.getAverageLatency(service, operation, this.TIME_WINDOWS.MEDIUM_TERM);
        
        if (recentLatency > historicalLatency * 1.5 && recentLatency > 1000) {
          this.generateAlert('medium', 'latency', service, operation,
            `Performance degradation detected: latency increased by ${((recentLatency / historicalLatency - 1) * 100).toFixed(1)}%`,
            recentLatency, historicalLatency);
        }
      });
    });
  }

  /**
   * Start metric cleanup to prevent memory leaks
   */
  private startMetricCleanup(): void {
    setInterval(() => {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
      this.throughputMetrics = this.throughputMetrics.filter(m => m.timestamp > cutoffTime);
      this.errorRateMetrics = this.errorRateMetrics.filter(m => m.timestamp > cutoffTime);
      this.activeAlerts = this.activeAlerts.filter(a => Date.now() - a.timestamp < 30 * 60 * 1000);
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Export performance data
   */
  exportPerformanceData(timeWindow: number = this.TIME_WINDOWS.LONG_TERM): {
    metrics: PerformanceMetric[];
    throughput: ThroughputMetric[];
    errorRates: ErrorRateMetric[];
    alerts: PerformanceAlert[];
    summary: PerformanceSummary;
  } {
    const cutoffTime = Date.now() - timeWindow;
    
    return {
      metrics: this.metrics.filter(m => m.timestamp > cutoffTime),
      throughput: this.throughputMetrics.filter(m => m.timestamp > cutoffTime),
      errorRates: this.errorRateMetrics.filter(m => m.timestamp > cutoffTime),
      alerts: this.activeAlerts,
      summary: this.getPerformanceSummary()
    };
  }
}

export default PerformanceMonitoringService;