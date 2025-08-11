@echo off
echo.
echo ========================================
echo  BlockCreditScore - Full System Startup
echo  Starting All Services
echo ========================================
echo.

echo [1/3] Installing dependencies...
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo Installing ML service dependencies...
cd services/ml-prediction
call npm install
cd ../..

echo Installing API Gateway dependencies...
cd services/api-gateway
call npm install
cd ../..

echo.
echo [2/3] Starting backend services...

:: Start ML Service
echo Starting ML Service on port 3001...
start "ML Service" /min cmd /c "cd services/ml-prediction && node start-ml-service.js"

:: Wait for ML service to start
timeout /t 5 /nobreak >nul

:: Start API Gateway (if different from ML service)
echo Starting API Gateway...
start "API Gateway" /min cmd /c "cd services/api-gateway && npm start"

:: Wait for backend services
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting frontend...
echo Starting Next.js frontend on port 3000...
start "Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo ========================================
echo  🚀 BlockCreditScore System Started!
echo ========================================
echo.
echo Services:
echo   🌐 Frontend:     http://localhost:3000
echo   🤖 ML Service:   http://localhost:3001
echo   📊 Dashboard:    http://localhost:3000
echo   🧠 ML Training:  http://localhost:3000/ml-training
echo.
echo Available endpoints:
echo   - POST /api/predict/credit-score - Credit score prediction
echo   - POST /api/analyze/behavior     - Wallet behavior analysis
echo   - POST /api/train                - Start ML model training
echo   - GET  /health                   - Service health check
echo.
echo Press any key to stop all services...
pause

echo.
echo Stopping all services...
taskkill /f /fi "WINDOWTITLE eq ML Service*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq API Gateway*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Frontend*" >nul 2>&1

echo All services stopped.
pause