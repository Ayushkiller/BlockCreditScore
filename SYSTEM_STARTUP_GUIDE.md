# CryptoVault Credit Intelligence - System Startup Guide

## 🚀 Quick Start Options

### Option 1: Frontend Dashboard Only (Recommended for Demo)
```bash
start-dashboard.bat
```
- Starts only the frontend dashboard on http://localhost:3000
- Uses API data for realistic demonstration
- Perfect for UI/UX testing and demos

### Option 2: Backend API Only
```bash
start-backend.bat
```
- Starts only the API Gateway on http://localhost:3001
- Provides REST API endpoints for credit intelligence
- Generates realistic data based on wallet addresses

### Option 3: Full System (Frontend + Backend)
```bash
start-full-system.bat
```
- Starts both frontend and backend services
- Frontend connects to live backend API
- Complete system integration with realistic data

## 📊 System Architecture

### Frontend Dashboard (Port 3000)
- **Credit Dashboard** - Multi-dimensional credit scoring display
- **Analytics Panel** - Comprehensive behavior analytics
- **Social Credit** - Community features and gamification
- **Privacy Panel** - Zero-knowledge proof management
- **Deployment Tools** - Smart contract deployment interface

### Backend Services
- **API Gateway** (Port 3001) - Main API endpoint
- **Data Aggregator** (Port 3002) - Ethereum data processing
- **ML Prediction** (Port 3003) - Risk prediction models
- **Gamification** (Port 3004) - Achievement and badge system
- **Social Credit** (Port 3005) - P2P lending and community features
- **ZK Proof Service** (Port 3006) - Zero-knowledge proof generation

## 🔧 Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation
1. Clone the repository
2. Run your preferred startup script
3. Dependencies will be installed automatically

### Environment Variables
Create a `.env` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
```

## 🎯 Features Available

### ✅ Implemented Features
- Multi-dimensional credit scoring (5 dimensions)
- Real-time analytics dashboard
- Social credit and gamification system
- Privacy controls and ZK proof generation
- Wallet connection and profile management
- Achievement and badge system
- Peer comparison analytics
- ML risk predictions display
- Data export functionality
- Smart contract deployment tools

### 🔄 Data Sources
- **Frontend Only**: Uses API for realistic data generation
- **With Backend**: Connects to API for dynamic, address-based data
- **Production**: Would connect to deployed smart contracts and real blockchain data

## 🌐 API Endpoints

### Credit Profile
- `GET /api/credit-profile/:address` - Get user credit profile
- `PUT /api/credit-profile/:address` - Update credit profile

### Analytics
- `GET /api/analytics/:address?timeframe=30d` - Get analytics data

### ZK Proofs
- `POST /api/zk-proofs/generate` - Generate zero-knowledge proof
- `POST /api/zk-proofs/verify` - Verify ZK proof

### Achievements
- `GET /api/achievements/:address` - Get user achievements

### Social Credit
- `GET /api/social-credit/:address` - Get social credit data

## 🔒 Security Features

### Privacy Controls
- Privacy mode toggle to hide sensitive data
- Zero-knowledge proof generation
- Selective data disclosure
- Secure data export

### ZK Proof Types
- **Threshold Proofs** - Prove score above threshold without revealing exact value
- **Selective Disclosure** - Choose which dimensions to reveal
- **Full Privacy** - Complete verification without exposing data

## 📱 User Interface

### Navigation Tabs
1. **Overview** - System status and quick actions
2. **Credit Dashboard** - Main credit intelligence interface
3. **Analytics** - Detailed behavior analysis
4. **Social & Gamification** - Community features
5. **Privacy & ZK Proofs** - Privacy management
6. **Environment Config** - System configuration
7. **Deployment** - Smart contract deployment
8. **Monitoring** - Real-time system monitoring
9. **Logs** - System logs and debugging

### Key Components
- Wallet connection with demo and custom address options
- Privacy mode toggle for sensitive data
- Real-time score updates and trend analysis
- Interactive charts and visualizations
- Achievement progress tracking
- Peer comparison analytics

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts** - Make sure ports 3000-3006 are available
2. **Node.js version** - Ensure you're using Node.js v16+
3. **Dependencies** - Run `npm install` in both frontend and services directories
4. **API connection** - Check that backend is running on port 3001

### Debug Mode
- Check browser console for frontend errors
- Check terminal output for backend logs
- Use network tab to monitor API calls

## 🎮 Demo Features

### Sample Data
- Demo wallets: Multiple realistic Ethereum addresses
- Credit scores: Generated based on wallet address (600-900 range)
- 5 credit dimensions with address-based variations
- Achievement badges based on score tiers
- Social credit metrics with realistic ranges
- ML risk predictions with confidence intervals

### Interactive Elements
- Privacy mode toggle
- ZK proof generation
- Achievement claiming
- Data export functionality
- Real-time updates simulation

## 📈 Next Steps

### For Production
1. Deploy smart contracts to mainnet
2. Connect to real Ethereum data sources
3. Implement actual ML models
4. Add user authentication
5. Enable real ZK proof generation
6. Integrate with DeFi protocols

### For Development
1. Add more comprehensive tests
2. Implement WebSocket for real-time updates
3. Add more gamification features
4. Enhance privacy controls
5. Optimize performance
6. Add mobile responsiveness

---

**Ready to explore the future of DeFi credit intelligence!** 🚀