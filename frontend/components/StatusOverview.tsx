import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap, 
  DollarSign, 
  Activity,
  Network,
  Shield,
  Wifi,
  WifiOff,
  Server
} from 'lucide-react';
import { useDeployment } from '../contexts/DeploymentContext';

interface BlockchainConnectionStatus {
  isConnected: boolean;
  currentProvider: string | null;
  lastBlockNumber: number;
  connectionTime: number;
  reconnectAttempts: number;
  providerHealth: Array<{
    name: string;
    isHealthy: boolean;
    priority: number;
    latency?: number;
    rateLimit: number;
    failureCount: number;
  }>;
  statistics: {
    totalProviders: number;
    healthyProviders: number;
    averageLatency: number;
    totalFailures: number;
  };
}

const StatusOverview: React.FC = () => {
  const { envConfig, deployments, monitoringData } = useDeployment();
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainConnectionStatus>({
    isConnected: false,
    currentProvider: null,
    lastBlockNumber: 0,
    connectionTime: 0,
    reconnectAttempts: 0,
    providerHealth: [],
    statistics: {
      totalProviders: 0,
      healthyProviders: 0,
      averageLatency: 0,
      totalFailures: 0
    }
  });

  // Fetch blockchain connection status
  useEffect(() => {
    const fetchBlockchainStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/blockchain/status');
        if (response.ok) {
          const status = await response.json();
          setBlockchainStatus(status);
        }
      } catch (error) {
        console.error('Failed to fetch blockchain status:', error);
      }
    };

    fetchBlockchainStatus();
    const interval = setInterval(fetchBlockchainStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const isConfigured = envConfig.GOERLI_RPC_URL && envConfig.PRIVATE_KEY && envConfig.ETHERSCAN_API_KEY;
  const hasDeployments = deployments.length > 0;
  const isMonitoring = monitoringData.isConnected;

  const getDeploymentStats = () => {
    const goerliDeployments = deployments.filter(d => d.network === 'goerli');
    const sepoliaDeployments = deployments.filter(d => d.network === 'sepolia');
    const totalGasUsed = deployments.reduce((sum, d) => sum + d.gasUsed, 0);
    
    return {
      goerli: goerliDeployments.length,
      sepolia: sepoliaDeployments.length,
      totalGasUsed,
      lastDeployment: deployments.length > 0 ? Math.max(...deployments.map(d => d.timestamp)) : 0
    };
  };

  const stats = getDeploymentStats();

  const statusCards = [
    {
      title: 'Environment Configuration',
      status: isConfigured ? 'Ready' : 'Setup Required',
      icon: isConfigured ? CheckCircle : AlertCircle,
      color: isConfigured ? 'success' : 'warning',
      details: [
        `RPC URLs: ${envConfig.GOERLI_RPC_URL ? '✓' : '✗'} Goerli, ${envConfig.SEPOLIA_RPC_URL ? '✓' : '✗'} Sepolia`,
        `Private Key: ${envConfig.PRIVATE_KEY ? '✓ Configured' : '✗ Missing'}`,
        `Etherscan API: ${envConfig.ETHERSCAN_API_KEY ? '✓ Configured' : '✗ Missing'}`,
        `Gas Settings: ${envConfig.GAS_PRICE_GWEI} gwei, ${envConfig.GAS_LIMIT} limit`
      ]
    },
    {
      title: 'Blockchain Connection',
      status: blockchainStatus.isConnected ? 'Connected' : 'Disconnected',
      icon: blockchainStatus.isConnected ? Wifi : WifiOff,
      color: blockchainStatus.isConnected ? 'success' : 'error',
      details: [
        `Provider: ${blockchainStatus.currentProvider || 'None'}`,
        `Current Block: #${blockchainStatus.lastBlockNumber?.toLocaleString() || '0'}`,
        `Healthy Providers: ${blockchainStatus.statistics?.healthyProviders || 0}/${blockchainStatus.statistics?.totalProviders || 0}`,
        `Reconnect Attempts: ${blockchainStatus.reconnectAttempts || 0}`,
        `Avg Latency: ${blockchainStatus.statistics?.averageLatency || 0}ms`,
        `Total Failures: ${blockchainStatus.statistics?.totalFailures || 0}`,
        `Connection Time: ${blockchainStatus.connectionTime ? new Date(blockchainStatus.connectionTime).toLocaleTimeString() : 'N/A'}`,
        `Real Data: ${process.env.REAL_DATA_ENABLED === 'true' ? 'Enabled' : 'Mock Mode'}`
      ]
    },
    {
      title: 'Smart Contract Deployments',
      status: hasDeployments ? `${deployments.length} Deployed` : 'Not Deployed',
      icon: hasDeployments ? CheckCircle : Clock,
      color: hasDeployments ? 'success' : 'info',
      details: [
        `Goerli: ${stats.goerli} deployments`,
        `Sepolia: ${stats.sepolia} deployments`,
        `Total Gas Used: ${stats.totalGasUsed.toLocaleString()}`,
        `Last Deployment: ${stats.lastDeployment ? new Date(stats.lastDeployment).toLocaleDateString() : 'Never'}`
      ]
    },
    {
      title: 'Network Monitoring',
      status: isMonitoring ? 'Active' : 'Offline',
      icon: isMonitoring ? Zap : Activity,
      color: isMonitoring ? 'success' : 'info',
      details: [
        `Connection: ${isMonitoring ? 'Connected' : 'Disconnected'}`,
        `Latest Block: ${monitoringData.latestBlock || 'Unknown'}`,
        `Gas Price: ${monitoringData.gasPrice || '0'} gwei`,
        `Balance: ${monitoringData.balance || '0'} ETH`
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Configure Environment',
      description: 'Set up RPC URLs, private keys, and API keys',
      action: 'Go to Config',
      disabled: false,
      color: 'primary'
    },
    {
      title: 'Deploy to Testnet',
      description: 'Deploy SimpleCreditScore contract to Goerli or Sepolia',
      action: 'Deploy Now',
      disabled: !isConfigured,
      color: 'success'
    },
    {
      title: 'Start Monitoring',
      description: 'Monitor real-time network activity and contract functionality',
      action: 'Start Monitor',
      disabled: !hasDeployments,
      color: 'warning'
    },
    {
      title: 'View Documentation',
      description: 'Access deployment guides and troubleshooting',
      action: 'Open Docs',
      disabled: false,
      color: 'info'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome to CryptoVault Credit Intelligence
            </h2>
            <p className="text-gray-600 mt-1">
              The world's first Autonomous Credit Intelligence Ecosystem. Manage your credit profile, analyze behavior patterns, and prove creditworthiness with zero-knowledge privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                <Icon className={`w-6 h-6 ${
                  card.color === 'success' ? 'text-green-500' :
                  card.color === 'warning' ? 'text-yellow-500' :
                  card.color === 'info' ? 'text-blue-500' : 'text-gray-500'
                }`} />
              </div>
              
              <div className={`status-badge mb-4 ${
                card.color === 'success' ? 'status-success' :
                card.color === 'warning' ? 'status-warning' :
                card.color === 'info' ? 'status-info' : 'status-error'
              }`}>
                {card.status}
              </div>
              
              <div className="space-y-2">
                {card.details.map((detail, idx) => (
                  <div key={idx} className="text-sm text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 className="font-medium text-gray-900 mb-2">{action.title}</h4>
              <p className="text-sm text-gray-600 mb-4">{action.description}</p>
              <button
                disabled={action.disabled}
                className={`btn w-full text-sm ${
                  action.color === 'primary' ? 'btn-primary' :
                  action.color === 'success' ? 'btn-success' :
                  action.color === 'warning' ? 'btn-warning' :
                  action.color === 'info' ? 'btn-secondary' : 'btn-secondary'
                }`}
              >
                {action.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Blockchain Provider Health */}
      {blockchainStatus.providerHealth.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Blockchain Provider Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blockchainStatus.providerHealth.map((provider, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                provider.isHealthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      provider.isHealthy ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900">{provider.name}</span>
                  </div>
                  <Server className={`w-4 h-4 ${
                    provider.isHealthy ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className="font-medium">{provider.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latency:</span>
                    <span className="font-medium">{provider.latency || 'N/A'}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate Limit:</span>
                    <span className="font-medium">{provider.rateLimit}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failures:</span>
                    <span className={`font-medium ${
                      provider.failureCount > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>{provider.failureCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {deployments.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Deployments</h3>
          <div className="space-y-4">
            {deployments.slice(-3).reverse().map((deployment, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    deployment.status === 'deployed' ? 'bg-green-500' :
                    deployment.status === 'verified' ? 'bg-blue-500' :
                    deployment.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900">
                      SimpleCreditScore on {deployment.network}
                    </div>
                    <div className="text-sm text-gray-600">
                      {deployment.contractAddress}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    Block #{deployment.blockNumber}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(deployment.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Requirements */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">System Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Required for Deployment</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Node.js and npm installed
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Hardhat development environment
              </li>
              <li className="flex items-center">
                {isConfigured ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                )}
                Environment variables configured
              </li>
              <li className="flex items-center">
                <Network className="w-4 h-4 text-blue-500 mr-2" />
                Testnet ETH (0.1+ ETH recommended)
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recommended Services</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <Network className="w-4 h-4 text-blue-500 mr-2" />
                Infura or Alchemy RPC provider
              </li>
              <li className="flex items-center">
                <Shield className="w-4 h-4 text-blue-500 mr-2" />
                Etherscan API for verification
              </li>
              <li className="flex items-center">
                <DollarSign className="w-4 h-4 text-blue-500 mr-2" />
                Testnet faucets for ETH
              </li>
              <li className="flex items-center">
                <Activity className="w-4 h-4 text-blue-500 mr-2" />
                Block explorer for monitoring
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusOverview;