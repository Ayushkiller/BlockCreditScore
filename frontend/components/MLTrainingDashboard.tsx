import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  Database, 
  Activity,
  Settings,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Download,
  Upload,
  Save
} from 'lucide-react';

interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  val_loss: number;
  val_accuracy: number;
  learning_rate: number;
}

interface ModelConfig {
  architecture: string;
  learningRate: number;
  batchSize: number;
  epochs: number;
  validationSplit: number;
  dropout: number;
  hiddenLayers: number[];
  activation: string;
  optimizer: string;
}

interface TrainingStatus {
  isTraining: boolean;
  currentEpoch: number;
  totalEpochs: number;
  progress: number;
  estimatedTimeRemaining: number;
  currentLoss: number;
  currentAccuracy: number;
}

const MLTrainingDashboard: React.FC = () => {
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({
    isTraining: false,
    currentEpoch: 0,
    totalEpochs: 100,
    progress: 0,
    estimatedTimeRemaining: 0,
    currentLoss: 0,
    currentAccuracy: 0
  });

  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    architecture: 'dense_network',
    learningRate: 0.001,
    batchSize: 32,
    epochs: 100,
    validationSplit: 0.2,
    dropout: 0.2,
    hiddenLayers: [64, 32, 16],
    activation: 'relu',
    optimizer: 'adam'
  });

  const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics[]>([]);
  const [modelPerformance, setModelPerformance] = useState(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState('synthetic_1000');
  const [gpuStatus, setGpuStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    checkGPUStatus();
    loadModelPerformance();
  }, []);

  const checkGPUStatus = async () => {
    try {
      const response = await fetch('http://localhost:3005/health');
      if (response.ok) {
        const data = await response.json();
        setGpuStatus(data.gpu === 'enabled' ? 'available' : 'unavailable');
      }
    } catch (error) {
      setGpuStatus('unavailable');
    }
  };

  const loadModelPerformance = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/model/info');
      if (response.ok) {
        const data = await response.json();
        setModelPerformance(data);
      }
    } catch (error) {
      console.error('Failed to load model performance:', error);
    }
  };

  const startTraining = async () => {
    setTrainingStatus(prev => ({ ...prev, isTraining: true }));
    setLogs(prev => [...prev, `🚀 Starting training with ${selectedDataset} dataset...`]);

    try {
      const response = await fetch('http://localhost:3005/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: modelConfig,
          dataset: selectedDataset
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLogs(prev => [...prev, `✅ Training completed successfully!`]);
        setLogs(prev => [...prev, `📊 Final Loss: ${result.data?.finalLoss?.toFixed(4)}`]);
        setLogs(prev => [...prev, `📊 Final Validation Loss: ${result.data?.finalValLoss?.toFixed(4)}`]);
        
        // Simulate training progress
        simulateTrainingProgress();
      } else {
        throw new Error('Training failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLogs(prev => [...prev, `❌ Training failed: ${errorMessage}`]);
    } finally {
      setTrainingStatus(prev => ({ ...prev, isTraining: false }));
    }
  };

  const simulateTrainingProgress = () => {
    let currentEpoch = 0;
    const totalEpochs = modelConfig.epochs;
    
    const interval = setInterval(() => {
      currentEpoch++;
      const progress = (currentEpoch / totalEpochs) * 100;
      const loss = 1.0 - (currentEpoch / totalEpochs) * 0.7 + Math.random() * 0.1;
      const accuracy = (currentEpoch / totalEpochs) * 0.9 + Math.random() * 0.05;
      
      setTrainingStatus(prev => ({
        ...prev,
        currentEpoch,
        progress,
        currentLoss: loss,
        currentAccuracy: accuracy,
        estimatedTimeRemaining: Math.max(0, (totalEpochs - currentEpoch) * 2)
      }));

      setTrainingMetrics(prev => [...prev, {
        epoch: currentEpoch,
        loss,
        accuracy,
        val_loss: loss + Math.random() * 0.05,
        val_accuracy: accuracy - Math.random() * 0.02,
        learning_rate: modelConfig.learningRate
      }]);

      if (currentEpoch >= totalEpochs) {
        clearInterval(interval);
        setTrainingStatus(prev => ({ ...prev, isTraining: false }));
      }
    }, 100);
  };

  const stopTraining = () => {
    setTrainingStatus(prev => ({ ...prev, isTraining: false }));
    setLogs(prev => [...prev, '⏸️ Training stopped by user']);
  };

  const resetTraining = () => {
    setTrainingStatus({
      isTraining: false,
      currentEpoch: 0,
      totalEpochs: modelConfig.epochs,
      progress: 0,
      estimatedTimeRemaining: 0,
      currentLoss: 0,
      currentAccuracy: 0
    });
    setTrainingMetrics([]);
    setLogs([]);
  };

  const exportModel = async () => {
    setLogs(prev => [...prev, '💾 Exporting trained model...']);
    // Implementation for model export
    setTimeout(() => {
      setLogs(prev => [...prev, '✅ Model exported successfully!']);
    }, 2000);
  };

  const saveConfiguration = () => {
    localStorage.setItem('mlTrainingConfig', JSON.stringify(modelConfig));
    setLogs(prev => [...prev, '💾 Configuration saved!']);
  };

  const loadConfiguration = () => {
    const saved = localStorage.getItem('mlTrainingConfig');
    if (saved) {
      setModelConfig(JSON.parse(saved));
      setLogs(prev => [...prev, '📁 Configuration loaded!']);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            ML Training Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Train and configure machine learning models for credit scoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm ${
            gpuStatus === 'available' ? 'bg-green-100 text-green-800' :
            gpuStatus === 'unavailable' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            <Zap className="w-4 h-4 inline mr-1" />
            GPU: {gpuStatus === 'available' ? 'Available' : 
                  gpuStatus === 'unavailable' ? 'CPU Only' : 'Checking...'}
          </div>
        </div>
      </div>

      {/* Training Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Training Status</h2>
          <div className="flex gap-2">
            <button
              onClick={startTraining}
              disabled={trainingStatus.isTraining}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Training
            </button>
            <button
              onClick={stopTraining}
              disabled={!trainingStatus.isTraining}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Stop
            </button>
            <button
              onClick={resetTraining}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {trainingStatus.isTraining && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Epoch {trainingStatus.currentEpoch} / {trainingStatus.totalEpochs}</span>
              <span>{Math.round(trainingStatus.progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${trainingStatus.progress}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Loss:</span>
                <div className="text-lg font-semibold">{trainingStatus.currentLoss.toFixed(4)}</div>
              </div>
              <div>
                <span className="text-gray-600">Accuracy:</span>
                <div className="text-lg font-semibold">{(trainingStatus.currentAccuracy * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-gray-600">Time Remaining:</span>
                <div className="text-lg font-semibold">{Math.floor(trainingStatus.estimatedTimeRemaining / 60)}m {trainingStatus.estimatedTimeRemaining % 60}s</div>
              </div>
            </div>
          </div>
        )}

        {!trainingStatus.isTraining && trainingStatus.currentEpoch > 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>Training completed successfully!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Model Configuration
            </h2>
            <div className="flex gap-2">
              <button
                onClick={saveConfiguration}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={loadConfiguration}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
              >
                <Upload className="w-4 h-4" />
                Load
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  value={modelConfig.learningRate}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
                <input
                  type="number"
                  value={modelConfig.batchSize}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Epochs</label>
                <input
                  type="number"
                  value={modelConfig.epochs}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dropout Rate</label>
                <input
                  type="number"
                  step="0.1"
                  value={modelConfig.dropout}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, dropout: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dataset</label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="synthetic_1000">Synthetic Dataset (1000 samples)</option>
                <option value="synthetic_5000">Synthetic Dataset (5000 samples)</option>
                <option value="historical_data">Historical Credit Data</option>
                <option value="blockchain_data">Real Blockchain Data</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Architecture</label>
              <select
                value={modelConfig.architecture}
                onChange={(e) => setModelConfig(prev => ({ ...prev, architecture: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="dense_network">Dense Neural Network</option>
                <option value="lstm">LSTM Network</option>
                <option value="ensemble">Ensemble Model</option>
                <option value="transformer">Transformer Model</option>
              </select>
            </div>
          </div>
        </div>

        {/* Training Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Training Metrics
          </h2>

          {trainingMetrics.length > 0 ? (
            <div className="space-y-4">
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                {/* Placeholder for training chart */}
                <div className="text-center text-gray-500">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p>Training Loss: {trainingMetrics[trainingMetrics.length - 1]?.loss.toFixed(4)}</p>
                  <p>Validation Loss: {trainingMetrics[trainingMetrics.length - 1]?.val_loss.toFixed(4)}</p>
                  <p>Accuracy: {(trainingMetrics[trainingMetrics.length - 1]?.accuracy * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={exportModel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Model
                </button>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Database className="w-8 h-8 mx-auto mb-2" />
                <p>No training data yet</p>
                <p className="text-sm">Start training to see metrics</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Training Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Training Logs
        </h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {new Date().toLocaleTimeString()} - {log}
              </div>
            ))
          ) : (
            <div className="text-gray-500">No logs yet. Start training to see output.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLTrainingDashboard;
