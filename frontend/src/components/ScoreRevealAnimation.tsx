import React, { useState, useEffect } from 'react'

interface ScoreRevealAnimationProps {
  score: number
  maxScore?: number
  onRevealComplete?: () => void
  showCelebration?: boolean
}

export default function ScoreRevealAnimation({ 
  score, 
  maxScore = 1000, 
  onRevealComplete,
  showCelebration = true 
}: ScoreRevealAnimationProps) {
  const [currentScore, setCurrentScore] = useState(0)
  const [isRevealing, setIsRevealing] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-success-500'
    if (score >= 600) return 'text-warning-500'
    return 'text-danger-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 800) return 'Excellent'
    if (score >= 700) return 'Good'
    if (score >= 600) return 'Fair'
    return 'Poor'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 800) return '🎉'
    if (score >= 700) return '👍'
    if (score >= 600) return '👌'
    return '💪'
  }

  useEffect(() => {
    const duration = 2000 // 2 seconds for reveal
    const steps = 60
    const increment = score / steps
    const stepDuration = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const newScore = Math.min(Math.round(increment * currentStep), score)
      setCurrentScore(newScore)

      if (currentStep >= steps) {
        clearInterval(timer)
        setIsRevealing(false)
        
        // Show celebration for good scores
        if (showCelebration && score >= 700) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3000)
        }
        
        setTimeout(() => onRevealComplete?.(), 1000)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [score, onRevealComplete, showCelebration])

  const percentage = (currentScore / maxScore) * 100
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center space-y-6">
        {/* Score Circle */}
        <div className="relative mx-auto w-48 h-48">
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted/30"
            />
            
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-300 ease-out ${getScoreColor(currentScore)}`}
              style={{
                filter: isRevealing ? 'drop-shadow(0 0 8px currentColor)' : 'none'
              }}
            />
          </svg>
          
          {/* Score Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-5xl font-bold transition-all duration-300 ${getScoreColor(currentScore)}`}>
                {currentScore}
              </div>
              <div className="text-sm text-muted-foreground">
                / {maxScore}
              </div>
            </div>
          </div>

          {/* Glow Effect */}
          {isRevealing && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse" />
          )}
        </div>

        {/* Score Label */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-3xl">{getScoreEmoji(currentScore)}</span>
            <h3 className={`text-3xl font-bold transition-all duration-500 ${getScoreColor(currentScore)}`}>
              {getScoreLabel(currentScore)}
            </h3>
          </div>
          
          <p className="text-muted-foreground max-w-md mx-auto">
            {currentScore >= 800 && "Outstanding! You have excellent creditworthiness with strong on-chain activity."}
            {currentScore >= 700 && currentScore < 800 && "Great job! You have good creditworthiness with solid transaction patterns."}
            {currentScore >= 600 && currentScore < 700 && "Not bad! You have fair creditworthiness with room for improvement."}
            {currentScore < 600 && "Keep building! Your credit profile shows potential for growth."}
          </p>
        </div>

        {/* Score Breakdown Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold text-foreground">
              {Math.round(percentage)}%
            </div>
            <div className="text-xs text-muted-foreground">Percentile</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold text-foreground">
              {currentScore >= 800 ? 'A+' : currentScore >= 700 ? 'A' : currentScore >= 600 ? 'B' : 'C'}
            </div>
            <div className="text-xs text-muted-foreground">Grade</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold text-foreground">
              {currentScore >= 700 ? 'Low' : currentScore >= 600 ? 'Medium' : 'High'}
            </div>
            <div className="text-xs text-muted-foreground">Risk</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold text-foreground">
              {currentScore >= 800 ? '95%' : currentScore >= 700 ? '85%' : currentScore >= 600 ? '75%' : '65%'}
            </div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isRevealing && (
          <div className="flex justify-center space-x-4 animate-fade-in">
            <button className="btn-primary">
              View Detailed Analysis
            </button>
            <button className="btn-outline">
              Get Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  )
}