import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users, 
  Target,
  Download,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

interface AnalyticsData {
  scoreHistory: { date: string; score: number; dimension: string }[];
  peerComparison: { percentile: number; averageScore: number; userScore: number };
  behaviorTrends: { category: string; trend: number; change: string }[];
  timeframeData: { [key: string]: any };
}

const AnalyticsPanel: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedDimension, setSelectedDimension] = useState('all');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showPeerComparison, setShowPeerComparison] = useState(true);

  // Mock analytics data
  const analyticsData: AnalyticsData = {
    scoreHistory: [
      { date: '2024-01-01', score: 720, dimension: 'overall' },
      { date: '2024-01-15', score: 745, dimension: 'overall' },
      { date: '2024-02-01', score: 780, dimension: 'overall' },
      { date: '2024-02-15', score: 810, dimension: 'overall' },
      { date: '2024-03-01', score: 847, dimension: 'overall' }
    ],
    peerComparison: {
      percentile: 87,
      averageScore: 642,
      userScore: 847
    },
    behaviorTrends: [
      { category: 'DeFi Interactions', trend: 15, change: 'increase' },
      { category: 'Staking Duration', trend: 8, change: 'increase' },
      { category: 'Governance Votes', trend: -5, change: 'decrease' },
      { category: 'LP Positions', trend: 12, change: 'increase' }
    ],
    timeframeData: {
      '7d': { transactions: 12, volume: 15420, protocols: 4 },
      '30d': { transactions: 89, volume: 234560, protocols: 8 },
      '90d': { transactions: 267, volume: 892340, protocols: 12 }
    }
  };

  const timeframes = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  const dimensions = [
    { value: 'all', label: 'All Dimensions' },
    { value: 'defi', label: 'DeFi Reliability' },
    { value: 'trading', label: 'Trading Consistency' },
    { value: 'staking', label: 'Staking Commitment' },
    { value: 'governance', label: 'Governance Participation' },
    { value: 'liquidity', label: 'Liquidity Provider' }
  ];

  const exportData = () => {
    // In real implementation, this would export actual data
    const dataToExport = {
      timestamp: new Date().toISOString(),
      scoreHistory: analyticsData.scoreHistory,
      peerComparison: showPeerComparison ? analyticsData.peerComparison : null,
      behaviorTrends: analyticsData.behaviorTrends,
      privacyMode: privacyMode
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Credit Analytics</h2>
            <p className="text-gray-600 mt-1">
              Detailed insights into your financial behavior patterns and credit evolution
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Privacy Toggle */}
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                privacyMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{privacyMode ? 'Private' : 'Public'}</span>
            </button>
            
            {/* Export Button */}
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Time Period</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="input"
            >
              {timeframes.map(tf => (
                <option key={tf.value} value={tf.value}>{tf.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label">Credit Dimension</label>
            <select
              value={selectedDimension}
              onChange={(e) => setSelectedDimension(e.target.value)}
              className="input"
            >
              {dimensions.map(dim => (
                <option key={dim.value} value={dim.value}>{dim.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Score Evolution Chart */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Score Evolution</h3>
        </div>
        
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              {privacyMode ? 'Chart hidden in privacy mode' : 'Interactive score chart would be displayed here'}
            </p>
            {!privacyMode && (
              <div className="mt-4 text-sm text-gray-500">
                Score progression: 720 → 847 (+127 points over 3 months)
              </div>
            )}
          </div>
        </div>
        
        {/* Chart Legend */}
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Overall Score</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Trend Line</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>Peer Average</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {privacyMode ? '***' : analyticsData.timeframeData[selectedTimeframe].transactions}
          </div>
          <div className="text-gray-600 font-medium">Total Transactions</div>
          <div className="text-sm text-gray-500 mt-1">
            Last {timeframes.find(tf => tf.value === selectedTimeframe)?.label}
          </div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {privacyMode ? '***' : `$${analyticsData.timeframeData[selectedTimeframe].volume.toLocaleString()}`}
          </div>
          <div className="text-gray-600 font-medium">Total Volume</div>
          <div className="text-sm text-gray-500 mt-1">
            USD equivalent
          </div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {privacyMode ? '***' : analyticsData.timeframeData[selectedTimeframe].protocols}
          </div>
          <div className="text-gray-600 font-medium">Protocols Used</div>
          <div className="text-sm text-gray-500 mt-1">
            Unique interactions
          </div>
        </div>
      </div>

      {/* Peer Comparison */}
      {showPeerComparison && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">Peer Comparison</h3>
            </div>
            <button
              onClick={() => setShowPeerComparison(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide Comparison
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {privacyMode ? '***' : `${analyticsData.peerComparison.percentile}th`}
              </div>
              <div className="text-green-700 font-medium">Percentile Rank</div>
              <div className="text-sm text-green-600 mt-1">
                Better than {privacyMode ? '***' : analyticsData.peerComparison.percentile}% of users
              </div>
            </div>
            
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {privacyMode ? '***' : analyticsData.peerComparison.userScore}
              </div>
              <div className="text-blue-700 font-medium">Your Score</div>
              <div className="text-sm text-blue-600 mt-1">Current overall rating</div>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-600 mb-2">
                {privacyMode ? '***' : analyticsData.peerComparison.averageScore}
              </div>
              <div className="text-gray-700 font-medium">Network Average</div>
              <div className="text-sm text-gray-600 mt-1">All users average</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Performance Insight</h4>
                <p className="text-green-800 text-sm mt-1">
                  {privacyMode 
                    ? 'Performance data hidden in privacy mode'
                    : `You're performing ${analyticsData.peerComparison.userScore - analyticsData.peerComparison.averageScore} points above the network average. Keep up the excellent work!`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Behavior Trends */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">Behavior Trends</h3>
        </div>
        
        <div className="space-y-4">
          {analyticsData.behaviorTrends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  trend.change === 'increase' ? 'bg-green-500' : 
                  trend.change === 'decrease' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <span className="font-medium text-gray-900">{trend.category}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  trend.change === 'increase' ? 'text-green-600' : 
                  trend.change === 'decrease' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {privacyMode ? '***' : `${trend.trend > 0 ? '+' : ''}${trend.trend}%`}
                </span>
                <span className="text-sm text-gray-500">
                  vs last period
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Export Options */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Data Export & Privacy</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
            <div className="space-y-2">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Complete Analytics Report</div>
                <div className="text-sm text-gray-600">Full data export with all metrics</div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Score History Only</div>
                <div className="text-sm text-gray-600">Historical score data for external analysis</div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Anonymized Summary</div>
                <div className="text-sm text-gray-600">Privacy-safe overview without personal data</div>
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Privacy Controls</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input type="checkbox" checked={!showPeerComparison} onChange={(e) => setShowPeerComparison(!e.target.checked)} className="rounded" />
                <span className="text-sm">Hide peer comparison data</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" checked={privacyMode} onChange={(e) => setPrivacyMode(e.target.checked)} className="rounded" />
                <span className="text-sm">Enable privacy mode (hide all values)</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Anonymize exported data</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;