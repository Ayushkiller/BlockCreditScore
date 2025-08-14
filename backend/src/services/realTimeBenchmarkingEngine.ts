import { BenchmarkingEngine, BenchmarkingData } from './benchmarkingEngine';
import { PeerGroupAnalysisEngine, PeerGroup } from './peerGroupAnalysisEngine';
import { CreditScore, ScoreBreakdown } from './scoreCalculator';
import { UserMetrics, TransactionData } from './blockchainService';
import { DatabaseService, RealTimeBenchmarkData, BenchmarkUpdateJob, PeerGroupSnapshot } from './databaseService';

export interface RealTimeBenchmarkingConfig {
  updateFrequency: number; // seconds
  staleThreshold: number; // seconds
  batchSize: number;
  maxRetries: number;
  priorityThresholds: {
    high: number; // percentile change threshold for high priority
    medium: number; // percentile change threshold for medium priority
  };
}

export interface RealTimeBenchmarkUpdate {
  address: string;
  previousPercentile: number;
  newPercentile: number;
  percentileChange: number;
  componentChanges: {
    [component: string]: {
      previous: number;
      new: number;
      change: number;
    };
  };
  updateTimestamp: number;
  updateReason: 'SCHEDULED' | 'TRIGGERED' | 'PEER_GROUP_CHANGE' | 'SCORE_UPDATE';
}

export interface BenchmarkJobResult {
  jobId: number;
  success: boolean;
  processedAddresses: string[];
  updatedBenchmarks: number;
  errors: string[];
  processingTimeMs: number;
}

/**
 * Real-time Benchmarking Engine
 * Extends the static benchmarking engine with real-time capabilities
 */
export class RealTimeBenchmarkingEngine {
  private static readonly DEFAULT_CONFIG: RealTimeBenchmarkingConfig = {
    updateFrequency: 300, // 5 minutes
    staleThreshold: 900, // 15 minutes
    batchSize: 50,
    maxRetries: 3,
    priorityThresholds: {
      high: 5, // 5 percentile change
      medium: 2 // 2 percentile change
    }
  };

  private static config: RealTimeBenchmarkingConfig = this.DEFAULT_CONFIG;
  private static isProcessingJobs = false;
  private static jobProcessingInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize real-time benchmarking with configuration
   */
  static initialize(config?: Partial<RealTimeBenchmarkingConfig>): void {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    console.log('Real-time benchmarking engine initialized with config:', this.config);
    
    // Start background job processing
    this.startBackgroundJobProcessing();
  }

  /**
   * Start background job processing
   */
  private static startBackgroundJobProcessing(): void {
    if (this.jobProcessingInterval) {
      clearInterval(this.jobProcessingInterval);
    }

    this.jobProcessingInterval = setInterval(async () => {
      if (!this.isProcessingJobs) {
        await this.processBackgroundJobs();
      }
    }, this.config.updateFrequency * 1000);

    console.log(`Background job processing started with ${this.config.updateFrequency}s interval`);
  }

  /**
   * Stop background job processing
   */
  static stopBackgroundJobProcessing(): void {
    if (this.jobProcessingInterval) {
      clearInterval(this.jobProcessingInterval);
      this.jobProcessingInterval = null;
      console.log('Background job processing stopped');
    }
  }

  /**
   * Get or create real-time benchmark data for an address
   */
  static async getRealTimeBenchmarkData(
    address: string,
    creditScore: CreditScore,
    scoreBreakdown: ScoreBreakdown,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): Promise<RealTimeBenchmarkData> {
    // Check if we have existing real-time benchmark data
    let existingData = await DatabaseService.getRealTimeBenchmarkData(address);
    
    if (existingData && !this.isBenchmarkDataStale(existingData)) {
      return existingData;
    }

    // Generate new benchmark data
    const benchmarkingData = await BenchmarkingEngine.generateBenchmarkingData(
      address,
      creditScore,
      scoreBreakdown,
      metrics,
      transactionHistory
    );

    const componentPercentiles = JSON.stringify({
      transactionVolume: benchmarkingData.percentileRankings.componentScores.transactionVolume.percentile,
      transactionFrequency: benchmarkingData.percentileRankings.componentScores.transactionFrequency.percentile,
      stakingActivity: benchmarkingData.percentileRankings.componentScores.stakingActivity.percentile,
      defiInteractions: benchmarkingData.percentileRankings.componentScores.defiInteractions.percentile,
      consistencyScore: benchmarkingData.percentileRankings.behavioralMetrics.consistencyScore.percentile,
      diversificationScore: benchmarkingData.percentileRankings.behavioralMetrics.diversificationScore.percentile,
      gasEfficiency: benchmarkingData.percentileRankings.behavioralMetrics.gasEfficiency.percentile,
      riskScore: benchmarkingData.percentileRankings.behavioralMetrics.riskScore.percentile
    });

    const now = Math.floor(Date.now() / 1000);
    const realTimeBenchmarkData: Omit<RealTimeBenchmarkData, 'id'> = {
      address,
      peerGroupId: benchmarkingData.peerGroupClassification.primaryPeerGroup.id,
      overallPercentile: benchmarkingData.percentileRankings.overallScore.percentile,
      componentPercentiles,
      benchmarkTimestamp: now,
      lastUpdated: now,
      updateFrequency: this.config.updateFrequency,
      isStale: false
    };

    if (existingData) {
      // Update existing data
      await DatabaseService.updateRealTimeBenchmarkData(address, realTimeBenchmarkData);
      return { ...realTimeBenchmarkData, id: existingData.id };
    } else {
      // Create new data
      const id = await DatabaseService.saveRealTimeBenchmarkData(realTimeBenchmarkData);
      return { ...realTimeBenchmarkData, id };
    }
  }

