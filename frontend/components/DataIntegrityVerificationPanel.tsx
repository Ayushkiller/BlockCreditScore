import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Hash, 
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Search,
  Filter
} from 'lucide-react';

interface DataIntegrityVerificationPanelProps {
  address: string | null;
}

interface DataIntegrityRecord {
  id: string;
  dataType: 'calculation' | 'transaction' | 'score' | 'profile';
  inputData: any;
  computationResult: any;
  blockchainReferences: BlockchainReference[];
  integrityHash: string;
  timestamp: number;
  verificationStatus: 'verified' | 'pending' | 'failed';
  auditTrail: AuditTrailEntry[];
}

interface BlockchainReference {
  type: 'transaction' | 'block' | 'event' | 'contract_call';
  hash: string;
  blockNumber: number;
  timestamp: number;
  verificationUrl: string;
  isValid: boolean;
  confirmations: number;
}

interface AuditTrailEntry {
  id: string;
  action: string;
  timestamp: number;
  blockNumber?: number;
  transactionHash?: string;
  inputHash: string;
  outputHash: string;
  verificationProof: string;
  isVerifiable: boolean;
}

interface VerificationStatistics {
  totalRecords: number;
  verifiedRecords: number;
  pendingRecords: number;
  failedRecords: number;
  totalBlockchainReferences: number;
  validBlockchainReferences: number;
  totalAuditEntries: number;
  verifiableAuditEntries: number;
  dataTypes: { [key: string]: number };
  averageConfirmations: number;
}

const DataIntegrityVerificationPanel: React.FC<DataIntegrityVerificationPanelProps> = ({
  address
}) => {
  const [integrityRecords, setIntegrityRecords] = useState<DataIntegrityRecord[]>([]);
  const [statistics, setStatistics] = useState<VerificationStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DataIntegrityRecord | null>(null);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationResults, setVerificationResults] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (address) {
      loadDataIntegrityRecords();
    }
  }, [address]);

  const loadDataIntegrityRecords = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/data-integrity/records/${address}`);
      if (response.ok) {
        const data = await response.json();
        setIntegrityRecords(data.records || []);
        setStatistics(data.statistics || null);
      }
    } catch (error) {
      console.error('Error loading data integrity records:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyRecord = async (recordId: string) => {
    try {
      const response = await fetch(`/api/data-integrity/verify/${recordId}`, {
        method: 'POST'
      });
      if (response.ok) {
        const result = await response.json();
        setVerificationResults(prev => ({
          ...prev,
          [recordId]: result.isValid
        }));
      }
    } catch (error) {
      console.error('Error verifying record:', error);
    }
  };

  const exportIntegrityData = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/data-integrity/export/${address}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${address}-data-integrity.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting integrity data:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const filteredRecords = integrityRecords.filter(record => {
    const matchesFilter = filterType === 'all' || record.dataType === filterType;
    const matchesSearch = searchTerm === '' || 
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.integrityHash.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!address) {
    return (
      <div className="card">
        <div className="text-center py-8 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Connect a wallet to view data integrity verification</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Data Integrity & Verification
              </h3>
              <p className="text-sm text-gray-600">
                Blockchain-verifiable computation inputs and audit trails
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDataIntegrityRecords}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={exportIntegrityData}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-900">
                {statistics.totalRecords}
              </div>
              <div className="text-sm text-blue-700">Total Records</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-900">
                {statistics.verifiedRecords}
              </div>
              <div className="text-sm text-green-700">Verified</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-900">
                {statistics.validBlockchainReferences}
              </div>
              <div className="text-sm text-yellow-700">Valid References</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-900">
                {statistics.averageConfirmations}
              </div>
              <div className="text-sm text-purple-700">Avg Confirmations</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Types</option>
              <option value="calculation">Calculations</option>
              <option value="transaction">Transactions</option>
              <option value="score">Scores</option>
              <option value="profile">Profiles</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 flex-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID or hash..."
              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <div key={record.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(record.verificationStatus)}
                <div>
                  <div className="font-medium text-gray-900">
                    {record.dataType.charAt(0).toUpperCase() + record.dataType.slice(1)} Record
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(record.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs border ${getStatusColor(record.verificationStatus)}`}>
                  {record.verificationStatus}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => verifyRecord(record.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Verify
                </button>
                <button
                  onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                  className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {selectedRecord?.id === record.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Record Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Blockchain References</div>
                <div className="text-lg font-semibold text-gray-900">
                  {record.blockchainReferences.length}
                </div>
                <div className="text-xs text-gray-500">
                  {record.blockchainReferences.filter(ref => ref.isValid).length} valid
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Audit Entries</div>
                <div className="text-lg font-semibold text-gray-900">
                  {record.auditTrail.length}
                </div>
                <div className="text-xs text-gray-500">
                  {record.auditTrail.filter(entry => entry.isVerifiable).length} verifiable
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Verification Result</div>
                <div className="text-lg font-semibold text-gray-900">
                  {verificationResults[record.id] !== undefined ? (
                    verificationResults[record.id] ? (
                      <span className="text-green-600">✓ Valid</span>
                    ) : (
                      <span className="text-red-600">✗ Invalid</span>
                    )
                  ) : (
                    <span className="text-gray-500">Not tested</span>
                  )}
                </div>
              </div>
            </div>

            {/* Integrity Hash */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="text-sm font-medium text-gray-600 mb-1 flex items-center">
                <Hash className="w-4 h-4 mr-1" />
                Integrity Hash
              </div>
              <div className="font-mono text-xs text-gray-800 break-all">
                {record.integrityHash}
              </div>
            </div>

            {/* Expanded Details */}
            {selectedRecord?.id === record.id && (
              <div className="space-y-4 border-t pt-4">
                {/* Blockchain References */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Blockchain References</h4>
                  <div className="space-y-2">
                    {record.blockchainReferences.map((ref, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {ref.type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-500">
                            Block #{ref.blockNumber.toLocaleString()} • {ref.confirmations} confirmations
                          </div>
                          <div className="font-mono text-xs text-gray-600">
                            {ref.hash}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${ref.isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <a
                            href={ref.verificationUrl}
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

                {/* Audit Trail */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Audit Trail</h4>
                    <button
                      onClick={() => setShowAuditTrail(!showAuditTrail)}
                      className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                    >
                      {showAuditTrail ? 'Hide' : 'Show'} Details
                    </button>
                  </div>
                  
                  {showAuditTrail && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {record.auditTrail.map((entry, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900">
                              {entry.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${entry.isVerifiable ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Input Hash:</span>
                              <div className="font-mono text-gray-800 break-all">
                                {entry.inputHash.slice(0, 16)}...
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Output Hash:</span>
                              <div className="font-mono text-gray-800 break-all">
                                {entry.outputHash.slice(0, 16)}...
                              </div>
                            </div>
                          </div>
                          
                          {entry.transactionHash && (
                            <div className="mt-2 text-xs">
                              <span className="text-gray-600">Transaction:</span>
                              <a
                                href={`https://etherscan.io/tx/${entry.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-blue-600 hover:text-blue-800 font-mono"
                              >
                                {entry.transactionHash.slice(0, 16)}...
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && !loading && (
        <div className="card text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No data integrity records found</p>
          <p className="text-sm text-gray-500 mt-1">
            Records will appear here as calculations and verifications are performed
          </p>
        </div>
      )}
    </div>
  );
};

export default DataIntegrityVerificationPanel;