import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Play, User } from 'lucide-react';

interface ContractTestResult {
  success: boolean;
  contractAddress?: string;
  contractOwner?: string;
  testAddress?: string;
  profile?: {
    exists: boolean;
    userAddress: string;
    lastUpdated: string;
  };
  compositeScore?: {
    score: string;
    confidence: string;
  };
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  message?: string;
  error?: string;
}

export default function ContractTestPanel() {
  const [testAddress, setTestAddress] = useState('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // Vitalik's address as default
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ContractTestResult | null>(null);
  const [profileResult, setProfileResult] = useState<ContractTestResult | null>(null);

  const testContractConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      const response = await fetch('/api/contract/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testAddress })
      });

      const result = await response.json();
      setConnectionResult(result);
    } catch (error) {
      setConnectionResult({
        success: false,
        message: 'Network error',
        error: error.message
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const createCreditProfile = async () => {
    setIsCreatingProfile(true);
    setProfileResult(null);

    try {
      const response = await fetch('/api/contract/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: testAddress })
      });

      const result = await response.json();
      setProfileResult(result);
      
      // Refresh connection test to see updated profile
      if (result.success) {
        setTimeout(() => testContractConnection(), 1000);
      }
    } catch (error) {
      setProfileResult({
        success: false,
        message: 'Network error',
        error: error.message
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Contract Integration Test</h2>
      
      {/* Test Address Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Address
        </label>
        <input
          type="text"
          value={testAddress}
          onChange={(e) => setTestAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0x..."
        />
      </div>

      {/* Test Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={testContractConnection}
          disabled={isTestingConnection}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isTestingConnection ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>Test Connection</span>
        </button>

        <button
          onClick={createCreditProfile}
          disabled={isCreatingProfile}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isCreatingProfile ? <Clock className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
          <span>Create Profile</span>
        </button>
      </div>

      {/* Connection Test Results */}
      {connectionResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
            {connectionResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span>Connection Test Results</span>
          </h3>
          
          <div className="bg-gray-50 rounded-md p-4 space-y-2">
            {connectionResult.success ? (
              <>
                <div><strong>Contract Address:</strong> {connectionResult.contractAddress}</div>
                <div><strong>Contract Owner:</strong> {connectionResult.contractOwner}</div>
                <div><strong>Test Address:</strong> {connectionResult.testAddress}</div>
                
                {connectionResult.profile && (
                  <div className="mt-3">
                    <strong>Profile Status:</strong>
                    <div className="ml-4">
                      <div>Exists: {connectionResult.profile.exists ? '✅ Yes' : '❌ No'}</div>
                      {connectionResult.profile.exists && (
                        <>
                          <div>User Address: {connectionResult.profile.userAddress}</div>
                          <div>Last Updated: {new Date(parseInt(connectionResult.profile.lastUpdated) * 1000).toLocaleString()}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {connectionResult.compositeScore && (
                  <div className="mt-3">
                    <strong>Composite Score:</strong>
                    <div className="ml-4">
                      <div>Score: {connectionResult.compositeScore.score}/1000</div>
                      <div>Confidence: {connectionResult.compositeScore.confidence}%</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-red-600">
                <div><strong>Error:</strong> {connectionResult.message}</div>
                {connectionResult.error && <div><strong>Details:</strong> {connectionResult.error}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Creation Results */}
      {profileResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
            {profileResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span>Profile Creation Results</span>
          </h3>
          
          <div className="bg-gray-50 rounded-md p-4 space-y-2">
            {profileResult.success ? (
              <>
                <div><strong>Message:</strong> {profileResult.message}</div>
                {profileResult.transactionHash && (
                  <>
                    <div><strong>Transaction Hash:</strong> {profileResult.transactionHash}</div>
                    <div><strong>Block Number:</strong> {profileResult.blockNumber}</div>
                    <div><strong>Gas Used:</strong> {profileResult.gasUsed}</div>
                  </>
                )}
                
                {profileResult.profile && (
                  <div className="mt-3">
                    <strong>Created Profile:</strong>
                    <div className="ml-4">
                      <div>Exists: {profileResult.profile.exists ? '✅ Yes' : '❌ No'}</div>
                      <div>User Address: {profileResult.profile.userAddress}</div>
                      <div>Last Updated: {new Date(parseInt(profileResult.profile.lastUpdated) * 1000).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-red-600">
                <div><strong>Error:</strong> {profileResult.message}</div>
                {profileResult.error && <div><strong>Details:</strong> {profileResult.error}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* End-to-End Test Section */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">End-to-End Credit Scoring Test</h3>
        <EndToEndTest testAddress={testAddress} />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-md p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Test Instructions:</h4>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
          <li>Enter a valid Ethereum address to test with</li>
          <li>Click "Test Connection" to verify contract is deployed and accessible</li>
          <li>Click "Create Profile" to create a credit profile for the address</li>
          <li>Use the End-to-End test to update scores and verify the complete flow</li>
        </ol>
      </div>
    </div>
  );
}

// End-to-End Test Component
function EndToEndTest({ testAddress }: { testAddress: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState('');

  const runEndToEndTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentStep('Starting end-to-end test...');

    const results = [];

    try {
      // Step 1: Create profile if it doesn't exist
      setCurrentStep('Step 1: Creating credit profile...');
      const profileResponse = await fetch('/api/contract/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: testAddress })
      });
      const profileResult = await profileResponse.json();
      results.push({ step: 'Create Profile', ...profileResult });

      // Step 2: Update different score dimensions
      const dimensions = ['DEFI_RELIABILITY', 'TRADING_CONSISTENCY', 'STAKING_COMMITMENT'];
      
      for (const dimension of dimensions) {
        setCurrentStep(`Step 2: Updating ${dimension} score...`);
        const updateResponse = await fetch('/api/contract/update-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userAddress: testAddress, 
            dimension,
            transactionData: { mockData: true } // Mock transaction data
          })
        });
        const updateResult = await updateResponse.json();
        results.push({ step: `Update ${dimension}`, ...updateResult });
      }

      // Step 3: Retrieve all scores
      setCurrentStep('Step 3: Retrieving all scores...');
      const scoresResponse = await fetch(`/api/contract/get-scores?address=${testAddress}`);
      const scoresResult = await scoresResponse.json();
      results.push({ step: 'Get All Scores', ...scoresResult });

      setCurrentStep('✅ End-to-end test completed successfully!');
      
    } catch (error) {
      results.push({ 
        step: 'Error', 
        success: false, 
        message: 'Test failed', 
        error: error.message 
      });
      setCurrentStep('❌ End-to-end test failed');
    } finally {
      setTestResults(results);
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={runEndToEndTest}
        disabled={isRunning}
        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
      >
        {isRunning ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        <span>Run End-to-End Test</span>
      </button>

      {currentStep && (
        <div className="text-sm text-gray-600 font-medium">
          {currentStep}
        </div>
      )}

      {testResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold">Test Results:</h4>
          {testResults.map((result, index) => (
            <div key={index} className="bg-gray-50 rounded-md p-3">
              <div className="flex items-center space-x-2 mb-2">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="font-medium">{result.step}</span>
              </div>
              
              {result.success ? (
                <div className="text-sm text-gray-600 space-y-1">
                  {result.transactionHash && (
                    <div>Transaction: {result.transactionHash}</div>
                  )}
                  {result.dimension && (
                    <div>
                      Score: {result.dimension.score}/1000 
                      (Confidence: {result.dimension.confidence}%)
                    </div>
                  )}
                  {result.compositeScore && (
                    <div>
                      Composite Score: {result.compositeScore.score}/1000
                      (Confidence: {result.compositeScore.confidence}%)
                    </div>
                  )}
                  {result.dimensions && (
                    <div>
                      <div className="font-medium">All Dimensions:</div>
                      {result.dimensions.map((dim: any, i: number) => (
                        <div key={i} className="ml-2">
                          {dim.name}: {dim.score}/1000 ({dim.confidence}% confidence)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  Error: {result.message || result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}