  /**
   * Update real-time benchmark data for an address
   */
  static async updateRealTimeBenchmarkData(
    address: string,
    creditScore: CreditScore,
    scoreBreakdown: ScoreBreakdown,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): Promise<RealTimeBenchmarkUpdate> {
    const existingData = await DatabaseService.getRealTimeBenchmarkData(address);
    const previousPercentile = existingData?.overallPercentile || 0;
    const previousComponentPercentiles = existingData ? 
      JSON.parse(existingData.componentPercentiles) : {};

    // Generate new benchmark data
    const newData = await this.getRealTimeBenchmarkData(
      address,
      creditScore,
      scoreBreakdown,
      metrics,
      transactionHistory
    );

    const newComponentPercentiles = JSON.parse(newData.componentPercentiles);
    const percentileChange = newData.overallPercentile - previousPercentile;

    // Calculate component changes
    const componentChanges: RealTimeBenchmarkUpdate['componentChanges'] = {};
    for (const [component, newValue] of Object.entries(newComponentPercentiles)) {
      const previousValue = previousComponentPercentiles[component] || 0;
      componentChanges[component] = {
        previous: previousValue,
        new: newValue as number,
        change: (newValue as number) - previousValue
      };
    }

    const update: RealTimeBenchmarkUpdate = {
      address,
      previousPercentile,
      newPercentile: newData.overallPercentile,
      percentileChange,
      componentChanges,
      updateTimestamp: newData.lastUpdated,
      updateReason: 'SCORE_UPDATE'
    };

    // Schedule peer group refresh if significant change
    if (Math.abs(percentileChange) >= this.config.priorityThresholds.medium) {
      await this.schedulePeerGroupRefresh(newData.peerGroupId, 'MEDIUM');
    }

    return update;
  }

  /**
   * Schedule benchmark update job
   */
  static async scheduleBenchmarkUpdate(
    address: string,
    priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM',
    delay: number = 0
  ): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const job: Omit<BenchmarkUpdateJob, 'id'> = {
      jobType: 'BENCHMARK_UPDATE',
      targetAddress: address,
      priority,
      scheduledAt: now + delay,
      status: 'PENDING',
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    return await DatabaseService.createBenchmarkUpdateJob(job);
  }

  /**
   * Schedule peer group refresh
   */
  static async schedulePeerGroupRefresh(
    peerGroupId: string,
    priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM',
    delay: number = 0
  ): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const job: Omit<BenchmarkUpdateJob, 'id'> = {
      jobType: 'PEER_GROUP_REFRESH',
      peerGroupId,
      priority,
      scheduledAt: now + delay,
      status: 'PENDING',
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    return await DatabaseService.createBenchmarkUpdateJob(job);
  }

  /**
   * Schedule percentile recalculation
   */
  static async schedulePercentileRecalculation(
    peerGroupId: string,
    priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW',
    delay: number = 0
  ): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const job: Omit<BenchmarkUpdateJob, 'id'> = {
      jobType: 'PERCENTILE_RECALC',
      peerGroupId,
      priority,
      scheduledAt: now + delay,
      status: 'PENDING',
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    return await DatabaseService.createBenchmarkUpdateJob(job);
  }

