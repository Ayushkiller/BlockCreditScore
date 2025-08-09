import {
  EducationalModule,
  EducationalProgress,
  EducationDifficulty,
  AchievementReward,
  RewardType,
  BonusMultiplier
} from '../../types/gamification';
import { formatError } from '../../utils/errors';

export class EducationalIncentives {
  private modules: Map<string, EducationalModule> = new Map();
  private userProgress: Map<string, EducationalProgress[]> = new Map();
  private completionRewards: Map<string, BonusMultiplier[]> = new Map();

  constructor() {
    this.initializeDefaultModules();
  }

  private initializeDefaultModules(): void {
    const defaultModules: EducationalModule[] = [
      // Beginner Modules
      {
        id: 'defi_basics',
        title: 'DeFi Fundamentals',
        description: 'Learn the basics of Decentralized Finance and how it works',
        category: 'fundamentals',
        difficulty: EducationDifficulty.BEGINNER,
        estimatedTime: 30,
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.05,
            duration: 3
          }
        ],
        isActive: true
      },
      {
        id: 'credit_scoring_101',
        title: 'Understanding Credit Scores',
        description: 'Learn how credit scores work in traditional and DeFi contexts',
        category: 'credit',
        difficulty: EducationDifficulty.BEGINNER,
        estimatedTime: 25,
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.05,
            duration: 3
          }
        ],
        isActive: true
      },
      {
        id: 'wallet_security',
        title: 'Wallet Security Best Practices',
        description: 'Essential security practices for protecting your crypto assets',
        category: 'security',
        difficulty: EducationDifficulty.BEGINNER,
        estimatedTime: 20,
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.08,
            duration: 5
          }
        ],
        isActive: true
      },
      // Intermediate Modules
      {
        id: 'lending_protocols',
        title: 'DeFi Lending Protocols',
        description: 'Deep dive into lending protocols like Aave, Compound, and MakerDAO',
        category: 'lending',
        difficulty: EducationDifficulty.INTERMEDIATE,
        estimatedTime: 45,
        prerequisites: ['defi_basics'],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.1,
            duration: 7
          }
        ],
        isActive: true
      },
      {
        id: 'liquidity_provision',
        title: 'Liquidity Provision Strategies',
        description: 'Learn about providing liquidity and earning yield in DeFi',
        category: 'liquidity',
        difficulty: EducationDifficulty.INTERMEDIATE,
        estimatedTime: 40,
        prerequisites: ['defi_basics'],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.12,
            duration: 7
          }
        ],
        isActive: true
      },
      {
        id: 'governance_participation',
        title: 'DAO Governance and Voting',
        description: 'Understanding decentralized governance and how to participate',
        category: 'governance',
        difficulty: EducationDifficulty.INTERMEDIATE,
        estimatedTime: 35,
        prerequisites: ['defi_basics'],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.15,
            duration: 10
          }
        ],
        isActive: true
      },
      // Advanced Modules
      {
        id: 'risk_management',
        title: 'Advanced Risk Management',
        description: 'Sophisticated risk management strategies for DeFi',
        category: 'risk',
        difficulty: EducationDifficulty.ADVANCED,
        estimatedTime: 60,
        prerequisites: ['lending_protocols', 'liquidity_provision'],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.2,
            duration: 14
          }
        ],
        isActive: true
      },
      {
        id: 'yield_farming',
        title: 'Yield Farming Mastery',
        description: 'Advanced yield farming strategies and optimization',
        category: 'yield',
        difficulty: EducationDifficulty.ADVANCED,
        estimatedTime: 50,
        prerequisites: ['liquidity_provision', 'risk_management'],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.18,
            duration: 14
          }
        ],
        isActive: true
      },
      // Expert Modules
      {
        id: 'protocol_analysis',
        title: 'Protocol Analysis and Due Diligence',
        description: 'Expert-level protocol analysis and security assessment',
        category: 'analysis',
        difficulty: EducationDifficulty.EXPERT,
        estimatedTime: 90,
        prerequisites: ['risk_management', 'yield_farming'],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.25,
            duration: 21
          }
        ],
        isActive: true
      }
    ];

    defaultModules.forEach(module => {
      this.modules.set(module.id, module);
    });
  }

  async startModule(userId: string, moduleId: string): Promise<EducationalProgress> {
    try {
      const module = this.modules.get(moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      if (!module.isActive) {
        throw new Error('Module is not currently active');
      }

      // Check prerequisites
      if (module.prerequisites && module.prerequisites.length > 0) {
        const userProgress = this.userProgress.get(userId) || [];
        const completedModules = userProgress
          .filter(p => p.completedAt)
          .map(p => p.moduleId);

        const missingPrerequisites = module.prerequisites.filter(
          prereq => !completedModules.includes(prereq)
        );

        if (missingPrerequisites.length > 0) {
          throw new Error(`Missing prerequisites: ${missingPrerequisites.join(', ')}`);
        }
      }

      // Check if already started
      const userProgress = this.userProgress.get(userId) || [];
      const existingProgress = userProgress.find(p => p.moduleId === moduleId);
      
      if (existingProgress && !existingProgress.completedAt) {
        return existingProgress; // Return existing progress
      }

      if (existingProgress && existingProgress.completedAt) {
        throw new Error('Module already completed');
      }

      // Create new progress entry
      const progress: EducationalProgress = {
        userId,
        moduleId,
        startedAt: new Date(),
        progress: 0
      };

      userProgress.push(progress);
      this.userProgress.set(userId, userProgress);

      return progress;
    } catch (error) {
      throw new Error(formatError('Failed to start educational module', error));
    }
  }

  async updateProgress(userId: string, moduleId: string, progressPercentage: number): Promise<EducationalProgress> {
    try {
      const userProgress = this.userProgress.get(userId) || [];
      const progress = userProgress.find(p => p.moduleId === moduleId && !p.completedAt);

      if (!progress) {
        throw new Error('Module progress not found or already completed');
      }

      progress.progress = Math.min(100, Math.max(0, progressPercentage));

      return progress;
    } catch (error) {
      throw new Error(formatError('Failed to update module progress', error));
    }
  }

  async completeModule(
    userId: string, 
    moduleId: string, 
    finalScore?: number
  ): Promise<CompletionResult> {
    try {
      const module = this.modules.get(moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      const userProgress = this.userProgress.get(userId) || [];
      const progress = userProgress.find(p => p.moduleId === moduleId && !p.completedAt);

      if (!progress) {
        throw new Error('Module progress not found or already completed');
      }

      // Complete the module
      progress.completedAt = new Date();
      progress.progress = 100;
      progress.score = finalScore;

      // Calculate and apply rewards
      const bonusMultipliers = await this.applyCompletionRewards(userId, module, finalScore);

      // Update user progress
      this.userProgress.set(userId, userProgress);

      return {
        progress,
        bonusMultipliers,
        unlockedModules: this.getUnlockedModules(userId)
      };
    } catch (error) {
      throw new Error(formatError('Failed to complete educational module', error));
    }
  }

  private async applyCompletionRewards(
    userId: string,
    module: EducationalModule,
    score?: number
  ): Promise<BonusMultiplier[]> {
    const multipliers: BonusMultiplier[] = [];
    const userRewards = this.completionRewards.get(userId) || [];

    for (const reward of module.rewards) {
      if (reward.type === RewardType.TEMPORARY_BOOST) {
        let multiplierValue = reward.value;
        
        // Bonus for high scores
        if (score && score >= 90) {
          multiplierValue *= 1.2; // 20% bonus for excellent performance
        } else if (score && score >= 80) {
          multiplierValue *= 1.1; // 10% bonus for good performance
        }

        // Bonus for difficulty
        const difficultyMultiplier = this.getDifficultyMultiplier(module.difficulty);
        multiplierValue *= difficultyMultiplier;

        const multiplier: BonusMultiplier = {
          userId,
          dimension: 'all',
          multiplier: multiplierValue,
          startDate: new Date(),
          endDate: this.addDays(new Date(), reward.duration || 7),
          source: `education_${module.id}`
        };

        multipliers.push(multiplier);
        userRewards.push(multiplier);
      }
    }

    this.completionRewards.set(userId, userRewards);
    return multipliers;
  }

  private getDifficultyMultiplier(difficulty: EducationDifficulty): number {
    switch (difficulty) {
      case EducationDifficulty.BEGINNER:
        return 1.0;
      case EducationDifficulty.INTERMEDIATE:
        return 1.1;
      case EducationDifficulty.ADVANCED:
        return 1.2;
      case EducationDifficulty.EXPERT:
        return 1.3;
      default:
        return 1.0;
    }
  }

  getUnlockedModules(userId: string): EducationalModule[] {
    const userProgress = this.userProgress.get(userId) || [];
    const completedModules = userProgress
      .filter(p => p.completedAt)
      .map(p => p.moduleId);

    return Array.from(this.modules.values()).filter(module => {
      if (!module.isActive) return false;
      
      if (!module.prerequisites || module.prerequisites.length === 0) {
        return true; // No prerequisites
      }

      return module.prerequisites.every(prereq => completedModules.includes(prereq));
    });
  }

  getUserProgress(userId: string): EducationalProgress[] {
    return this.userProgress.get(userId) || [];
  }

  getModuleDetails(moduleId: string): EducationalModule | undefined {
    return this.modules.get(moduleId);
  }

  getUserEducationStats(userId: string): EducationStats {
    const userProgress = this.userProgress.get(userId) || [];
    const completedModules = userProgress.filter(p => p.completedAt);
    const inProgressModules = userProgress.filter(p => !p.completedAt);
    
    const totalScore = completedModules.reduce((sum, p) => sum + (p.score || 0), 0);
    const averageScore = completedModules.length > 0 ? totalScore / completedModules.length : 0;

    const difficultyStats = completedModules.reduce((stats, progress) => {
      const module = this.modules.get(progress.moduleId);
      if (module) {
        stats[module.difficulty] = (stats[module.difficulty] || 0) + 1;
      }
      return stats;
    }, {} as Record<EducationDifficulty, number>);

    const activeRewards = this.getActiveEducationRewards(userId);

    return {
      totalModulesCompleted: completedModules.length,
      modulesInProgress: inProgressModules.length,
      averageScore: Math.round(averageScore),
      difficultyBreakdown: difficultyStats,
      totalTimeSpent: this.calculateTotalTimeSpent(completedModules),
      activeRewards: activeRewards.length,
      currentMultiplier: this.calculateEducationMultiplier(userId),
      unlockedModulesCount: this.getUnlockedModules(userId).length
    };
  }

  private getActiveEducationRewards(userId: string): BonusMultiplier[] {
    const userRewards = this.completionRewards.get(userId) || [];
    const now = new Date();
    
    return userRewards.filter(reward => 
      !reward.endDate || reward.endDate > now
    );
  }

  private calculateEducationMultiplier(userId: string): number {
    const activeRewards = this.getActiveEducationRewards(userId);
    let totalMultiplier = 1.0;
    
    for (const reward of activeRewards) {
      totalMultiplier *= reward.multiplier;
    }
    
    return Math.min(totalMultiplier, 1.5); // Cap at 1.5x multiplier
  }

  private calculateTotalTimeSpent(completedModules: EducationalProgress[]): number {
    return completedModules.reduce((total, progress) => {
      const module = this.modules.get(progress.moduleId);
      return total + (module?.estimatedTime || 0);
    }, 0);
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Admin functions
  addModule(module: EducationalModule): void {
    this.modules.set(module.id, module);
  }

  updateModule(moduleId: string, updates: Partial<EducationalModule>): void {
    const module = this.modules.get(moduleId);
    if (module) {
      Object.assign(module, updates);
    }
  }

  deactivateModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (module) {
      module.isActive = false;
    }
  }

  getSystemEducationStats(): SystemEducationStats {
    const allProgress = Array.from(this.userProgress.values()).flat();
    const completedCount = allProgress.filter(p => p.completedAt).length;
    const inProgressCount = allProgress.filter(p => !p.completedAt).length;
    
    const moduleCompletionStats = Array.from(this.modules.values()).map(module => ({
      moduleId: module.id,
      title: module.title,
      completions: allProgress.filter(p => p.moduleId === module.id && p.completedAt).length,
      averageScore: this.calculateModuleAverageScore(module.id, allProgress)
    }));

    return {
      totalModules: this.modules.size,
      totalCompletions: completedCount,
      totalInProgress: inProgressCount,
      moduleStats: moduleCompletionStats,
      lastUpdated: new Date()
    };
  }

  private calculateModuleAverageScore(moduleId: string, allProgress: EducationalProgress[]): number {
    const moduleProgress = allProgress.filter(p => p.moduleId === moduleId && p.completedAt && p.score);
    if (moduleProgress.length === 0) return 0;
    
    const totalScore = moduleProgress.reduce((sum, p) => sum + (p.score || 0), 0);
    return Math.round(totalScore / moduleProgress.length);
  }
}

interface CompletionResult {
  progress: EducationalProgress;
  bonusMultipliers: BonusMultiplier[];
  unlockedModules: EducationalModule[];
}

interface EducationStats {
  totalModulesCompleted: number;
  modulesInProgress: number;
  averageScore: number;
  difficultyBreakdown: Record<EducationDifficulty, number>;
  totalTimeSpent: number;
  activeRewards: number;
  currentMultiplier: number;
  unlockedModulesCount: number;
}

interface SystemEducationStats {
  totalModules: number;
  totalCompletions: number;
  totalInProgress: number;
  moduleStats: {
    moduleId: string;
    title: string;
    completions: number;
    averageScore: number;
  }[];
  lastUpdated: Date;
}