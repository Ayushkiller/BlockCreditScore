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
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-12 py-20">
        <div className="space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Decentralized Credit Scoring
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Analyze Ethereum addresses to explore on-chain creditworthiness assessment with advanced blockchain analytics.
          </p>
        </div>
        
        {/* Key Features - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-card border hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-foreground">Transaction Analysis</h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">Deep analysis of transaction patterns and behavior</p>
          </div>
          <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-card border hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="font-semibold text-foreground">Risk Assessment</h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">Comprehensive risk evaluation and scoring</p>
          </div>
          <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-card border hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="font-semibold text-foreground">On-chain Analysis</h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">Real-time blockchain data verification</p>
          </div>
        </div>
      </div>

      {/* Wallet Analysis Section */}
      <div className="card max-w-4xl mx-auto">
        <div className="card-header">
          <h2 className="card-title">Analyze Any Wallet</h2>
          <p className="card-description">
            Enter an Ethereum address to analyze credit score and behavior patterns with comprehensive blockchain data
          </p>
        </div>
        
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={addressToAnalyze}
                onChange={(e) => setAddressToAnalyze(e.target.value)}
                placeholder="Enter wallet address (0x...)"
                className="input w-full"
              />
              {addressToAnalyze && !isValidAddress(addressToAnalyze) && (
                <p className="text-destructive text-sm mt-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Please enter a valid Ethereum address
                </p>
              )}
            </div>
            <button
              onClick={handleAnalyzeWallet}
              disabled={!addressToAnalyze || !isValidAddress(addressToAnalyze) || isAnalyzing}
              className="btn-primary whitespace-nowrap"
              aria-label={isAnalyzing ? 'Analyzing wallet address' : 'Analyze wallet address'}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Analyze Wallet'
              )}
            </button>
          </div>

          {/* Quick test addresses */}
          <div className="border-t pt-6 mt-6">
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Try these sample addresses:</div>
              <div className="flex flex-wrap gap-3">
                {sampleAddresses.map((addr) => (
                  <button
                    key={addr}
                    onClick={() => setAddressToAnalyze(addr)}
                    className="px-4 py-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 hover:text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-mono"
                    aria-label={`Use sample address ${addr}`}
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
        <div className="card text-center max-w-lg mx-auto">
          <div className="card-content">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Get Started</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect your wallet or enter an Ethereum address above to analyze comprehensive credit scores and risk assessments.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}