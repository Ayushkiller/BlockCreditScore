import React, { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import ScoreDashboard from '../components/ScoreDashboard'
import ApiTestPanel from '../components/ApiTestPanel'
import { Shield, RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const { account } = useWallet()
  const [addressToAnalyze, setAddressToAnalyze] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyzeWallet = async () => {
    if (!addressToAnalyze) {
      console.warn('No address provided for analysis')
      return
    }
    
    setIsAnalyzing(true)
    console.log(`🔍 Analyzing wallet: ${addressToAnalyze}`)
    
    // Simulate analysis delay
    setTimeout(() => {
      setIsAnalyzing(false)
      console.log('✅ Wallet analysis completed')
    }, 2000)
  }

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Decentralized Credit Scoring
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Generate transparent, trustable crypto credit scores based on your on-chain activity. 
          Connect your wallet or analyze any Ethereum address.
        </p>
      </div>

      {/* Wallet Analysis Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Analyze Any Wallet</h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter any Ethereum address to analyze credit score and behavior patterns
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={addressToAnalyze}
              onChange={(e) => setAddressToAnalyze(e.target.value)}
              placeholder="Enter wallet address (0x...)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {addressToAnalyze && !isValidAddress(addressToAnalyze) && (
              <p className="text-red-500 text-xs mt-1">Please enter a valid Ethereum address</p>
            )}
          </div>
          <button
            onClick={handleAnalyzeWallet}
            disabled={!addressToAnalyze || !isValidAddress(addressToAnalyze) || isAnalyzing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Analyze Wallet</span>
              </>
            )}
          </button>
          {addressToAnalyze && (
            <button
              onClick={() => setAddressToAnalyze('')}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Quick test addresses */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Quick test addresses:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                '0x742C42ca2F8B7Cb662bD9aE8A7d4B5c2F6F03B3e',
                '0x8Ba1f109551bD432803012645Hac136c22C501C',
                '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
              ].map((addr) => (
                <button
                  key={addr}
                  onClick={() => setAddressToAnalyze(addr)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  {addr.slice(0, 6)}...{addr.slice(-4)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Status */}
        {addressToAnalyze && isValidAddress(addressToAnalyze) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Ready to analyze: {addressToAnalyze.slice(0, 10)}...{addressToAnalyze.slice(-8)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* API Test Panel - Temporary for testing */}
      <ApiTestPanel />

      {/* Main Content */}
      {account || (addressToAnalyze && isValidAddress(addressToAnalyze)) ? (
        <ScoreDashboard addressOverride={addressToAnalyze || account} />
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Get Started
            </h3>
            <p className="text-gray-600 mb-6">
              Connect your wallet or enter an address above to analyze credit scores and on-chain behavior.
            </p>
          </div>
          
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Transaction history analysis</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Staking and DeFi activity</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>ML-powered credit scoring</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Transparent scoring algorithm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}