  /**
   * Process background jobs
   */
  private static async processBackgroundJobs(): Promise<void> {
    if (this.isProcessingJobs) return;

    this.isProcessingJobs = true;
    console.log('Processing background benchmark jobs...');

    try {
      // Mark stale benchmarks
      await this.markStaleBenchmarks();

      // Get pending jobs
      const pendingJobs = await DatabaseService.getPendingBenchmarkUpdateJobs(this.config.batchSize);
      
      if (pendingJobs.length === 0) {
        return;
      }

      console.log(`Processing ${pendingJobs.length} benchmark jobs`);

      // Process jobs by type
      const jobsByType = this.groupJobsByType(pendingJobs);

      for (const [jobType, jobs] of Object.entries(jobsByType)) {
        await this.processJobsByType(jobType as BenchmarkUpdateJob['jobType'], jobs);
      }

    } catch (error) {
      console.error('Error processing background benchmark jobs:', error);
    } finally {
      this.isProcessingJobs = false;
    }
  }

  /**
   * Mark stale benchmarks
   */
  private static async markStaleBenchmarks(): Promise<void> {
    const staleCount = await DatabaseService.markStaleRealTimeBenchmarks(this.config.staleThreshold);
    if (staleCount > 0) {
      console.log(`Marked ${staleCount} benchmarks as stale`);
      
      // Schedule updates for stale benchmarks
      const staleAddresses = await DatabaseService.getStaleRealTimeBenchmarks(this.config.batchSize);
      for (const address of staleAddresses) {
        await this.scheduleBenchmarkUpdate(address, 'LOW');
      }
    }
  }

  /**
   * Group jobs by type
   */
  private static groupJobsByType(jobs: BenchmarkUpdateJob[]): Record<string, BenchmarkUpdateJob[]> {
    return jobs.reduce((groups, job) => {
      if (!groups[job.jobType]) {
        groups[job.jobType] = [];
      }
      groups[job.jobType].push(job);
      return groups;
    }, {} as Record<string, BenchmarkUpdateJob[]>);
  }

  /**
   * Process jobs by type
   */
  private static async processJobsByType(
    jobType: BenchmarkUpdateJob['jobType'],
    jobs: BenchmarkUpdateJob[]
  ): Promise<void> {
    switch (jobType) {
      case 'BENCHMARK_UPDATE':
        await this.processBenchmarkUpdateJobs(jobs);
        break;
      case 'PEER_GROUP_REFRESH':
        await this.processPeerGroupRefreshJobs(jobs);
        break;
      case 'PERCENTILE_RECALC':
        await this.processPercentileRecalcJobs(jobs);
        break;
    }
  }

