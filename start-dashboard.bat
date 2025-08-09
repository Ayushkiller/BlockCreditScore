@echo off
echo.
echo ========================================
echo  CryptoVault Credit Intelligence
echo  Frontend Dashboard Only
echo ========================================
echo.

echo Installing frontend dependencies...
cd frontend
call npm install

echo.
echo Starting frontend development server...
echo Dashboard will be available at: http://localhost:3000
echo.
echo Note: This starts ONLY the frontend dashboard.
echo For full system with backend services, use: start-full-system.bat
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause