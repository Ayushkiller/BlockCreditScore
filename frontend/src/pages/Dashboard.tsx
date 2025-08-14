import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import ScoreDashboard from '../components/ScoreDashboard'
import ApiTestPanel from '../components/ApiTestPanel'

export default function Dashboard() {
  const { account } = useWallet()

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Decentralized Credit Scoring
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Generate transparent, trustable crypto credit scores based on your on-chain activity. 
          Connect your wallet to get started.
        </p>
      </div>

      {/* API Test Panel - Temporary for testing */}
      <ApiTestPanel />

      {/* Main Content */}
      {account ? (
        <ScoreDashboard />
      ) : (
        <div className="card text-center max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600">
              Connect your Ethereum wallet to generate your credit score based on your on-chain activity.
            </p>
          </div>
          
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Transaction history analysis</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Staking and DeFi activity</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
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