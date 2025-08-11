@echo off
echo.
echo ========================================
echo  BlockCreditScore Backend Services
echo  Starting API Gateway + ML Service
echo ========================================
echo.

echo Installing backend dependencies...
cd services/api-gateway
call npm install
cd ../..

echo.
echo Installing ML service dependencies...
cd services/ml-prediction
call npm install --production
cd ../..

echo.
echo Starting services in parallel...
echo API Gateway will be available at: http://localhost:3001
echo ML Service will be available at: http://localhost:3001 (integrated)
echo.

:: Start ML service in background
echo Starting ML Service...
start "ML Service" /min cmd /c "cd services/ml-prediction && node start-ml-service.js"

:: Wait a moment for ML service to initialize
timeout /t 3 /nobreak >nul

:: Start API Gateway (this will be the main terminal window)
echo Starting API Gateway...
cd services/api-gateway
call npm start

echo.
echo Press any key to exit all services...
pause
:: Kill ML service when exiting
taskkill /f /fi "WINDOWTITLE eq ML Service*" >nul 2>&1