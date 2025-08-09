@echo off
echo.
echo ========================================
echo  CryptoVault Credit Intelligence
echo  Full System Startup
echo ========================================
echo.

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Installing backend dependencies...
if exist services (
    cd services
    call npm install
    cd ..
)

echo.
echo Starting backend services...
echo.

REM Start Data Aggregator Service
echo Starting Data Aggregator Service on port 3001...
start "Data Aggregator" cmd /k "cd services/data-aggregator && npm start"
timeout /t 2 /nobreak >nul

REM Start ML Prediction Service
echo Starting ML Prediction Service on port 3002...
start "ML Prediction" cmd /k "cd services/ml-prediction && npm start"
timeout /t 2 /nobreak >nul

REM Start Gamification Service
echo Starting Gamification Service on port 3003...
start "Gamification" cmd /k "cd services/gamification && npm start"
timeout /t 2 /nobreak >nul

REM Start Social Credit Service
echo Starting Social Credit Service on port 3004...
start "Social Credit" cmd /k "cd services/social-credit && npm start"
timeout /t 2 /nobreak >nul

REM Start ZK Proof Service
echo Starting ZK Proof Service on port 3005...
start "ZK Proof" cmd /k "cd services/zk-proof && npm start"
timeout /t 2 /nobreak >nul

REM Start API Gateway
echo Starting API Gateway on port 3000...
start "API Gateway" cmd /k "cd services/api-gateway && npm start"
timeout /t 3 /nobreak >nul

echo.
echo Starting frontend dashboard...
echo Dashboard will be available at: http://localhost:3000
echo.

cd frontend
start "Frontend Dashboard" cmd /k "npm run dev"

echo.
echo ========================================
echo  System Status:
echo ========================================
echo  Frontend Dashboard: http://localhost:3000
echo  API Gateway:        http://localhost:3001
echo  Data Aggregator:    http://localhost:3002
echo  ML Prediction:      http://localhost:3003
echo  Gamification:       http://localhost:3004
echo  Social Credit:      http://localhost:3005
echo  ZK Proof Service:   http://localhost:3006
echo ========================================
echo.
echo All services are starting up...
echo Check individual windows for service status
echo Press any key to exit this window
echo.

pause