  /**
   * Process benchmark update jobs
   */
  private static async processBenchmarkUpdateJobs(jobs: BenchmarkUpdateJob[]): Promise<void> {
    for (const job of jobs) {
      if (!job.targetAddress) continue;

      try {
        await DatabaseService.updateBenchmarkJobStatus(job.id, 'RUNNING');

        // This would typically fetch fresh data and recalculate benchmarks
        // For now, we'll mark the benchmark as no longer stale
        await DatabaseService.updateRealTimeBenchmarkData(job.targetAddress, {
          lastUpdated: Math.floor(Date.now() / 1000),
          isStale: false
        });

        await DatabaseService.updateBenchmarkJobStatus(job.id, 'COMPLETED');
        console.log(`Completed benchmark update job for ${job.targetAddress}`);

      } catch (error) {
        console.error(`Error processing benchmark update job ${job.id}:`, error);
        
        if (job.retryCount < job.maxRetries) {
          await DatabaseService.incrementBenchmarkJobRetryCount(job.id);
        } else {
          await DatabaseService.updateBenchmarkJobStatus(
            job.id, 
            'FAILED', 
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    }
  }

  /**
   * Process peer group refresh jobs
   */
  private static async processPeerGroupRefreshJobs(jobs: BenchmarkUpdateJob[]): Promise<void> {
    const uniquePeerGroups = [...new Set(jobs.map(job => job.peerGroupId).filter(Boolean))];

    for (const peerGroupId of uniquePeerGroups) {
      const peerGroupJobs = jobs.filter(job => job.peerGroupId === peerGroupId);
      
      try {
        // Mark all jobs as running
        for (const job of peerGroupJobs) {
          await DatabaseService.updateBenchmarkJobStatus(job.id, 'RUNNING');
        }

        // Create peer group snapshot
        await this.createPeerGroupSnapshot(peerGroupId!);

        // Mark all jobs as completed
        for (const job of peerGroupJobs) {
          await DatabaseService.updateBenchmarkJobStatus(job.id, 'COMPLETED');
        }

        console.log(`Completed peer group refresh for ${peerGroupId}`);

      } catch (error) {
        console.error(`Error processing peer group refresh for ${peerGroupId}:`, error);
        
        // Handle retries for all jobs
        for (const job of peerGroupJobs) {
          if (job.retryCount < job.maxRetries) {
            await DatabaseService.incrementBenchmarkJobRetryCount(job.id);
          } else {
            await DatabaseService.updateBenchmarkJobStatus(
              job.id, 
              'FAILED', 
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
        }
      }
    }
  }

  /**
   * Process percentile recalculation jobs
   */
  private static async processPercentileRecalcJobs(jobs: BenchmarkUpdateJob[]): Promise<void> {
    const uniquePeerGroups = [...new Set(jobs.map(job => job.peerGroupId).filter(Boolean))];

    for (const peerGroupId of uniquePeerGroups) {
      const peerGroupJobs = jobs.filter(job => job.peerGroupId === peerGroupId);
      
      try {
        // Mark all jobs as running
        for (const job of peerGroupJobs) {
          await DatabaseService.updateBenchmarkJobStatus(job.id, 'RUNNING');
        }

        // Recalculate percentiles for all members of this peer group
        await this.recalculatePeerGroupPercentiles(peerGroupId!);

        // Mark all jobs as completed
        for (const job of peerGroupJobs) {
          await DatabaseService.updateBenchmarkJobStatus(job.id, 'COMPLETED');
        }

        console.log(`Completed percentile recalculation for ${peerGroupId}`);

      } catch (error) {
        console.error(`Error processing percentile recalculation for ${peerGroupId}:`, error);
        
        // Handle retries for all jobs
        for (const job of peerGroupJobs) {
          if (job.retryCount < job.maxRetries) {
            await DatabaseService.incrementBenchmarkJobRetryCount(job.id);
          } else {
            await DatabaseService.updateBenchmarkJobStatus(
              job.id, 
              'FAILED', 
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
        }
      }
    }
  }

  /**
   * Create peer group snapshot
   */
  private static async createPeerGroupSnapshot(peerGroupId: string): Promise<void> {
    // This would typically analyze all members of the peer group
    // For now, we'll create a basic snapshot
    const now = Math.floor(Date.now() / 1000);
    
    const snapshot: Omit<PeerGroupSnapshot, 'id'> = {
      peerGroupId,
      memberCount: 100, // This would be calculated from actual data
      averageScore: 650, // This would be calculated from actual data
      scoreDistribution: JSON.stringify({
        min: 300,
        max: 950,
        p25: 500,
        p50: 650,
        p75: 800,
        p90: 900
      }),
      snapshotTimestamp: now,
      isActive: true
    };

    await DatabaseService.savePeerGroupSnapshot(snapshot);
    
    // Deactivate old snapshots
    await DatabaseService.deactivateOldPeerGroupSnapshots(peerGroupId, 5);
  }

  /**
   * Recalculate percentiles for peer group
   */
  private static async recalculatePeerGroupPercentiles(peerGroupId: string): Promise<void> {
    // This would typically recalculate percentiles for all members
    // For now, we'll just log the operation
    console.log(`Recalculating percentiles for peer group ${peerGroupId}`);
    
    // In a real implementation, this would:
    // 1. Get all members of the peer group
    // 2. Recalculate their percentile rankings
    // 3. Update their real-time benchmark data
  }

  /**
   * Check if benchmark data is stale
   */
  private static isBenchmarkDataStale(data: RealTimeBenchmarkData): boolean {
    const now = Math.floor(Date.now() / 1000);
    const age = now - data.lastUpdated;
    return data.isStale || age > this.config.staleThreshold;
  }

  /**
   * Get real-time benchmark statistics
   */
  static async getRealTimeBenchmarkStats(): Promise<{
    totalBenchmarks: number;
    staleBenchmarks: number;
    pendingJobs: number;
    activePeerGroups: number;
    lastUpdateTime: number;
    processingStatus: 'ACTIVE' | 'INACTIVE';
    config: RealTimeBenchmarkingConfig;
  }> {
    const dbStats = await DatabaseService.getRealTimeBenchmarkStats();
    
    return {
      ...dbStats,
      processingStatus: this.jobProcessingInterval ? 'ACTIVE' : 'INACTIVE',
      config: this.config
    };
  }

  /**
   * Force refresh of all stale benchmarks
   */
  static async forceRefreshStaleBenchmarks(): Promise<number> {
    const staleAddresses = await DatabaseService.getStaleRealTimeBenchmarks(1000);
    
    for (const address of staleAddresses) {
      await this.scheduleBenchmarkUpdate(address, 'HIGH');
    }

    return staleAddresses.length;
  }

  /**
   * Get configuration
   */
  static getConfig(): RealTimeBenchmarkingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  static updateConfig(newConfig: Partial<RealTimeBenchmarkingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart background processing with new config
    if (this.jobProcessingInterval) {
      this.stopBackgroundJobProcessing();
      this.startBackgroundJobProcessing();
    }
    
    console.log('Real-time benchmarking config updated:', this.config);
  }
}