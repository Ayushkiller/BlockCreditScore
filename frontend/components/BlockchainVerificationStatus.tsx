import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  Download,
  RefreshCw,
  Hash,
  Eye
} from 'lucide-react';

interface BlockchainVerificationStatusProps {
  address: string | null;
  onVerificationChange?: (status: any) => void;
}

interface BlockchainVerifiedProfile {
  address: string;
  verificationStatus: 'verified' | 'pending' | 'failed';
  verificationMethod: 'signature' | 'transaction' | 'none';
  verificationTimestamp: number;
  verificationTxHash?: string;
  verificationBlockNumber?: number;
  realTransactionHistory: any[];
  blockchainProofs: any[];
  dataIntegrityHash: string;
  lastUpdated: number;
}

const BlockchainVerificationStatus: React.FC<BlockchainVerificationStatusProps> = ({
  address,
  onVerificationChange
}) => {
  const [profile, setProfile] = useState<BlockchainVerifiedProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showProofs, setShowProofs] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  useEffect(() => {
    if (address) {
      loadVerificationProfile();
    } else {
      setProfile(null);
    }
  }, [address]);

  const loadVerificationProfile = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/blockchain-verification/profile/${address}`);
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        onVerificationChange?.(profileData);
      } else if (response.status !== 404) {
        console.error('Failed to load verification profile');
      }
    } catch (error) {
      console.error('Error loading verification profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiateWalletVerification = async () => {
    if (!address || !window.ethereum) return;

    setVerifying(true);
    try {
      // Generate verification message
      const nonce = Math.random().toString(36).substring(2, 15);
      const timestamp = Date.now();
      const message = `Verify wallet ownership for Credit Intelligence System\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nThis signature proves you own this wallet address.`;

      // Request signature from user
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // Verify signature
      const response = await fetch('/api/blockchain-verification/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message, signature })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.verification.isValid) {
          // Reload profile to get updated verification status
          await loadVerificationProfile();
        } else {
          alert('Wallet verification failed. Please try again.');
        }
      } else {
        throw new Error('Verification request failed');
      }
    } catch (error) {
      console.error('Error verifying wallet:', error);
      alert('Failed to verify wallet. Please ensure you have MetaMask installed and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const exportBlockchainData = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/blockchain-verification/export/${address}?format=${exportFormat}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${address}-blockchain-data.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting blockchain data:', error);
      alert('Failed to export blockchain data. Please try again.');
    }
  };

  const getStatusIcon = () => {
    if (!profile) return <AlertCircle className="w-5 h-5 text-gray-400" />;
    
    switch (profile.verificationStatus) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!profile) return 'border-gray-200 bg-gray-50';
    
    switch (profile.verificationStatus) {
      case 'verified':
        return 'border-green-200 bg-green-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusText = () => {
    if (!profile) return 'Not Verified';
    
    switch (profile.verificationStatus) {
      case 'verified':
        return 'Blockchain Verified';
      case 'pending':
        return 'Verification Pending';
      case 'failed':
        return 'Verification Failed';
      default:
        return 'Unknown Status';
    }
  };

  if (!address) {
    return (
      <div className="card">
        <div className="text-center py-8 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Enter an address above to view blockchain verification status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification Status Card */}
      <div className={`card border-2 ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getStatusText()}
              </h3>
              <p className="text-sm text-gray-600">
                Wallet: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadVerificationProfile}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Refresh verification status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {!profile && (
              <button
                onClick={initiateWalletVerification}
                disabled={verifying}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {verifying ? 'Verifying...' : 'Verify Wallet'}
              </button>
            )}
          </div>
        </div>

        {profile && (
          <div className="space-y-4">
            {/* Verification Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-sm font-medium text-gray-600">Verification Method</div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {profile.verificationMethod}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-sm font-medium text-gray-600">Verified On</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(profile.verificationTimestamp).toLocaleDateString()}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-sm font-medium text-gray-600">Last Updated</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(profile.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Transaction History Summary */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Blockchain Data Summary</h4>
                <button
                  onClick={() => setShowProofs(!showProofs)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">
                    {showProofs ? 'Hide' : 'Show'} Proofs
                  </span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {profile.realTransactionHistory.length}
                  </div>
                  <div className="text-sm text-blue-700">Real Transactions</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">
                    {profile.blockchainProofs.length}
                  </div>
                  <div className="text-sm text-green-700">Blockchain Proofs</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">
                    <Hash className="w-6 h-6 mx-auto" />
                  </div>
                  <div className="text-sm text-purple-700">Data Integrity</div>
                </div>
              </div>
            </div>

            {/* Blockchain Proofs */}
            {showProofs && profile.blockchainProofs.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Recent Blockchain Proofs</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {profile.blockchainProofs.slice(0, 10).map((proof, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {proof.type} Proof
                        </div>
                        <div className="text-sm text-gray-500">
                          Block #{proof.blockNumber?.toLocaleString()} • {new Date(proof.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${proof.isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <a
                          href={proof.verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Export */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Export Blockchain Data</h4>
                  <p className="text-sm text-gray-600">
                    Download verified transaction history and blockchain proofs
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                  </select>
                  <button
                    onClick={exportBlockchainData}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Data Integrity Hash */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Data Integrity Hash</div>
              <div className="font-mono text-xs text-gray-800 break-all">
                {profile.dataIntegrityHash}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainVerificationStatus;