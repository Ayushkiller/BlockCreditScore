import React, { useState } from 'react';
import { Search, Loader, CheckCircle, AlertCircle, TrendingUp, Shield, Users, Zap, Award } from 'lucide-react';

interface CreditScore {
  address: string;
  compositeScore: number;
  confidence: number;
  dimensions: {
    defiReliability: number;
    tradingConsistency: number;
    stakingCommitment: number;
    governanceParticipation: number;
    liquidityProvider: number;
  };
  lastUpdated: number;
  dataPoints: number;
}

const SimpleCreditDemo: React.FC = () => {
  const [address, setAddress] = useState('');
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeCreditScore = async () => {
    if (!address) {
      setError('Please enter an Ethereum address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setLoading(true);
    setError('');
    setCreditScore(null);

    try {
      console.log(`🔍 Analyzing credit score for ${address}`);
      
      const response = await fetch(`/api/credit-score/calculate/${address}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to calculate credit score');
      }

      setCreditScore(data.data);
      console.log(`✅ Credit score calculated:`, data.data);

    } catch (err) {
      console.error('❌ Failed to analyze credit score:', err);
      setError(err.message || 'Failed to analyze credit score');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 600) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 800) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 600) return 'Fair';
    if (score >= 400) return 'Poor';
    return 'Very Poor';
  };

  const dimensions = [
    { key: 'defiReliability', name: 'DeFi Reliability', icon: Shield, color: 'blue' },
    { key: 'tradingConsistency', name: 'Trading Consistency', icon: TrendingUp, color: 'green' },
    { key: 'stakingCommitment', name: 'Staking Commitment', icon: Award, color: 'purple' },
    { key: 'governanceParticipation', name: 'Governance Participation', icon: Users, color: 'indigo' },
    { key: 'liquidityProvider', name: 'Liquidity Provider', icon: Zap, color: 'yellow' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          CryptoVault Credit Intelligence
        </h1>
        <p className="text-gray-600">
          Analyze any Ethereum address for real credit scoring based on on-chain behavior
        </p>
      </div>

      {/* Address Input */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Ethereum address (0x...)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <button
            onClick={analyzeCreditScore}
            disabled={loading || !address}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Analyze</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
      </div>

      {/* Credit Score Results */}
      {creditScore && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Credit Score</h2>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Real blockchain data</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(creditScore.compositeScore)}`}>
                  {creditScore.compositeScore}
                </div>
                <div className="text-lg text-gray-600 mt-1">
                  {getScoreLabel(creditScore.compositeScore)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">
                  {creditScore.confidence}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Confidence Level
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">
                  {creditScore.dataPoints}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Data Points
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500 text-center">
              Address: {creditScore.address} • Last Updated: {new Date(creditScore.lastUpdated).toLocaleString()}
            </div>
          </div>

          {/* Dimension Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dimensions.map((dimension) => {
                const score = creditScore.dimensions[dimension.key as keyof typeof creditScore.dimensions];
                const Icon = dimension.icon;
                
                return (
                  <div key={dimension.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Icon className={`w-5 h-5 text-${dimension.color}-600`} />
                      <span className="font-medium text-gray-900">{dimension.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getScoreLabel(score)}
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${dimension.color}-600 h-2 rounded-full`}
                        style={{ width: `${(score / 1000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample Addresses */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Try These Sample Addresses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Vitalik Buterin', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
                { name: 'Uniswap V3 Router', address: '0xE592427A0AEce92De3Edee1F18E0157C05861564' },
                { name: 'Compound Treasury', address: '0x2775b1c75658Be0F640272CCb8c72ac986009e38' },
                { name: 'Aave V3 Pool', address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' }
              ].map((sample) => (
                <button
                  key={sample.address}
                  onClick={() => setAddress(sample.address)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="font-medium text-gray-900">{sample.name}</div>
                  <div className="text-sm text-gray-600 font-mono">{sample.address}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleCreditDemo;