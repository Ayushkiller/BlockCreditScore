import { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import ScoreDashboard from '../components/ScoreDashboard'

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

  const sampleAddresses = [
    '0x742C42ca2F8B7Cb662bD9aE8A7d4B5c2F6F03B3e',
    '0x8Ba1f109551bD432803012645Hac136c22C501C',
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-8 py-16">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Decentralized Credit Scoring
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Analyze Ethereum addresses to explore on-chain creditworthiness assessment.
          </p>
        </div>
        
        {/* Key Features - Simplified */}
        <div className="flex justify-center items-center space-x-8 text-sm text-muted-foreground max-w-2xl mx-auto">
          <span className="flex items-center space-x-2">
            <span>📊</span>
            <span>Transaction Analysis</span>
          </span>
          <span className="flex items-center space-x-2">
            <span>🛡️</span>
            <span>Risk Assessment</span>
          </span>
          <span className="flex items-center space-x-2">
            <span>🔍</span>
            <span>On-chain Analysis</span>
          </span>
        </div>
      </div>

      {/* Wallet Analysis Section */}
      <div className="card p-8 max-w-3xl mx-auto">
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold">Analyze Any Wallet</h2>
            <p className="text-muted-foreground">
              Enter an Ethereum address to analyze credit score and behavior patterns
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={addressToAnalyze}
                onChange={(e) => setAddressToAnalyze(e.target.value)}
                placeholder="Enter wallet address (0x...)"
                className="input w-full"
              />
              {addressToAnalyze && !isValidAddress(addressToAnalyze) && (
                <p className="text-destructive text-sm mt-2">Please enter a valid Ethereum address</p>
              )}
            </div>
            <button
              onClick={handleAnalyzeWallet}
              disabled={!addressToAnalyze || !isValidAddress(addressToAnalyze) || isAnalyzing}
              className="btn-primary whitespace-nowrap"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          {/* Quick test addresses */}
          <div className="border-t pt-4">
            <div className="text-sm space-y-3">
              <div className="text-muted-foreground">Try these sample addresses:</div>
              <div className="flex flex-wrap gap-2">
                {sampleAddresses.map((addr) => (
                  <button
                    key={addr}
                    onClick={() => setAddressToAnalyze(addr)}
                    className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                  >
                    {addr.slice(0, 6)}...{addr.slice(-4)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Main Content */}
      {account || (addressToAnalyze && isValidAddress(addressToAnalyze)) ? (
        <ScoreDashboard addressOverride={addressToAnalyze || account} />
      ) : (
        <div className="card p-8 text-center max-w-md mx-auto">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Get Started</h3>
              <p className="text-muted-foreground text-sm">
                Connect your wallet or enter an address above to analyze credit scores.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}