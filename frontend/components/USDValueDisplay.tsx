import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

interface USDValueDisplayProps {
  tokenSymbol: string;
  tokenAmount: number;
  decimals?: number;
  privacyMode: boolean;
  className?: string;
  showSymbol?: boolean;
}

const USDValueDisplay: React.FC<USDValueDisplayProps> = ({
  tokenSymbol,
  tokenAmount,
  decimals = 18,
  privacyMode,
  className = "text-xs text-gray-500",
  showSymbol = true
}) => {
  const [usdValue, setUsdValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const convertToUSD = async () => {
      if (!tokenSymbol || tokenAmount === 0 || privacyMode) return;
      
      setLoading(true);
      try {
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');
        
        // Convert token amount to wei-like format for conversion
        const amountInWei = (tokenAmount * Math.pow(10, decimals)).toString();
        const usd = await creditIntelligenceService.convertToUSD(tokenSymbol, amountInWei, decimals);
        
        setUsdValue(usd);
      } catch (error) {
        console.error(`Failed to convert ${tokenSymbol} to USD:`, error);
        setUsdValue(null);
      } finally {
        setLoading(false);
      }
    };

    convertToUSD();
  }, [tokenSymbol, tokenAmount, decimals, privacyMode]);

  if (privacyMode) {
    return (
      <div className={className}>
        {showSymbol && <DollarSign className="w-3 h-3 inline mr-1" />}
        ***
      </div>
    );
  }

  if (loading) {
    return (
      <div className={className}>
        {showSymbol && <DollarSign className="w-3 h-3 inline mr-1" />}
        Loading...
      </div>
    );
  }

  if (usdValue === null || usdValue === 0) {
    return null;
  }

  return (
    <div className={className}>
      {showSymbol && <DollarSign className="w-3 h-3 inline mr-1" />}
      ≈ ${usdValue.toFixed(2)}
    </div>
  );
};

export default USDValueDisplay;