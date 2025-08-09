// Machine Learning and Prediction Data Models

export interface MLModelConfig {
  modelId: string;
  name: string;
  version: string;
  type: ModelType;
  architecture: ModelArchitecture;
  hyperparameters: Record<string, any>;
  trainingData: TrainingDataConfig;
  performance: ModelPerformance;
  lastTrained: number;
  isActive: boolean;
}

export enum ModelType {
  RISK_PREDICTION = 'risk_prediction',
  ANOMALY_DETECTION = 'anomaly_detection',
  SCORE_FORECASTING = 'score_forecasting',
  MARKET_CORRELATION = 'market_correlation'
}

export interface ModelArchitecture {
  type: 'LSTM' | 'GRU' | 'Transformer' | 'CNN' | 'RandomForest' | 'XGBoost';
  layers?: LayerConfig[];
  inputShape: number[];
  outputShape: number[];
}

export interface LayerConfig {
  type: string;
  units?: number;
  activation?: string;
  dropout?: number;
  parameters: Record<string, any>;
}

export interface TrainingDataConfig {
  sources: DataSource[];
  timeRange: {
    start: number;
    end: number;
  };
  features: FeatureConfig[];
  targetVariable: string;
  validationSplit: number;
  testSplit: number;
}

export interface DataSource {
  name: string;
  type: 'blockchain' | 'market_data' | 'social' | 'external_api';
  endpoint?: string;
  updateFrequency: number; // seconds
  reliability: number; // 0-1 score
}

export interface FeatureConfig {
  name: string;
  type: 'numerical' | 'categorical' | 'time_series' | 'text';
  transformation?: string;
  importance?: number;
  description: string;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  mse?: number;
  mae?: number;
  validationMetrics: Record<string, number>;
  testMetrics: Record<string, number>;
}

export interface PredictionRequest {
  userAddress: string;
  modelId: string;
  features: Record<string, any>;
  predictionHorizon: number; // days
  confidenceThreshold?: number;
}

export interface PredictionResponse {
  userAddress: string;
  modelId: string;
  prediction: number;
  confidence: number;
  factors: PredictionFactor[];
  timestamp: number;
  expiresAt: number;
}

export interface PredictionFactor {
  feature: string;
  importance: number;
  value: any;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ModelTrainingJob {
  jobId: string;
  modelId: string;
  status: TrainingStatus;
  startTime: number;
  endTime?: number;
  progress: number; // 0-100
  metrics: TrainingMetrics;
  logs: TrainingLog[];
  error?: string;
}

export enum TrainingStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  validationLoss: number;
  validationAccuracy: number;
  learningRate: number;
}

export interface TrainingLog {
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  rank: number;
  category: string;
  description: string;
}

export interface ModelEnsemble {
  ensembleId: string;
  name: string;
  models: string[]; // model IDs
  weights: number[];
  combiningMethod: 'weighted_average' | 'voting' | 'stacking';
  performance: ModelPerformance;
  isActive: boolean;
}

export interface AnomalyDetectionResult {
  userAddress: string;
  anomalyScore: number;
  threshold: number;
  isAnomaly: boolean;
  anomalyType: AnomalyType;
  features: AnomalyFeature[];
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export enum AnomalyType {
  VOLUME_SPIKE = 'volume_spike',
  UNUSUAL_PATTERN = 'unusual_pattern',
  VELOCITY_CHANGE = 'velocity_change',
  PROTOCOL_DEVIATION = 'protocol_deviation',
  SOCIAL_ANOMALY = 'social_anomaly'
}

export interface AnomalyFeature {
  name: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  contribution: number; // to overall anomaly score
}

export interface MarketContext {
  timestamp: number;
  volatilityIndex: number;
  marketSentiment: number; // -1 to 1
  liquidityIndex: number;
  correlationMatrix: Record<string, Record<string, number>>;
  macroFactors: MacroFactor[];
}

export interface MacroFactor {
  name: string;
  value: number;
  impact: number; // on credit risk
  confidence: number;
  source: string;
}

// Enhanced prediction response with confidence intervals and uncertainty warnings
export interface EnhancedPredictionResponse extends PredictionResponse {
  confidenceInterval?: {
    lower: number;
    upper: number;
    confidence: number;
    width: number;
  };
  uncertaintyWarnings?: UncertaintyWarning[];
  marketAdjustment?: {
    originalPrediction: number;
    adjustmentFactor: number;
    adjustmentReason: string;
  };
}

export interface UncertaintyWarning {
  type: 'low_confidence' | 'high_volatility' | 'insufficient_data' | 'model_uncertainty';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  affectedFactors: string[];
}

export interface ConfidenceValidationResult {
  isValid: boolean;
  confidence: number;
  meetsThreshold: boolean;
  warnings: UncertaintyWarning[];
  reason?: string;
}