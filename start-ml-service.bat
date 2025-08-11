@echo off
echo.
echo ========================================
echo  BlockCreditScore ML Training Service
echo  Machine Learning Model Training
echo ========================================
echo.

echo Installing ML service dependencies...
cd services/ml-prediction
call npm install
echo.

echo Starting ML Training Service on port 3001...
echo ML Service will be available at: http://localhost:3001
echo Training Dashboard: http://localhost:3000/ml-training
echo.
echo Available endpoints:
echo   - POST /api/train           - Start model training
echo   - POST /api/predict/credit-score - Get credit score prediction
echo   - POST /api/analyze/behavior     - Analyze wallet behavior
echo   - GET  /health                   - Service health check
echo.

node start-ml-service.js

echo.
echo Press any key to exit...
pause
