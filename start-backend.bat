@echo off
echo.
echo ========================================
echo  CryptoVault Credit Intelligence
echo  Backend Services Only
echo ========================================
echo.

echo Installing backend dependencies...
cd services/api-gateway
call npm install
cd ../..

echo.
echo Starting API Gateway on port 3001...
echo Backend API will be available at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

cd services/api-gateway
call npm start

pause