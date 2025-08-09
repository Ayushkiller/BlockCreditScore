// Validation utility functions

import { isValidAddress } from './crypto';

/**
 * Validates a credit score value (0-1000 scale)
 */
export function isValidCreditScore(score: number): boolean {
  return typeof score === 'number' && score >= 0 && score <= 1000 && !isNaN(score);
}

/**
 * Validates a confidence percentage (0-100 scale)
 */
export function isValidConfidence(confidence: number): boolean {
  return typeof confidence === 'number' && confidence >= 0 && confidence <= 100 && !isNaN(confidence);
}

/**
 * Validates a timestamp
 */
export function isValidTimestamp(timestamp: number): boolean {
  return typeof timestamp === 'number' && timestamp > 0 && timestamp <= Date.now();
}

/**
 * Validates a chain ID
 */
export function isValidChainId(chainId: number): boolean {
  const validChainIds = [1, 5, 10, 137, 42161, 80001, 421613, 31337]; // Add more as needed
  return validChainIds.includes(chainId);
}

/**
 * Validates a transaction hash
 */
export function isValidTxHash(txHash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(txHash);
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a credit profile object
 */
export function validateCreditProfile(profile: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!profile.userAddress || !isValidAddress(profile.userAddress)) {
    errors.push('Invalid user address');
  }
  
  if (!Array.isArray(profile.linkedWallets)) {
    errors.push('linkedWallets must be an array');
  } else {
    profile.linkedWallets.forEach((wallet: string, index: number) => {
      if (!isValidAddress(wallet)) {
        errors.push(`Invalid linked wallet at index ${index}`);
      }
    });
  }
  
  if (!profile.dimensions || typeof profile.dimensions !== 'object') {
    errors.push('dimensions must be an object');
  } else {
    const requiredDimensions = [
      'defiReliability',
      'tradingConsistency', 
      'stakingCommitment',
      'governanceParticipation',
      'liquidityProvider'
    ];
    
    requiredDimensions.forEach(dimension => {
      const dim = profile.dimensions[dimension];
      if (!dim) {
        errors.push(`Missing dimension: ${dimension}`);
      } else {
        if (!isValidCreditScore(dim.score)) {
          errors.push(`Invalid score for ${dimension}`);
        }
        if (!isValidConfidence(dim.confidence)) {
          errors.push(`Invalid confidence for ${dimension}`);
        }
        if (!isValidTimestamp(dim.lastCalculated)) {
          errors.push(`Invalid lastCalculated timestamp for ${dimension}`);
        }
      }
    });
  }
  
  if (!isValidTimestamp(profile.lastUpdated)) {
    errors.push('Invalid lastUpdated timestamp');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a transaction object
 */
export function validateTransaction(transaction: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!isValidTxHash(transaction.txHash)) {
    errors.push('Invalid transaction hash');
  }
  
  if (!isValidChainId(transaction.chainId)) {
    errors.push('Invalid chain ID');
  }
  
  if (!isValidAddress(transaction.from)) {
    errors.push('Invalid from address');
  }
  
  if (!isValidAddress(transaction.to)) {
    errors.push('Invalid to address');
  }
  
  if (!isValidTimestamp(transaction.timestamp)) {
    errors.push('Invalid timestamp');
  }
  
  if (typeof transaction.blockNumber !== 'number' || transaction.blockNumber <= 0) {
    errors.push('Invalid block number');
  }
  
  if (typeof transaction.usdValue !== 'number' || transaction.usdValue < 0) {
    errors.push('Invalid USD value');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validates API rate limit parameters
 */
export function validateRateLimit(windowMs: number, maxRequests: number): boolean {
  return windowMs > 0 && maxRequests > 0 && windowMs <= 24 * 60 * 60 * 1000; // Max 24 hours
}