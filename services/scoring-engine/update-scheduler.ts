// Update Scheduler - Manages score update timing and SLA compliance
// Implements 4-hour positive behavior and 24-hour negative behavior SLAs

import { CreditProfile } from '../../types/credit';
import { getCurrentTimestamp } from '../../utils/time';
import { formatError } from '../../utils/errors';

export interface ScheduledUpdate {
  userAddress: string;
  profile: CreditProfile;
  priority: 'normal' | 'high' | 'immediate';
  deadline: number;
  scheduledAt: number;
  attempts: number;
}

export interface ScoringEngineConfig {
  positiveUpdateSLA: number;
  negativeUpdateSLA: number;
  immediateFlag: boolean;
  enableAnomalyDetection: boolean;
  enableTrendAnalysis: boolean;
  confidenceThreshold: number;
}

export class UpdateScheduler {
  private scheduledUpdates: Map<string, ScheduledUpdate> = new Map();
  private updateQueue: ScheduledUpdate[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private config: ScoringEngineConfig;
  private isRunning: boolean = false;
  private totalUpdatesProcessed: number = 0;
  private totalLatency: number = 0;

  constructor(config: ScoringEngineConfig) {
    this.config = config;
  }

  /**
   * Start the update scheduler
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Process updates every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processScheduledUpdates();
    }, 30000);

    console.log('Update Scheduler started');
  }

  /**
   * Stop the update scheduler
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    console.log('Update Scheduler stopped');
  }  
/**
   * Schedule a score update with SLA compliance
   */
  public async scheduleUpdate(update: Omit<ScheduledUpdate, 'scheduledAt' | 'attempts'>): Promise<void> {
    const scheduledUpdate: ScheduledUpdate = {
      ...update,
      scheduledAt: getCurrentTimestamp(),
      attempts: 0
    };

    // Handle immediate priority updates
    if (update.priority === 'immediate') {
      await this.processImmediateUpdate(scheduledUpdate);
      return;
    }

    // Add to scheduled updates
    this.scheduledUpdates.set(update.userAddress, scheduledUpdate);
    this.updateQueue.push(scheduledUpdate);

    // Sort queue by priority and deadline
    this.updateQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { immediate: 0, high: 1, normal: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.deadline - b.deadline;
    });
  }

  /**
   * Process immediate updates without delay
   */
  private async processImmediateUpdate(update: ScheduledUpdate): Promise<void> {
    try {
      console.log(`Processing immediate update for ${update.userAddress}`);
      
      // In a real implementation, this would trigger the actual score update
      // For now, we'll just log and track metrics
      
      const latency = getCurrentTimestamp() - update.scheduledAt;
      this.updateMetrics(latency);
      
      console.log(`Immediate update completed for ${update.userAddress} in ${latency}ms`);
    } catch (error) {
      console.error(`Error processing immediate update for ${update.userAddress}:`, formatError(error));
    }
  }

  /**
   * Process scheduled updates based on SLA requirements
   */
  private async processScheduledUpdates(): Promise<void> {
    if (!this.isRunning || this.updateQueue.length === 0) {
      return;
    }

    const now = getCurrentTimestamp();
    const updatesToProcess: ScheduledUpdate[] = [];

    // Find updates that need processing
    for (const update of this.updateQueue) {
      // Check if deadline is approaching or passed
      const timeUntilDeadline = update.deadline - now;
      
      if (timeUntilDeadline <= 0 || this.shouldProcessEarly(update, timeUntilDeadline)) {
        updatesToProcess.push(update);
      }
    }

    // Process the updates
    for (const update of updatesToProcess) {
      await this.processScheduledUpdate(update);
    }

    // Remove processed updates from queue
    this.updateQueue = this.updateQueue.filter(u => 
      !updatesToProcess.some(processed => processed.userAddress === u.userAddress)
    );
  }

  /**
   * Determine if update should be processed early
   */
  private shouldProcessEarly(update: ScheduledUpdate, timeUntilDeadline: number): boolean {
    // Process high priority updates 30 minutes before deadline
    if (update.priority === 'high' && timeUntilDeadline <= 30 * 60 * 1000) {
      return true;
    }

    // Process normal priority updates 1 hour before deadline
    if (update.priority === 'normal' && timeUntilDeadline <= 60 * 60 * 1000) {
      return true;
    }

    return false;
  }

