import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  CheckCircle,
  AlertTriangle,
  Copy,
  Download,
  Settings,
  Zap
} from 'lucide-react';

interface ZKProof {
  id: string;
  type: 'threshold' | 'selective' | 'full';
  status: 'generating' | 'ready' | 'verified' | 'expired';
  threshold?: number;
  dimensions?: string[];
  proof: string;
  timestamp: number;
  expiresAt: number;
}

const PrivacyPanel: React.FC = () => {
  const [privacyMode, setPrivacyMode] = useState(false);
  const [selectedProofType, setSelectedProofType] = useState<'threshold' | 'selective' | 'full'>('threshold');
  const [thresholdValue, setThresholdValue] = useState(700);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['defi', 'staking']);
  const [activeProofs, setActiveProofs] = useState<ZKProof[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const dimensions = [
    { id: 'defi', name: 'DeFi Reliability', score: 892 },
    { id: 'trading', name: 'Trading Consistency', score: 734 },
    { id: 'staking', name: 'Staking Commitment', score: 923 },
    { id: 'governance', name: 'Governance Participation', score: 612 },
    { id: 'liquidity', name: 'Liquidity Provider', score: 856 }
  ];

  const mockProofs: ZKProof[] = [
    {
      id: '1',
      type: 'threshold',
      status: 'ready',
      threshold: 700,
      proof: 'zk1qw2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6q7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5z6x7c8v9b0n1m2q3w4e5r6t7y8u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8q9w0e1r2t3y4u5i6o7p8a9s0d1f2g3h4j5k6l7z8x9c0v1b2n3m4q5w6e7r8t9y0u1i2o3p4a5s6d7f8g9h0j1k2l3z4x5c6v7b8n9m0q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6',
      timestamp: Date.now() - 3600000,
      expiresAt: Date.now() + 82800000
    },
    {
      id: '2',
      type: 'selective',
      status: 'verified',
      dimensions: ['defi', 'staking'],
      proof: 'zk2a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6q7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5z6x7c8v9b0n1m2q3w4e5r6t7y8u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8q9w0e1r2t3y4u5i6o7p8a9s0d1f2g3h4j5k6l7z8x9c0v1b2n3m4q5w6e7r8t9y0u1i2o3p4a5s6d7f8g9h0j1k2l3z4x5c6v7b8n9m0q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6q7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5z6x7c8v9b0n1m2q3w4e5r6t7y8u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8q9w0e1r2t3y4u5i6o7p8a9s0d1f2g3h4j5k6l7z8x9c0v1b2n3m4q5w6e7r8t9y0u1i2o3p4a5s6d7f8g9h0j1k2l3z4x5c6v7b8n9m0q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6',
      timestamp: Date.now() - 7200000,
      expiresAt: Date.now() + 75600000
    }
  ];

  const generateProof = async () => {
    setIsGenerating(true);
    
    // Simulate proof generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newProof: ZKProof = {
      id: Date.now().toString(),
      type: selectedProofType,
      status: 'ready',
      threshold: selectedProofType === 'threshold' ? thresholdValue : undefined,
      dimensions: selectedProofType === 'selective' ? selectedDimensions : undefined,
      proof: `zk${Math.random().toString(36).substring(2)}${Date.now()}`,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000 // 24 hours
    };
    
    setActiveProofs([newProof, ...activeProofs]);
    setIsGenerating(false);
  };

  const copyProof = (proof: string) => {
    navigator.clipboard.writeText(proof);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-100';
      case 'verified': return 'text-blue-600 bg-blue-100';
      case 'generating': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProofTypeIcon = (type: string) => {
    switch (type) {
      case 'threshold': return Shield;
      case 'selective': return Eye;
      case 'full': return Lock;
      default: return Key;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Privacy & Zero-Knowledge Proofs</h2>
            <p className="text-gray-600 mt-1">
              Prove your creditworthiness without revealing sensitive transaction details
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                privacyMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{privacyMode ? 'Privacy Mode ON' : 'Privacy Mode OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Privacy Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Data Visibility Controls</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={!privacyMode} 
                  onChange={(e) => setPrivacyMode(!e.target.checked)} 
                  className="rounded" 
                />
                <span className="text-sm">Show credit scores publicly</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Allow peer comparisons</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Enable social credit features</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Share analytics with protocols</span>
              </label>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4">ZK Proof Preferences</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Auto-generate threshold proofs</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Require proof verification</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Enable selective disclosure</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Store proofs locally only</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ZK Proof Generator */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Zap className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">Generate ZK Proof</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Proof Type</label>
            <select
              value={selectedProofType}
              onChange={(e) => setSelectedProofType(e.target.value as any)}
              className="input mb-4"
            >
              <option value="threshold">Threshold Proof (Score above X)</option>
              <option value="selective">Selective Disclosure (Specific dimensions)</option>
              <option value="full">Full Privacy (Complete verification)</option>
            </select>
            
            {selectedProofType === 'threshold' && (
              <div>
                <label className="label">Minimum Score Threshold</label>
                <input
                  type="number"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(parseInt(e.target.value))}
                  min="0"
                  max="1000"
                  className="input"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Prove your score is above {thresholdValue} without revealing the exact value
                </div>
              </div>
            )}
            
            {selectedProofType === 'selective' && (
              <div>
                <label className="label">Select Dimensions to Disclose</label>
                <div className="space-y-2">
                  {dimensions.map((dim) => (
                    <label key={dim.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedDimensions.includes(dim.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDimensions([...selectedDimensions, dim.id]);
                          } else {
                            setSelectedDimensions(selectedDimensions.filter(d => d !== dim.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{dim.name} ({privacyMode ? '***' : dim.score})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Proof Preview</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Type: <span className="font-medium capitalize">{selectedProofType}</span></div>
                {selectedProofType === 'threshold' && (
                  <div>Threshold: <span className="font-medium">{thresholdValue}+</span></div>
                )}
                {selectedProofType === 'selective' && (
                  <div>Dimensions: <span className="font-medium">{selectedDimensions.length} selected</span></div>
                )}
                <div>Validity: <span className="font-medium">24 hours</span></div>
                <div>Privacy: <span className="font-medium text-green-600">Full</span></div>
              </div>
              
              <button
                onClick={generateProof}
                disabled={isGenerating}
                className="btn btn-primary w-full mt-4 flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Generate Proof</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Proofs */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Active ZK Proofs</h3>
        
        {activeProofs.length === 0 && mockProofs.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Proofs</h4>
            <p className="text-gray-600">Generate your first ZK proof to start proving your creditworthiness privately</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...activeProofs, ...mockProofs].map((proof) => {
              const Icon = getProofTypeIcon(proof.type);
              const timeLeft = Math.max(0, proof.expiresAt - Date.now());
              const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
              
              return (
                <div key={proof.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Icon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {proof.type} Proof
                        </h4>
                        <div className="text-sm text-gray-600">
                          Generated {new Date(proof.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proof.status)}`}>
                        {proof.status.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {hoursLeft > 0 ? `${hoursLeft}h remaining` : 'Expired'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    {proof.type === 'threshold' && (
                      <div className="text-sm text-gray-600">
                        Proves score is above <span className="font-medium">{proof.threshold}</span>
                      </div>
                    )}
                    {proof.type === 'selective' && (
                      <div className="text-sm text-gray-600">
                        Discloses: <span className="font-medium">{proof.dimensions?.join(', ')}</span>
                      </div>
                    )}
                    {proof.type === 'full' && (
                      <div className="text-sm text-gray-600">
                        Complete privacy-preserving verification
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">ZK Proof</span>
                      <button
                        onClick={() => copyProof(proof.proof)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-600 break-all">
                      {proof.proof.substring(0, 100)}...
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button className="btn btn-secondary text-sm">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </button>
                    <button className="btn btn-primary text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Verify
                    </button>
                    {proof.status === 'ready' && (
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        Share with Protocol →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Privacy Education */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Understanding Zero-Knowledge Proofs</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold text-blue-900 mb-2">Threshold Proofs</h4>
            <p className="text-sm text-blue-800">
              Prove your credit score is above a certain threshold without revealing the exact score
            </p>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <Eye className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold text-green-900 mb-2">Selective Disclosure</h4>
            <p className="text-sm text-green-800">
              Choose which credit dimensions to reveal while keeping others completely private
            </p>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <Lock className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h4 className="font-semibold text-purple-900 mb-2">Full Privacy</h4>
            <p className="text-sm text-purple-800">
              Verify your entire credit profile without exposing any underlying transaction data
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Important Privacy Note</h4>
              <p className="text-yellow-800 text-sm mt-1">
                Zero-knowledge proofs provide mathematical guarantees that your private data remains secure. 
                However, always verify the implementation and audit reports before using in production environments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPanel;