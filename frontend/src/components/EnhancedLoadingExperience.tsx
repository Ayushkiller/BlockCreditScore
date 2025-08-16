import React, { useState, useEffect } from 'react'

interface LoadingStage {
  id: string
  title: string
  description: string
  icon: string
  duration: number
}

interface EnhancedLoadingExperienceProps {
  address: string
  onComplete?: () => void
}

const loadingStages: LoadingStage[] = [
  {
    id: 'fetching',
    title: 'Fetching Transaction Data',
    description: 'Scanning blockchain for transaction history...',
    icon: '🔍',
    duration: 2000
  },
  {
    id: 'analyzing',
    title: 'Analyzing Patterns',
    description: 'Processing transaction patterns and behaviors...',
    icon: '🧠',
    duration: 2500
  },
  {
    id: 'calculating',
    title: 'Calculating Credit Score',
    description: 'Running ML algorithms to determine creditworthiness...',
    icon: '⚡',
    duration: 2000
  },
  {
    id: 'insights',
    title: 'Generating Insights',
    description: 'Creating personalized recommendations and insights...',
    icon: '💡',
    duration: 1500
  }
]

export default function EnhancedLoadingExperience({ address, onComplete }: EnhancedLoadingExperienceProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stageProgress, setStageProgress] = useState(0)

  useEffect(() => {
    let stageTimer: NodeJS.Timeout
    let progressTimer: NodeJS.Timeout

    const runStage = (stageIndex: number) => {
      if (stageIndex >= loadingStages.length) {
        onComplete?.()
        return
      }

      const stage = loadingStages[stageIndex]
      setCurrentStage(stageIndex)
      setStageProgress(0)

      // Animate stage progress
      const startTime = Date.now()
      progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime
        const stageProgressValue = Math.min((elapsed / stage.duration) * 100, 100)
        setStageProgress(stageProgressValue)
        
        // Update overall progress
        const overallProgress = ((stageIndex + stageProgressValue / 100) / loadingStages.length) * 100
        setProgress(overallProgress)
      }, 50)

      // Move to next stage
      stageTimer = setTimeout(() => {
        clearInterval(progressTimer)
        runStage(stageIndex + 1)
      }, stage.duration)
    }

    runStage(0)

    return () => {
      clearTimeout(stageTimer)
      clearInterval(progressTimer)
    }
  }, [onComplete])

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow animate-pulse">
            <span className="text-3xl">{loadingStages[currentStage]?.icon}</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Analyzing Wallet</h3>
            <p className="text-muted-foreground">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>

        {/* Current Stage */}
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-foreground mb-2">
              {loadingStages[currentStage]?.title}
            </h4>
            <p className="text-muted-foreground">
              {loadingStages[currentStage]?.description}
            </p>
          </div>

          {/* Stage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stage Progress</span>
              <span className="font-medium">{Math.round(stageProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${stageProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-center space-x-4">
          {loadingStages.map((stage, index) => (
            <div key={stage.id} className="flex flex-col items-center space-y-2">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-300
                ${index < currentStage 
                  ? 'bg-success-500 text-white shadow-md' 
                  : index === currentStage 
                    ? 'bg-primary text-primary-foreground shadow-glow animate-pulse' 
                    : 'bg-muted text-muted-foreground'
                }
              `}>
                {index < currentStage ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{stage.icon}</span>
                )}
              </div>
              <span className={`text-xs text-center transition-colors ${
                index <= currentStage ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {stage.title.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Fun Facts */}
        <div className="bg-muted/50 rounded-lg p-4 border">
          <div className="text-sm space-y-2">
            <div className="font-medium text-foreground">💡 Did you know?</div>
            <div className="text-muted-foreground">
              {currentStage === 0 && "We analyze over 50 different transaction patterns to build your credit profile."}
              {currentStage === 1 && "Our ML models consider transaction frequency, amounts, and timing patterns."}
              {currentStage === 2 && "Credit scores are calculated using 15+ weighted factors for accuracy."}
              {currentStage === 3 && "Personalized recommendations are generated based on your unique on-chain behavior."}
            </div>
          </div>
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}