import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  Users, 
  DollarSign, 
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useDeployment } from '../contexts/DeploymentContext';

const MonitoringPanel: React.FC = () => {
  const { 
    deployments, 
    monitoringData, 
    setMonitoringData, 
    addLog 
  } = useDeployment();

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<string>('');
  const [realTimeData, setRealTimeData] = useState({
    transactions: 0,
    profilesCreated: 0,
    scoresUpdated: 0,
    avgGasUsed: 0,
    lastActivity: 0
  });

  // Simulate real-time monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring && selectedDeployment) {
      interval = setInterval(() => {
        // Simulate network data updates
        const newBlock = monitoringData.latestBlock + Math.floor(Math.random() * 3);
        const newGasPrice = (15 + Math.random() * 10).toFixed(1);
        const newBalance = (parseFloat(monitoringData.balance) - Math.random() * 0.001).toFixed(4);
        
        setMonitoringData({
          ...monitoringData,
          isConnected: true,
          latestBlock: newBlock,
          gasPrice: newGasPrice,
          balance: newBalance,
          lastUpdate: Date.now()
        });

        // Simulate contract activity
        if (Math.random() > 0.7) {
          const activities = [
            'Profile created',
            'Score updated',
            'Dimension calculated',
            'Authorization granted'
          ];
          const activity = activities[Math.floor(Math.random() * activities.length)];
          addLog(`📊 ${activity} on ${selectedDeployment}`);
          
          setRealTimeData(prev => ({
            ...prev,
            transactions: prev.transactions + 1,
            profilesCreated: activity === 'Profile created' ? prev.profilesCreated + 1 : prev.profilesCreated,
            scoresUpdated: activity === 'Score updated' ? prev.scoresUpdated + 1 : prev.scoresUpdated,
            avgGasUsed: Math.floor(100000 + Math.random() * 50000),
            lastActivity: Date.now()
          }));
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, selectedDeployment, monitoringData, setMonitoringData, addLog]);

  const startMonitoring = () => {
    if (!selectedDeployment) {
      addLog('❌ Please select a deployment to monitor');
      return;
    }
    
    setIsMonitoring(true);
    addLog(`🔍 Started monitoring ${selectedDeployment}`);
    
    // Initialize monitoring data
    setMonitoringData({
      isConnected: true,
      latestBlock: 8234567 + Math.floor(Math.random() * 1000),
      gasPrice: (15 + Math.random() * 10).toFixed(1),
      balance: (0.5 + Math.random() * 0.5).toFixed(4),
      lastUpdate: Date.now()
    });
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    addLog('⏹️ Monitoring stopped');
    setMonitoringData({
      ...monitoringData,
      isConnected: false
    });
  };

  const hasDeployments = deployments.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Real-time Monitoring</h2>
            <p className="text-gray-600 mt-1">
              Monitor your deployed contracts and network activity in real-time
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isMonitoring ? (
              <Zap className="w-6 h-6 text-green-500" />
            ) : (
              <Activity className="w-6 h-6 text-gray-400" />
            )}
            <span className="font-medium">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* No Deployments Warning */}
      {!hasDeployments && (
        <div className="card border-yellow-200 bg-yellow-50">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900">No Deployments Found</h3>
              <p className="text-yellow-800 mt-1">
                You need to deploy a contract before you can start monitoring. 
                Go to the Deployment tab to deploy your first contract.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Controls */}
      {hasDeployments && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Monitoring Controls</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Select Deployment to Monitor</label>
              <select
                value={selectedDeployment}
                onChange={(e) => setSelectedDeployment(e.target.value)}
                className="input"
              >
                <option value="">Choose a deployment...</option>
                {deployments.map((deployment, index) => (
                  <option key={index} value={`${deployment.network}-${deployment.contractAddress}`}>
                    {deployment.network.toUpperCase()} - {deployment.contractAddress.slice(0, 10)}...
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              {!isMonitoring ? (
                <button
                  onClick={startMonitoring}
                  disabled={!selectedDeployment}
                  className="btn btn-success flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Monitoring</span>
                </button>
              ) : (
                <button
                  onClick={stopMonitoring}
                  className="btn btn-error flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Stop Monitoring</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Network Status */}
      {isMonitoring && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Latest Block</p>
                <p className="text-2xl font-bold text-gray-900">
                  #{monitoringData.latestBlock.toLocaleString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Connected
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gas Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monitoringData.gasPrice} gwei
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              Normal range
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monitoringData.balance} ETH
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Sufficient
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {realTimeData.transactions}
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Activity className="w-4 h-4 mr-1" />
              Last: {realTimeData.lastActivity ? new Date(realTimeData.lastActivity).toLocaleTimeString() : 'None'}
            </div>
          </div>
        </div>
      )}

      {/* Contract Activity */}
      {isMonitoring && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Contract Activity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-blue-900">
                {realTimeData.profilesCreated}
              </div>
              <div className="text-blue-700 font-medium">Profiles Created</div>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-900">
                {realTimeData.scoresUpdated}
              </div>
              <div className="text-green-700 font-medium">Scores Updated</div>
            </div>

            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <Zap className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-yellow-900">
                {realTimeData.avgGasUsed.toLocaleString()}
              </div>
              <div className="text-yellow-700 font-medium">Avg Gas Used</div>
            </div>
          </div>
        </div>
      )}

      {/* Function Call Monitoring */}
      {isMonitoring && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Function Call Analytics</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">createCreditProfile</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Calls: {Math.floor(realTimeData.profilesCreated)}</span>
                <span>Avg Gas: 459,838</span>
                <span className="text-green-600">✓ Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">updateScoreDimension</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Calls: {Math.floor(realTimeData.scoresUpdated)}</span>
                <span>Avg Gas: 112,462</span>
                <span className="text-green-600">✓ Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">getCompositeScore</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Calls: {Math.floor(realTimeData.transactions * 0.3)}</span>
                <span>Avg Gas: 0 (view)</span>
                <span className="text-blue-600">📊 Read-only</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {isMonitoring && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Response Times</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Profile Creation:</span>
                  <span className="font-medium">~3.2s</span>
                </div>
                <div className="flex justify-between">
                  <span>Score Update:</span>
                  <span className="font-medium">~2.1s</span>
                </div>
                <div className="flex justify-between">
                  <span>View Functions:</span>
                  <span className="font-medium">~0.1s</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Success Rates</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Deployments:</span>
                  <span className="font-medium text-green-600">100%</span>
                </div>
                <div className="flex justify-between">
                  <span>Transactions:</span>
                  <span className="font-medium text-green-600">99.8%</span>
                </div>
                <div className="flex justify-between">
                  <span>Verifications:</span>
                  <span className="font-medium text-green-600">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringPanel;