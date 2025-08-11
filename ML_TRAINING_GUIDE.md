# ML Training Dashboard

This document explains how to use the ML Training Dashboard for training machine learning models for credit scoring.

## Features

### 🧠 Model Training
- Real-time training progress tracking
- Configurable model architectures (Dense, LSTM, Ensemble, Transformer)
- GPU acceleration support (when available)
- Training metrics visualization
- Live training logs

### ⚙️ Configuration Options
- **Learning Rate**: Controls how fast the model learns (default: 0.001)
- **Batch Size**: Number of samples processed at once (default: 32)
- **Epochs**: Number of complete training cycles (default: 100)
- **Dropout Rate**: Prevents overfitting (default: 0.2)
- **Hidden Layers**: Network architecture [64, 32, 16]
- **Dataset Selection**: Synthetic or real blockchain data

### 📊 Training Datasets
1. **Synthetic Dataset (1000 samples)**: Basic training data
2. **Synthetic Dataset (5000 samples)**: Larger synthetic dataset
3. **Historical Credit Data**: Previous credit scoring data
4. **Real Blockchain Data**: Actual transaction data

## How to Use

### 1. Start the ML Service
```bash
# Option 1: Start just the ML service
start-ml-service.bat

# Option 2: Start the full system
start-full-system.bat
```

### 2. Access the Training Dashboard
Open your browser and navigate to:
```
http://localhost:3000/ml-training
```

### 3. Configure Your Model
1. Adjust the model configuration parameters
2. Select your preferred dataset
3. Choose the model architecture
4. Save your configuration for future use

### 4. Start Training
1. Click "Start Training" button
2. Monitor real-time progress in the dashboard
3. Watch training metrics update live
4. Check the training logs for detailed information

### 5. Export Trained Model
Once training is complete:
1. Click "Export Model" to save the trained model
2. The model will be available for credit scoring predictions

## API Endpoints

The ML service provides these endpoints:

### Training
```http
POST http://localhost:3001/api/train
Content-Type: application/json

{
  "config": {
    "learningRate": 0.001,
    "batchSize": 32,
    "epochs": 100,
    "architecture": "dense_network"
  },
  "dataset": "synthetic_1000"
}
```

### Credit Score Prediction
```http
POST http://localhost:3001/api/predict/credit-score
Content-Type: application/json

{
  "address": "0x742d35Cc6642C4532566E569H33F86dDF70E16Ed",
  "features": {
    "portfolioValue": 50000,
    "transactionCount": 100,
    "accountAge": 90,
    "gasEfficiency": 0.7,
    "protocolDiversity": 3,
    "liquidityProvided": 10000,
    "repaymentRate": 0.9,
    "volatility": 0.3
  }
}
```

### Behavior Analysis
```http
POST http://localhost:3001/api/analyze/behavior
Content-Type: application/json

{
  "address": "0x742d35Cc6642C4532566E569H33F86dDF70E16Ed",
  "timeframe": "30d"
}
```

### Health Check
```http
GET http://localhost:3001/health
```

## GPU Support

The ML service automatically detects and uses GPU acceleration when available:

- **NVIDIA GPU**: Install CUDA and the GPU version of TensorFlow
- **CPU Fallback**: Automatically falls back to CPU if GPU is unavailable
- **Performance**: GPU training is typically 5-10x faster than CPU

## Training Tips

### For Best Results:
1. **Start Small**: Begin with synthetic_1000 dataset
2. **Monitor Overfitting**: Watch validation loss vs training loss
3. **Adjust Learning Rate**: Lower if loss is unstable, higher if learning is slow
4. **Use Dropout**: Helps prevent overfitting with larger datasets
5. **Early Stopping**: Stop training when validation loss stops improving

### Common Issues:
- **High Loss**: Increase learning rate or check data quality
- **Overfitting**: Increase dropout rate or reduce model complexity
- **Slow Training**: Enable GPU acceleration or reduce batch size
- **Memory Issues**: Reduce batch size or model complexity

## Model Architecture Options

### Dense Network (Recommended)
- Simple and effective for credit scoring
- Good for structured financial data
- Fast training and prediction

### LSTM Network
- Good for sequential transaction data
- Captures time-dependent patterns
- More complex but potentially more accurate

### Ensemble Model
- Combines multiple models
- Higher accuracy but slower
- Good for production use

### Transformer Model
- State-of-the-art architecture
- Best for complex patterns
- Requires more data and compute

## Integration with Wallet Analysis

The trained models are automatically used by the wallet analysis feature:

1. **Credit Score Prediction**: Uses the trained scoring model
2. **Risk Assessment**: Provides confidence intervals
3. **Behavior Analysis**: Analyzes transaction patterns
4. **Real-time Updates**: Models update with new blockchain data

## Troubleshooting

### Service Won't Start
1. Check if port 3001 is available
2. Ensure Node.js and npm are installed
3. Run `npm install` in services/ml-prediction directory

### Training Fails
1. Check training logs for error details
2. Verify dataset is available
3. Try reducing batch size or model complexity
4. Check GPU compatibility if using GPU acceleration

### Poor Model Performance
1. Increase training epochs
2. Try different architectures
3. Use larger or higher quality datasets
4. Adjust hyperparameters

## Next Steps

After training your model:

1. **Test Predictions**: Use the wallet analysis feature to test your model
2. **Deploy to Production**: Export and deploy your trained model
3. **Monitor Performance**: Track model accuracy over time
4. **Retrain Periodically**: Update models with new data

## Support

For issues or questions:
1. Check the training logs for error details
2. Review this documentation
3. Test with the health check endpoint
4. Verify all dependencies are installed correctly
