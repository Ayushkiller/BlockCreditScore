// Formatting utility functions

/**
 * Formats a credit score for display
 */
export function formatCreditScore(score: number): string {
  if (score < 0 || score > 1000) {
    return 'Invalid Score';
  }
  return Math.round(score).toString();
}

/**
 * Formats a confidence percentage for display
 */
export function formatConfidence(confidence: number): string {
  if (confidence < 0 || confidence > 100) {
    return 'Invalid';
  }
  return `${Math.round(confidence)}%`;
}

/**
 * Formats a large number with appropriate suffixes (K, M, B)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(1)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Formats a USD amount with proper currency formatting
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a cryptocurrency amount with appropriate decimal places
 */
export function formatCrypto(amount: number, symbol: string, decimals: number = 4): string {
  const formatted = amount.toFixed(decimals);
  return `${formatted} ${symbol}`;
}

/**
 * Formats an Ethereum address for display (shortened)
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Formats a transaction hash for display (shortened)
 */
export function formatTxHash(txHash: string): string {
  return formatAddress(txHash, 8, 6);
}

/**
 * Formats a percentage with appropriate decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats a credit tier based on score
 */
export function formatCreditTier(score: number): string {
  if (score >= 900) return 'Platinum';
  if (score >= 800) return 'Gold';
  if (score >= 700) return 'Silver';
  if (score >= 600) return 'Bronze';
  return 'Developing';
}

/**
 * Formats a risk level based on score
 */
export function formatRiskLevel(riskScore: number): string {
  if (riskScore <= 200) return 'Very Low';
  if (riskScore <= 400) return 'Low';
  if (riskScore <= 600) return 'Medium';
  if (riskScore <= 800) return 'High';
  return 'Very High';
}

/**
 * Formats a trend indicator
 */
export function formatTrend(trend: 'improving' | 'stable' | 'declining'): string {
  const trendMap = {
    improving: '📈 Improving',
    stable: '➡️ Stable',
    declining: '📉 Declining'
  };
  return trendMap[trend];
}

/**
 * Formats a duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  const units = [
    { name: 'year', seconds: 31536000 },
    { name: 'month', seconds: 2592000 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 },
    { name: 'second', seconds: 1 }
  ];

  for (const unit of units) {
    const count = Math.floor(seconds / unit.seconds);
    if (count >= 1) {
      return `${count} ${unit.name}${count > 1 ? 's' : ''}`;
    }
  }
  
  return '0 seconds';
}

/**
 * Formats a file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Formats an API response time
 */
export function formatResponseTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }
  return `${(milliseconds / 1000).toFixed(2)}s`;
}