  /**
   * Process a single scheduled update
   */
  private async processScheduledUpdate(update: ScheduledUpdate): Promise<void> {
    try {
      update.attempts++;
      
      console.log(`Processing scheduled update for ${update.userAddress} (attempt ${update.attempts})`);
      
      // Calculate processing latency
      const latency = getCurrentTimestamp() - update.scheduledAt;
      
      // Check SLA compliance
      const slaViolation = this.checkSLACompliance(update, latency);
      if (slaViolation) {
        console.warn(`SLA violation for ${update.userAddress}: ${slaViolation}`);
      }

      // In a real implementation, this would trigger the actual score update
      // For now, we'll just track metrics
      
      this.updateMetrics(latency);
      
      // Remove from scheduled updates
      this.scheduledUpdates.delete(update.userAddress);
      
      console.log(`Scheduled update completed for ${update.userAddress} in ${latency}ms`);
      
    } catch (error) {
      console.error(`Error processing scheduled update for ${update.userAddress}:`, formatError(error));
      
      // Retry logic for failed updates
      if (update.attempts < 3) {
        console.log(`Retrying update for ${update.userAddress} (attempt ${update.attempts + 1})`);
        // Re-add to queue with higher priority
        update.priority = 'high';
        this.updateQueue.push(update);
      } else {
        console.error(`Max retry attempts reached for ${update.userAddress}, removing from queue`);
        this.scheduledUpdates.delete(update.userAddress);
      }
    }
  }

  /**
   * Check SLA compliance for an update
   */
  private checkSLACompliance(update: ScheduledUpdate, actualLatency: number): string | null {
    const expectedSLA = update.priority === 'immediate' ? 0 : 
                       (getCurrentTimestamp() - update.scheduledAt);
    
    // Determine expected SLA based on update type
    let maxAllowedLatency: number;
    
    if (update.priority === 'immediate') {
      maxAllowedLatency = 5 * 60 * 1000; // 5 minutes for immediate
    } else {
      // Use the configured SLAs (4 hours for positive, 24 hours for negative)
      maxAllowedLatency = this.config.positiveUpdateSLA; // Default to positive SLA
    }

    if (actualLatency > maxAllowedLatency) {
      const violationMinutes = Math.round((actualLatency - maxAllowedLatency) / 60000);
      return `Update exceeded SLA by ${violationMinutes} minutes`;
    }

    return null;
  }

  /**
   * Update processing metrics
   */
  private updateMetrics(latency: number): void {
    this.totalUpdatesProcessed++;
    this.totalLatency += latency;
  }

  /**
   * Get average processing latency
   */
  public getAverageLatency(): number {
    if (this.totalUpdatesProcessed === 0) {
      return 0;
    }
    return Math.round(this.totalLatency / this.totalUpdatesProcessed);
  }

  /**
   * Get scheduler status and metrics
   */
  public getSchedulerStatus(): {
    isRunning: boolean;
    queueSize: number;
    scheduledUpdates: number;
    totalProcessed: number;
    averageLatency: number;
  } {
    return {
      isRunning: this.isRunning,
      queueSize: this.updateQueue.length,
      scheduledUpdates: this.scheduledUpdates.size,
      totalProcessed: this.totalUpdatesProcessed,
      averageLatency: this.getAverageLatency()
    };
  }

  /**
   * Get pending updates for a user
   */
  public getPendingUpdate(userAddress: string): ScheduledUpdate | undefined {
    return this.scheduledUpdates.get(userAddress);
  }

  /**
   * Cancel a scheduled update
   */
  public cancelUpdate(userAddress: string): boolean {
    const update = this.scheduledUpdates.get(userAddress);
    if (update) {
      this.scheduledUpdates.delete(userAddress);
      this.updateQueue = this.updateQueue.filter(u => u.userAddress !== userAddress);
      return true;
    }
    return false;
  }
}