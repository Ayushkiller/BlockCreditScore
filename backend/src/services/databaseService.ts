import { getDatabase } from '../database/connection';
import { CreditScore } from './scoreCalculator';

export interface ScoreHistoryEntry {
  id: number;
  address: string;
  score: number;
  timestamp: number;
}

export interface CachedScore {
  address: string;
  score: number;
  breakdown: {
    transactionVolume: number;
    transactionFrequency: number;
    stakingActivity: number;
    defiInteractions: number;
  };
  lastUpdated: number;
  createdAt: number;
}

/**
 * Database service for managing credit scores and history
 */
export class DatabaseService {
  // Cache duration in seconds (1 hour)
  private static readonly CACHE_DURATION = 60 * 60;

  /**
   * Save or update a credit score in the database
   */
  static async saveScore(creditScore: CreditScore): Promise<void> {
    const db = getDatabase();

    try {
      const now = Math.floor(Date.now() / 1000);
      const breakdownJson = JSON.stringify(creditScore.breakdown);

      // Check if score already exists
      const existingScore = await new Promise<any>((resolve, reject) => {
        db.get(
          'SELECT address FROM credit_scores WHERE address = ?',
          [creditScore.address.toLowerCase()],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingScore) {
        // Update existing score
        await new Promise<void>((resolve, reject) => {
          db.run(`
            UPDATE credit_scores 
            SET score = ?, breakdown = ?, last_updated = ?
            WHERE address = ?
          `, [
            creditScore.score,
            breakdownJson,
            creditScore.timestamp,
            creditScore.address.toLowerCase()
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        // Insert new score
        await new Promise<void>((resolve, reject) => {
          db.run(`
            INSERT INTO credit_scores (address, score, breakdown, last_updated, created_at)
            VALUES (?, ?, ?, ?, ?)
          `, [
            creditScore.address.toLowerCase(),
            creditScore.score,
            breakdownJson,
            creditScore.timestamp,
            now
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Add to history
      await new Promise<void>((resolve, reject) => {
        db.run(`
          INSERT INTO score_history (address, score, timestamp)
          VALUES (?, ?, ?)
        `, [
          creditScore.address.toLowerCase(),
          creditScore.score,
          creditScore.timestamp
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`Saved credit score for address ${creditScore.address}: ${creditScore.score}`);
    } catch (error) {
      console.error('Error saving credit score:', error);
      throw new Error(`Failed to save credit score: ${error}`);
    }
  }

  /**
   * Get cached credit score by address
   */
  static async getCachedScore(address: string): Promise<CachedScore | null> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.get(`
          SELECT address, score, breakdown, last_updated, created_at
          FROM credit_scores 
          WHERE address = ?
        `, [address.toLowerCase()], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!result) {
        return null;
      }

      return {
        address: result.address,
        score: result.score,
        breakdown: JSON.parse(result.breakdown),
        lastUpdated: result.last_updated,
        createdAt: result.created_at
      };
    } catch (error) {
      console.error('Error getting cached score:', error);
      throw new Error(`Failed to get cached score: ${error}`);
    }
  }

  /**
   * Check if cached score is still fresh
   */
  static isCacheFresh(cachedScore: CachedScore): boolean {
    const now = Math.floor(Date.now() / 1000);
    const age = now - cachedScore.lastUpdated;
    return age < this.CACHE_DURATION;
  }

  /**
   * Get score history for an address
   */
  static async getScoreHistory(address: string, limit: number = 100): Promise<ScoreHistoryEntry[]> {
    const db = getDatabase();

    try {
      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(`
          SELECT id, address, score, timestamp
          FROM score_history 
          WHERE address = ?
          ORDER BY timestamp DESC
          LIMIT ?
        `, [address.toLowerCase(), limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results;
    } catch (error) {
      console.error('Error getting score history:', error);
      throw new Error(`Failed to get score history: ${error}`);
    }
  }

  /**
   * Get multiple cached scores by addresses
   */
  static async getMultipleCachedScores(addresses: string[]): Promise<CachedScore[]> {
    const db = getDatabase();

    try {
      if (addresses.length === 0) {
        return [];
      }

      // Create placeholders for the IN clause
      const placeholders = addresses.map(() => '?').join(',');
      const lowercaseAddresses = addresses.map(addr => addr.toLowerCase());

      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(`
          SELECT address, score, breakdown, last_updated, created_at
          FROM credit_scores 
          WHERE address IN (${placeholders})
        `, lowercaseAddresses, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map((result: any) => ({
        address: result.address,
        score: result.score,
        breakdown: JSON.parse(result.breakdown),
        lastUpdated: result.last_updated,
        createdAt: result.created_at
      }));
    } catch (error) {
      console.error('Error getting multiple cached scores:', error);
      throw new Error(`Failed to get multiple cached scores: ${error}`);
    }
  }

  /**
   * Delete old score history entries (cleanup)
   */
  static async cleanupOldHistory(daysToKeep: number = 90): Promise<number> {
    const db = getDatabase();

    try {
      const cutoffTimestamp = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
      
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          DELETE FROM score_history 
          WHERE timestamp < ?
        `, [cutoffTimestamp], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      const deletedCount = result.changes || 0;
      console.log(`Cleaned up ${deletedCount} old score history entries`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old history:', error);
      throw new Error(`Failed to cleanup old history: ${error}`);
    }
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<{
    totalScores: number;
    totalHistoryEntries: number;
    oldestScore: number;
    newestScore: number;
  }> {
    const db = getDatabase();

    try {
      const [scoresCount, historyCount, timeRange] = await Promise.all([
        new Promise<any>((resolve, reject) => {
          db.get('SELECT COUNT(*) as count FROM credit_scores', (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }),
        new Promise<any>((resolve, reject) => {
          db.get('SELECT COUNT(*) as count FROM score_history', (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }),
        new Promise<any>((resolve, reject) => {
          db.get(`
            SELECT 
              MIN(created_at) as oldest,
              MAX(last_updated) as newest
            FROM credit_scores
          `, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        })
      ]);

      return {
        totalScores: scoresCount?.count || 0,
        totalHistoryEntries: historyCount?.count || 0,
        oldestScore: timeRange?.oldest || 0,
        newestScore: timeRange?.newest || 0
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw new Error(`Failed to get database stats: ${error}`);
    }
  }
}

export const databaseService = DatabaseService;
export default databaseService;