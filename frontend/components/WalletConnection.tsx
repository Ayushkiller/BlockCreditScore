import React, { useState } from 'react';
import { Wallet, CheckCircle, Copy } from 'lucide-react';
import { useCreditIntelligence } from '../contexts/CreditIntelligenceContext';

const WalletConnection: React.FC = () => {
  const { connectedAddress, connectWallet, disconnectWallet, loading } = useCreditIntelligence();
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [inputAddress, setInputAddress] = useState('');

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