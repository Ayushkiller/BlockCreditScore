// LSTM Model Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { LSTMRiskModel } from './lstm-model';
import {
  MLModelConfig,
  ModelType,
  ModelArchitecture,
  TrainingDataConfig,
  PredictionRequest
} from '../../types/ml';
import { MLModelError, ValidationError } from '../../utils/errors';

describe('LSTMRiskModel', () => {
  let modelConfig: MLModelConfig;
  let model: LSTMRiskModel;

  beforeEach(() => {
    modelConfig = {
      modelId: 'test_lstm_30d',
      name: 'Test LSTM Risk Prediction 30D',
      version: '1.0.0',
      type: ModelType.RISK_PREDICTION,
      architecture: {
        type: 'LSTM',
        inputShape: [60, 12],
        outputShape: [1],
        layers: [
          {
            type: 'LSTM',
            units: 32,
            act