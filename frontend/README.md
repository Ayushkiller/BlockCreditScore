# CryptoVault Credit Intelligence - Deployment Dashboard

A comprehensive frontend dashboard for managing CryptoVault Credit Intelligence smart contract deployments, monitoring, and configuration.

## Features

### 🎛️ Environment Configuration
- **RPC Provider Setup**: Configure Goerli and Sepolia RPC URLs
- **Security Management**: Secure private key and API key configuration
- **Gas Optimization**: Customizable gas price and limit settings
- **Validation**: Real-time configuration validation and error checking
- **Export**: Download .env files for deployment

### 🚀 Smart Contract Deployment
- **Multi-Network Support**: Deploy to Goerli and Sepolia testnets
- **Real-time Progress**: Live deployment progress tracking
- **Automatic Verification**: Contract verification on Etherscan
- **Deployment History**: Track all deployments with detailed information
- **Gas Analysis**: Monitor deployment costs and gas usage

### 📊 Real-time Monitoring
- **Network Status**: Live network connectivity and block monitoring
- **Contract Activity**: Track function calls and transactions
- **Performance Metrics**: Response times and success rates
- **Gas Tracking**: Monitor gas prices and usage patterns
- **Event Monitoring**: Real-time contract event tracking

### 📝 Comprehensive Logging
- **Activity Logs**: All deployment and monitoring activities
- **Filtering**: Filter logs by type (success, error, info)
- **Search**: Full-text search through log entries
- **Export**: Download logs in TXT, JSON, or CSV formats
- **Real-time Updates**: Live log streaming

### 📈 Status Overview
- **System Health**: Overall system status and configuration
- **Quick Actions**: One-click access to common tasks
- **Deployment Stats**: Summary of all deployments
- **Resource Links**: Direct links to faucets and documentation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Hardhat development environment
- Testnet ETH (0.1+ ETH recommended per network)
- RPC provider (Infura/Alchemy)
- Etherscan API key

### Installation

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Dashboard**
   Navigate to `http://localhost:3000`

### Configuration

1. **Go to Environment Config Tab**
2. **Enter Required Information**:
   - Goerli RPC URL: `https://goerli.infura.io/v3/YOUR_API_KEY`
   - Sepolia RPC URL: `https://sepolia.infura.io/v3/YOUR_API_KEY`
   - Private Key: Your wallet private key (without 0x prefix)
   - Etherscan API Key: For contract verification

3. **Save Configuration**
4. **Download .env File** (optional)

### Deployment Process

1. **Configure Environment** (see above)
2. **Go to Deployment Tab**
3. **Select Network** (Goerli or Sepolia)
4. **Click Deploy** and wait for completion
5. **Contract will be automatically verified**

### Monitoring

1. **Go to Monitoring Tab**
2. **Select Deployed Contract**
3. **Click Start Monitoring**
4. **View real-time network and contract activity**

## Project Structure

```
frontend/
├── components/           # React components
│   ├── EnvConfigPanel.tsx    # Environment configuration
│   ├── DeploymentPanel.tsx   # Contract deployment
│   ├── MonitoringPanel.tsx   # Real-time monitoring
│   ├── LogsPanel.tsx         # System logs
│   ├── StatusOverview.tsx    # Dashboard overview
│   └── Layout.tsx            # App layout
├── contexts/            # React contexts
│   └── DeploymentContext.tsx # Global state management
├── pages/               # Next.js pages
│   ├── api/             # API routes
│   │   ├── deploy.ts    # Deployment API
│   │   └── monitor.ts   # Monitoring API
│   ├── _app.tsx         # App wrapper
│   └── index.tsx        # Main dashboard
├── styles/              # CSS styles
│   └── globals.css      # Global styles with Tailwind
└── package.json         # Dependencies
```

## API Endpoints

### POST /api/deploy
Deploy contract to specified network
```json
{
  "network": "goerli",
  "envConfig": {
    "GOERLI_RPC_URL": "...",
    "PRIVATE_KEY": "...",
    "ETHERSCAN_API_KEY": "..."
  }
}
```

### POST /api/monitor
Monitor network and contract activity
```json
{
  "network": "goerli",
  "contractAddress": "0x...",
  "action": "start"
}
```

## Environment Variables

The dashboard helps you configure these environment variables:

```bash
# Testnet RPC URLs
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_API_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY

# Deployment Configuration
PRIVATE_KEY=your_private_key_without_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gas Configuration
GAS_PRICE_GWEI=20
GAS_LIMIT=8000000
```

## Security Best Practices

### ✅ Implemented Security Features
- **Local Storage**: Configuration stored locally in browser
- **No Server Storage**: Private keys never sent to server
- **Validation**: Input validation and error checking
- **Secure Display**: Private key masking with show/hide toggle

### 🔒 Security Recommendations
- **Separate Wallets**: Use dedicated testnet wallets
- **Environment Variables**: Use .env files in production
- **HTTPS**: Always use HTTPS in production
- **Regular Updates**: Keep dependencies updated

## Troubleshooting

### Common Issues

**Configuration Errors**
- Verify RPC URLs are correct and accessible
- Ensure private key is 64 characters without 0x prefix
- Check Etherscan API key is valid

**Deployment Failures**
- Ensure sufficient testnet ETH balance (0.1+ ETH)
- Check network connectivity
- Verify gas settings are reasonable

**Monitoring Issues**
- Ensure contract is deployed and verified
- Check network connection
- Verify contract address is correct

### Getting Help

1. **Check Logs Panel** for detailed error messages
2. **Review Configuration** in Environment Config tab
3. **Verify Network Status** in Monitoring tab
4. **Download Logs** for debugging

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Technologies Used

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Ethers.js**: Ethereum interaction

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the CryptoVault Credit Intelligence system.

---

**Dashboard Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready