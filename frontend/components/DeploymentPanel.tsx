import React, { useState } from 'react';
import { 
  Rocket, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  Copy,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { useDeployment } from '../contexts/DeploymentContext';

const DeploymentPanel: React.FC = () => {
  const { 
    envConfig, 
    deployments, 
    setDeployments, 
    isLoading, 
    setIsLoading, 
    addLog 
  } = useDeployment();

  const [selectedNetwork, setSelectedNetwork] = useState<'goerli' | 'sepolia'>('goerli');
  const [deploymentStep, setDeploymentStep] = useState<'idle' | 'deploying' | 'verifying' | 'complete'>('idle');

  const isConfigured = envConfig.GOERLI_RPC_URL && envConfig.PRIVATE_KEY && envConfig.ETHERSCAN_API_KEY;

  const deployContract = async (network: 'goerli' | 'sepolia') => {
    setIsLoading(true);
    setDeploymentStep('deploying');
    setSelectedNetwork(network);
    
    try {
      addLog(`🚀 Starting REAL deployment to ${network}...`);
      addLog(`📋 This will actually deploy the SimpleCreditScore contract`);
      
      const response = await fetch('/api/deployment/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ network }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Deployment failed');
      }

      const deployment = data.deployment;
      
      addLog(`✅ Contract deployed to ${network}: ${deployment.contractAddress}`);
      addLog(`📦 Block number: ${deployment.blockNumber}`);
      addLog(`⛽ Gas used: ${deployment.gasUsed.toLocaleString()}`);
      addLog(`🔗 View on Etherscan: ${getNetworkExplorer(network)}/address/${deployment.contractAddress}`);

      setDeploymentStep('verifying');
      addLog(`🔍 Verifying contract on Etherscan...`);
      
      // Try to verify the contract
      try {
        const verifyResponse = await fetch('/api/deployment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            address: deployment.contractAddress, 
            network 
          }),
        });

        const verifyData = await verifyResponse.json();
        
        if (verifyData.success && verifyData.verified) {
          deployment.verified = true;
          addLog(`✅ Contract verified successfully on Etherscan!`);
        } else {
          addLog(`⚠️ Contract deployed but verification failed: ${verifyData.message}`);
        }
      } catch (verifyError) {
        addLog(`⚠️ Contract deployed but verification failed: ${verifyError.message}`);
      }

      const newDeployment = {
        network,
        contractAddress: deployment.contractAddress,
        blockNumber: deployment.blockNumber,
        gasUsed: deployment.gasUsed,
        timestamp: deployment.timestamp,
        status: deployment.verified ? 'verified' as const : 'deployed' as const
      };
      
      setDeployments([...deployments, newDeployment]);
      setDeploymentStep('complete');
      
      setTimeout(() => {
        setDeploymentStep('idle');
      }, 3000);

    } catch (error) {
      addLog(`❌ REAL deployment failed: ${error.message}`);
      addLog(`💡 Check your environment configuration and network connection`);
      setDeploymentStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const getNetworkExplorer = (network: string) => {
    switch (network) {
      case 'goerli':
        return 'https://goerli.etherscan.io';
      case 'sepolia':
        return 'https://sepolia.etherscan.io';
      default:
        return 'https://etherscan.io';
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    addLog(`📋 Address copied: ${address}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'success';
      case 'verified':
        return 'primary';
      case 'failed':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
      case 'verified':
        return CheckCircle;
      case 'failed':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Contract Deployment</h2>
            <p className="text-gray-600 mt-1">
              Deploy SimpleCreditScore contract to Ethereum testnets
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isConfigured ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            )}
            <span className="font-medium">
              {isConfigured ? 'Ready to Deploy' : 'Configuration Required'}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Check */}
      {!isConfigured && (
        <div className="card border-yellow-200 bg-yellow-50">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900">Configuration Required</h3>
              <p className="text-yellow-800 mt-1">
                Please configure your environment variables before deploying:
              </p>
              <ul className="mt-2 text-sm text-yellow-800 space-y-1">
                <li>• {envConfig.GOERLI_RPC_URL ? '✓' : '✗'} Goerli RPC URL</li>
                <li>• {envConfig.SEPOLIA_RPC_URL ? '✓' : '✗'} Sepolia RPC URL</li>
                <li>• {envConfig.PRIVATE_KEY ? '✓' : '✗'} Private Key</li>
                <li>• {envConfig.ETHERSCAN_API_KEY ? '✓' : '✗'} Etherscan API Key</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Controls */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Deploy to Testnet</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Goerli Deployment */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h4 className="text-lg font-semibold">Goerli Testnet</h4>
              </div>
              <span className="text-sm text-gray-600">Chain ID: 5</span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Ethereum's primary testnet for application testing
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Required Balance:</span>
                <span className="font-medium">0.1+ ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Cost:</span>
                <span className="font-medium">~0.02 ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Deployment Time:</span>
                <span className="font-medium">~2-5 minutes</span>
              </div>
            </div>
            
            <button
              onClick={() => deployContract('goerli')}
              disabled={!isConfigured || isLoading}
              className="btn btn-primary w-full mt-4 flex items-center justify-center space-x-2"
            >
              {isLoading && selectedNetwork === 'goerli' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Deploy to Goerli</span>
                </>
              )}
            </button>
          </div>

          {/* Sepolia Deployment */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <h4 className="text-lg font-semibold">Sepolia Testnet</h4>
              </div>
              <span className="text-sm text-gray-600">Chain ID: 11155111</span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Newer testnet with better stability and faster sync
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Required Balance:</span>
                <span className="font-medium">0.1+ ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Cost:</span>
                <span className="font-medium">~0.02 ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Deployment Time:</span>
                <span className="font-medium">~1-3 minutes</span>
              </div>
            </div>
            
            <button
              onClick={() => deployContract('sepolia')}
              disabled={!isConfigured || isLoading}
              className="btn btn-primary w-full mt-4 flex items-center justify-center space-x-2"
            >
              {isLoading && selectedNetwork === 'sepolia' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Deploy to Sepolia</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Deployment Progress */}
        {deploymentStep !== 'idle' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">Deployment Progress</h4>
            <div className="space-y-2">
              <div className={`flex items-center space-x-2 ${
                deploymentStep === 'deploying' ? 'text-blue-600' : 'text-green-600'
              }`}>
                {deploymentStep === 'deploying' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Deploying contract to {selectedNetwork}</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                deploymentStep === 'verifying' ? 'text-blue-600' : 
                deploymentStep === 'complete' ? 'text-green-600' : 'text-gray-400'
              }`}>
                {deploymentStep === 'verifying' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : deploymentStep === 'complete' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                <span>Verifying on Etherscan</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deployment History */}
      {deployments.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Deployment History</h3>
          <div className="space-y-4">
            {deployments.map((deployment, index) => {
              const StatusIcon = getStatusIcon(deployment.status);
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <StatusIcon className={`w-5 h-5 text-${getStatusColor(deployment.status)}-500`} />
                      <div>
                        <div className="font-medium text-gray-900">
                          SimpleCreditScore on {deployment.network}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(deployment.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className={`status-badge status-${getStatusColor(deployment.status)}`}>
                      {deployment.status}
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Contract Address:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {deployment.contractAddress}
                        </code>
                        <button
                          onClick={() => copyAddress(deployment.contractAddress)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Block Number:</span>
                      <div className="font-medium mt-1">
                        #{deployment.blockNumber.toLocaleString()}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Gas Used:</span>
                      <div className="font-medium mt-1">
                        {deployment.gasUsed.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-4">
                    <a
                      href={`${getNetworkExplorer(deployment.network)}/address/${deployment.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary text-sm flex items-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View on Explorer</span>
                    </a>
                    
                    {deployment.status === 'verified' && (
                      <a
                        href={`${getNetworkExplorer(deployment.network)}/address/${deployment.contractAddress}#code`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary text-sm flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>View Source</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Testnet Resources */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Testnet Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Goerli Faucets</h4>
            <div className="space-y-2">
              <a
                href="https://goerlifaucet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Goerli Faucet</span>
              </a>
              <a
                href="https://faucets.chain.link/goerli"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Chainlink Faucet</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Sepolia Faucets</h4>
            <div className="space-y-2">
              <a
                href="https://sepoliafaucet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Sepolia Faucet</span>
              </a>
              <a
                href="https://faucets.chain.link/sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Chainlink Faucet</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentPanel;