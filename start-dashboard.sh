#!/bin/bash

echo ""
echo "========================================"
echo " CryptoVault Credit Intelligence"
echo " Deployment Dashboard"
echo "========================================"
echo ""

echo "Installing dependencies..."
cd frontend
npm install

echo ""
echo "Starting development server..."
echo "Dashboard will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev