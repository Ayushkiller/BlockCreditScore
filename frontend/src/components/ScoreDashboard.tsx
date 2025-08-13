import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { apiService, type CreditScore } from '../services/apiService'
import WalletSwitchGuide from './WalletSwitchGuide'

interface BreakdownComponentProps {
  label: string
  value: number
  percentage: string
  maxValue?: number
}

// Circular Progress Component
function CircularProgress({ score }: { score: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 1000) * circumference

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 144 144">
        {/* Background circle */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-out ${
            score >= 800 ? 'text-success-500' : 
            score >= 600 ? 'text-warning-500' : 'text-danger-500'
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            score >= 800 ? 'text-success-600' : 
            score >= 600 ? 'text-warning-600' : 'text-danger-600'
          }`}>
            {score}
          </div>
          <div className="text-xs text-gray-500">/ 1000</div>
        </div>
      </div>
    </div>
  )
}

// Breakdown Component with Progress Bar
function BreakdownComponent({ label, value, percentage, maxValue = 300 }: BreakdownComponentProps) {
  const progressPercentage = Math.min((value / maxValue) * 100, 100)
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
              value >= maxValue * 0.8 ? 'bg-success-500' :
              value >= maxValue * 0.6 ? 'bg-warning-500' : 'bg-danger-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 w-12 text-right">{percentage}</span>
      </div>
    </div>
  )
}

export default function ScoreDashboard() {
  const { account } = useWallet()
  const [score, setScore] = useState<CreditScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputAddress, setInputAddress] = useState('')
  const [currentAddress, setCurrentAddress] = useState<string | null>(null)

  useEffect(() => {
    if (account) {
      setInputAddress(account)
      // Don't automatically fetch score - let user decide
    }
  }, [account])

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const fetchScore = async (address?: string) => {
    const targetAddress = address || currentAddress
    if (!targetAddress) return

    setLoading(true)
    setError(null)

    try {
      const scoreData = await apiService.getCreditScore(targetAddress)
      setScore(scoreData)
      setCurrentAddress(targetAddress)
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the score')
      setScore(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshScore = async () => {
    if (!currentAddress) return

    setLoading(true)
    setError(null)

    try {
      const scoreData = await apiService.refreshCreditScore(currentAddress)
      setScore(scoreData)
    } catch (err: any) {
      setError(err.message || 'An error occurred while refreshing the score')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputAddress.trim()) {
      setError('Please enter an Ethereum address')
      return
    }

    if (!isValidAddress(inputAddress.trim())) {
      setError('Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)')
      return
    }

    fetchScore(inputAddress.trim())
  }

  const handleUseConnectedWallet = () => {
    if (account) {
      setInputAddress(account)
      fetchScore(account)
    }
  }

  const getScoreLabel = (score: number) => {
    if (score >= 800) return 'Excellent'
    if (score >= 700) return 'Good'
    if (score >= 600) return 'Fair'
    return 'Poor'
  }

  // Address Input Form - Always show this at the top
  const renderAddressInputForm = () => (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Analyze Wallet Credit Score</h2>
      <form onSubmit={handleAddressSubmit} className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Ethereum Address
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              id="address"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="0x1234567890123456789012345678901234567890"
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputAddress.trim()}
              className="btn-primary whitespace-nowrap"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
        
        {account && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Connected wallet: {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button
              type="button"
              onClick={handleUseConnectedWallet}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              disabled={loading}
            >
              Use Connected Wallet
            </button>
          </div>
        )}
      </form>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <WalletSwitchGuide />
        {renderAddressInputForm()}
        <div className="card text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-6"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Wallet</h3>
          <p className="text-gray-600">
            Calculating credit score for {currentAddress ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : 'address'}
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <WalletSwitchGuide />
        {renderAddressInputForm()}
        <div className="card text-center">
          <div className="w-20 h-20 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Unable to Load Credit Score</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
          <div className="space-x-3">
            <button onClick={() => fetchScore()} className="btn-primary">
              Try Again
            </button>
            {currentAddress && (
              <button onClick={refreshScore} className="btn-secondary">
                Force Refresh
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!score && !loading && !error) {
    return (
      <div className="space-y-6">
        <WalletSwitchGuide />
        {renderAddressInputForm()}
        <div className="card text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
          <p className="text-gray-600 mb-4">Enter any Ethereum address above to generate a credit score</p>
        </div>
      </div>
    )
  }

  if (!score) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Wallet Switch Guide */}
      <WalletSwitchGuide />
      
      {/* Address Input Form */}
      {renderAddressInputForm()}

      {/* Main Score Display with Circular Progress */}
      <div className="card text-center">
        <div className="mb-8">
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Analyzing Address:</div>
            <div className="text-lg font-mono text-gray-900 break-all">
              {score.address}
            </div>
          </div>
          <CircularProgress score={score.score} />
          <div className="mt-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {getScoreLabel(score.score)} Credit Score
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(score.timestamp * 1000).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-3">
          <button onClick={refreshScore} className="btn-primary" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Score'}
          </button>
          <button onClick={() => fetchScore()} className="btn-secondary">
            Reload
          </button>
        </div>
      </div>

      {/* Detailed Score Breakdown with Progress Bars */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Score Components</h3>
          <div className="text-sm text-gray-500">
            Total: {score.breakdown.transactionVolume + score.breakdown.transactionFrequency + 
                    score.breakdown.stakingActivity + score.breakdown.defiInteractions} points
          </div>
        </div>
        
        <div className="space-y-6">
          <BreakdownComponent
            label="Transaction Volume (30%)"
            value={score.breakdown.transactionVolume}
            percentage="30%"
            maxValue={300}
          />
          
          <BreakdownComponent
            label="Transaction Frequency (25%)"
            value={score.breakdown.transactionFrequency}
            percentage="25%"
            maxValue={250}
          />
          
          <BreakdownComponent
            label="Staking Activity (25%)"
            value={score.breakdown.stakingActivity}
            percentage="25%"
            maxValue={250}
          />
          
          <BreakdownComponent
            label="DeFi Interactions (20%)"
            value={score.breakdown.defiInteractions}
            percentage="20%"
            maxValue={200}
          />
        </div>
      </div>

      {/* Score Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Score Range Guide */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Ranges</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Excellent (800-1000)</div>
                <div className="text-xs text-gray-500">High creditworthiness</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-success-400 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Good (700-799)</div>
                <div className="text-xs text-gray-500">Strong credit profile</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Fair (600-699)</div>
                <div className="text-xs text-gray-500">Moderate creditworthiness</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Poor (0-599)</div>
                <div className="text-xs text-gray-500">Limited credit history</div>
              </div>
            </div>
          </div>
        </div>

        {/* Improvement Tips */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Improve Your Score</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Increase transaction volume through regular DeFi activities
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Maintain consistent on-chain activity over time
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Participate in staking to demonstrate long-term commitment
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Interact with multiple DeFi protocols to show diversity
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}