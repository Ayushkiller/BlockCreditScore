import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle, Copy, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useCreditIntelligence } from '../contexts/CreditIntelligenceContext';

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
  }>;
}

const WalletConnection: React.FC = () => {
  const { connectedAddress, connectWallet, disconnectWallet, loading } = useCreditIntelligence();
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [inputAddress, setInputAddress] = useState('');
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainConnectionStatus>({
    isConnected: false,
    currentProvider: null,
    lastBlockNumber: 0,
    connectionTime: 0,
    reconnectAttempts: 0,
    providerHealth: []
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
    const interval = setInterval(fetchBlockchainStatus, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    if (inputAddress.trim()) {
      await connectWallet(inputAddress.trim());
      setShowAddressInput(false);
      setInputAddress('');
    }
  };

  const handleDemoConnect = async () => {
    // Connect with a realistic demo address for testing
    const demoAddresses = [
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik's address
      '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Uniswap address
      '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Random active address
      '0x8ba1f109551bD432803012645aac136c22C57592', // Another active address
    ];
    const randomAddress = demoAddresses[Math.floor(Math.random() * demoAddresses.length)];
    await connectWallet(randomAddress);
  };

  const copyAddress = () => {
    if (connectedAddress) {
      navigator.clipboard.writeText(connectedAddress);
    }
  };

  if (connectedAddress) {
    return (
      <div className="space-y-3">
        {/* Wallet Connection Status */}
        <div className="flex items-center space-x-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-green-900">
              {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
            </span>
            <button
              onClick={copyAddress}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={disconnectWallet}
            className="text-sm text-green-700 hover:text-green-900 font-medium"
          >
            Disconnect
          </button>
        </div>

        {/* Blockchain Connection Status */}
        <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${
          blockchainStatus.isConnected 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          {blockchainStatus.isConnected ? (
            <Wifi className="w-5 h-5 text-blue-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
          <div className="flex-1">
            <div className={`text-sm font-medium ${
              blockchainStatus.isConnected ? 'text-blue-900' : 'text-red-900'
            }`}>
              {blockchainStatus.isConnected ? 'Blockchain Connected' : 'Blockchain Disconnected'}
            </div>
            <div className={`text-xs ${
              blockchainStatus.isConnected ? 'text-blue-700' : 'text-red-700'
            }`}>
              {blockchainStatus.isConnected ? (
                <>
                  Provider: {blockchainStatus.currentProvider} | Block: #{blockchainStatus.lastBlockNumber.toLocaleString()}
                </>
              ) : (
                <>
                  {blockchainStatus.statistics?.healthyProviders === 0 
                    ? 'No healthy providers available' 
                    : `Reconnect attempts: ${blockchainStatus.reconnectAttempts}`}
                </>
              )}
            </div>
          </div>
          {blockchainStatus.reconnectAttempts > 0 && (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
        </div>

        {/* Provider Health Status */}
        {blockchainStatus.providerHealth.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-2">Provider Health</div>
            <div className="space-y-1">
              {blockchainStatus.providerHealth.map((provider, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      provider.isHealthy ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-gray-700">{provider.name}</span>
                    <span className="text-gray-500">(Priority: {provider.priority})</span>
                  </div>
                  {provider.latency && (
                    <span className="text-gray-500">{provider.latency}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {!showAddressInput ? (
        <>
          <button
            onClick={handleDemoConnect}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Wallet className="w-4 h-4" />
            <span>{loading ? 'Connecting...' : 'Demo Wallet'}</span>
          </button>
          <button
            onClick={() => setShowAddressInput(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            <span>Custom Address</span>
          </button>
        </>
      ) : (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            placeholder="Enter Ethereum address..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
          />
          <button
            onClick={handleConnect}
            disabled={loading || !inputAddress.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
          <button
            onClick={() => {
              setShowAddressInput(false);
              setInputAddress('');
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;