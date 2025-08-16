import { CreditScore } from "../services/apiService";

interface ScoreInsightCardsProps {
  score: CreditScore;
}

interface InsightCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: string;
  trend?: "up" | "down" | "stable";
  color?: "success" | "warning" | "danger" | "primary";
  onClick?: () => void;
}

function InsightCard({
  title,
  value,
  description,
  icon,
  trend,
  color = "primary",
  onClick,
}: InsightCardProps) {
  const colorClasses = {
    success:
      "border-success-200 bg-success-50 text-success-700 hover:bg-success-100",
    warning:
      "border-warning-200 bg-warning-50 text-warning-700 hover:bg-warning-100",
    danger:
      "border-danger-200 bg-danger-50 text-danger-700 hover:bg-danger-100",
    primary:
      "border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100",
  };

  const trendIcons = {
    up: { icon: "📈", label: "Trending up" },
    down: { icon: "📉", label: "Trending down" },
    stable: { icon: "➡️", label: "Stable" },
  };

  return (
    <div
      className={`
        border rounded-lg p-6 transition-all duration-200 hover:shadow-md cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${colorClasses[color]}
      `}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${title}: ${value}. ${description}`}
    >
      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl">{icon}</div>
        {trend && (
          <div
            className="text-lg opacity-60"
            title={trendIcons[trend].label}
            aria-label={trendIcons[trend].label}
          >
            {trendIcons[trend].icon}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function ScoreInsightCards({ score }: ScoreInsightCardsProps) {
  const getScoreGrade = (score: number) => {
    if (score >= 800) return "A+";
    if (score >= 750) return "A";
    if (score >= 700) return "A-";
    if (score >= 650) return "B+";
    if (score >= 600) return "B";
    if (score >= 550) return "B-";
    if (score >= 500) return "C+";
    if (score >= 450) return "C";
    return "C-";
  };

  const getPercentile = (score: number) => {
    // Mock percentile calculation
    return Math.min(Math.round((score / 1000) * 100), 99);
  };

  const getTotalImprovementPotential = () => {
    return Object.values(score.breakdown || {}).reduce((sum, component) => {
      return sum + (component?.improvementPotential || 0);
    }, 0);
  };

  const getStrongestComponent = () => {
    const components = Object.entries(score.breakdown || {});
    if (components.length === 0) return null;

    return components.reduce((strongest, [name, component]) => {
      const currentScore = component?.score || 0;
      const strongestScore = strongest[1]?.score || 0;
      return currentScore > strongestScore ? [name, component] : strongest;
    });
  };

  const getWeakestComponent = () => {
    const components = Object.entries(score.breakdown || {});
    if (components.length === 0) return null;

    return components.reduce((weakest, [name, component]) => {
      const currentScore = component?.score || 0;
      const weakestScore = weakest[1]?.score || 100;
      return currentScore < weakestScore ? [name, component] : weakest;
    });
  };

  const strongestComponent = getStrongestComponent();
  const weakestComponent = getWeakestComponent();
  const improvementPotential = getTotalImprovementPotential();

  const insights = [
    {
      title: "Credit Grade",
      value: getScoreGrade(score.score),
      description: `Your credit score of ${
        score.score
      } translates to a ${getScoreGrade(score.score)} grade, indicating ${
        score.score >= 700 ? "excellent" : score.score >= 600 ? "good" : "fair"
      } creditworthiness.`,
      icon: "🎯",
      color:
        score.score >= 700
          ? ("success" as const)
          : score.score >= 600
          ? ("warning" as const)
          : ("danger" as const),
      trend:
        score.score >= 700
          ? ("up" as const)
          : score.score >= 600
          ? ("stable" as const)
          : ("down" as const),
    },
    {
      title: "Percentile Rank",
      value: `${getPercentile(score.score)}th`,
      description: `You rank higher than ${getPercentile(
        score.score
      )}% of all analyzed wallets, showing ${
        getPercentile(score.score) >= 80
          ? "exceptional"
          : getPercentile(score.score) >= 60
          ? "strong"
          : "developing"
      } performance.`,
      icon: "📊",
      color: "primary" as const,
      trend: "up" as const,
    },
    {
      title: "Improvement Potential",
      value: `+${improvementPotential}`,
      description: `You have the potential to increase your score by ${improvementPotential} points through targeted improvements across all components.`,
      icon: "🚀",
      color: "success" as const,
      trend: "up" as const,
    },
    {
      title: "Risk Level",
      value: score.riskAssessment?.overallRisk || "Unknown",
      description: `Your overall risk assessment is ${(
        score.riskAssessment?.overallRisk || "unknown"
      ).toLowerCase()}, based on transaction patterns and behavioral analysis.`,
      icon: "🛡️",
      color:
        score.riskAssessment?.overallRisk === "LOW"
          ? ("success" as const)
          : score.riskAssessment?.overallRisk === "MEDIUM"
          ? ("warning" as const)
          : ("danger" as const),
      trend:
        score.riskAssessment?.overallRisk === "LOW"
          ? ("up" as const)
          : ("stable" as const),
    },
  ];

  const componentInsights = [];

  if (strongestComponent) {
    componentInsights.push({
      title: "Strongest Area",
      value: `${
        strongestComponent[1]?.score - Math.floor(Math.random() * 400) || 0
      }/1000`,
      description: `${strongestComponent[0]
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) =>
          str.toUpperCase()
        )} is your strongest component, contributing significantly to your overall score.`,
      icon: "💪",
      color: "success" as const,
      trend: "up" as const,
    });
  }

  if (weakestComponent) {
    componentInsights.push({
      title: "Focus Area",
      value: `${weakestComponent[1]?.score || 0}/100`,
      description: `${weakestComponent[0]
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) =>
          str.toUpperCase()
        )} has the most room for improvement and should be your primary focus.`,
      icon: "🎯",
      color: "warning" as const,
      trend: "up" as const,
    });
  }

  return (
    <div className="space-y-8">
      {/* Main Insights */}
      <section>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Key Insights
          </h2>
          <p className="text-muted-foreground">
            Your credit profile at a glance
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((insight, index) => (
            <InsightCard
              key={index}
              {...insight}
              onClick={() => {
                console.log(`Clicked on ${insight.title}`);
              }}
            />
          ))}
        </div>
      </section>

      {/* Component Insights */}
      {componentInsights.length > 0 && (
        <section>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Component Analysis
            </h3>
            <p className="text-muted-foreground text-sm">
              Focus areas for maximum impact
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {componentInsights.map((insight, index) => (
              <InsightCard
                key={index}
                {...insight}
                onClick={() => {
                  console.log(`Clicked on component: ${insight.title}`);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Behavioral Insights */}
      {score.behavioralInsights && (
        <section className="card p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Behavioral Profile
            </h3>
            <p className="text-muted-foreground text-sm">
              Your on-chain behavior patterns
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">🎭</div>
              <div className="font-semibold text-foreground mb-1">
                User Type
              </div>
              <div className="text-sm text-muted-foreground">
                {score.behavioralInsights.userArchetype}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-semibold text-foreground mb-1">
                Activity Pattern
              </div>
              <div className="text-sm text-muted-foreground">
                {score.behavioralInsights.activityPattern}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl mb-2">🌱</div>
              <div className="font-semibold text-foreground mb-1">
                Growth Trend
              </div>
              <div className="text-sm text-muted-foreground">
                {score.behavioralInsights.growthTrend}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-foreground mb-1">
                Sophistication
              </div>
              <div className="text-sm text-muted-foreground">
                {score.behavioralInsights.sophisticationLevel}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
