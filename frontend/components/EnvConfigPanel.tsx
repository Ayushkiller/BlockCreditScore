import React, { useState } from 'react';
import { Save, Eye, EyeOff, AlertCircle, CheckCircle, ExternalLink, Copy } from 'lucide-react';
import { useDeployment } from '../contexts/DeploymentContext';

const EnvConfigPanel: React.FC = () => {
  const { envConfig, setEnvConfig, addLog } = useDeployment();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if configuration was loaded
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
      if (envConfig.GOERLI_RPC_URL || envConfig.PRIVATE_KEY || envConfig.ETHERSCAN_API_KEY) {
        addLog('🔄 Configuration loaded from .env file');
        addLog('✅ Deployment scripts will use this configuration');
        setLastSaved(new Date());
      }
    }, 1000); // Give time for API call to complete
    return () => clearTimeout(timer);
  }, [envConfig, addLog]);

  const handleInputChange = (field: keyof typeof envConfig, value: string) => {
    const newConfig = {
      ...envConfig,
      [field]: value
    };
    
    setEnvConfig(newConfig);
    setLastSaved(new Date()); // Update last saved time
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: ''
      });
    }
  };

  const validateConfig = () => {
    const errors: Record<string, string> = {};

    // Validate RPC URLs
    if (!envConfig.GOERLI_RPC_URL) {
      errors.GOERLI_RPC_URL = 'Goerli RPC URL is required';
    } else if (!envConfig.GOERLI_RPC_URL.startsWith('http')) {
      errors.GOERLI_RPC_URL = 'Must be a valid HTTP/HTTPS URL';
    }

    if (!envConfig.SEPOLIA_RPC_URL) {
      errors.SEPOLIA_RPC_URL = 'Sepolia RPC URL is required';
    } else if (!envConfig.SEPOLIA_RPC_URL.startsWith('http')) {
      errors.SEPOLIA_RPC_URL = 'Must be a valid HTTP/HTTPS URL';
    }

    // Validate private key
    if (!envConfig.PRIVATE_KEY) {
      errors.PRIVATE_KEY = 'Private key is required';
    } else if (envConfig.PRIVATE_KEY.startsWith('0x')) {
      errors.PRIVATE_KEY = 'Private key should not include 0x prefix';
    } else if (envConfig.PRIVATE_KEY.length !== 64) {
      errors.PRIVATE_KEY = 'Private key must be 64 characters long';
    }

    // Validate Etherscan API key
    if (!envConfig.ETHERSCAN_API_KEY) {
      errors.ETHERSCAN_API_KEY = 'Etherscan API key is required for contract verification';
    }

    // Validate gas settings
    const gasPrice = parseInt(envConfig.GAS_PRICE_GWEI);
    if (isNaN(gasPrice) || gasPrice < 1 || gasPrice > 1000) {
      errors.GAS_PRICE_GWEI = 'Gas price must be between 1 and 1000 gwei';
    }

    const gasLimit = parseInt(envConfig.GAS_LIMIT);
    if (isNaN(gasLimit) || gasLimit < 1000000 || gasLimit > 30000000) {
      errors.GAS_LIMIT = 'Gas limit must be between 1M and 30M';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      addLog('❌ Configuration validation failed');
      return;
    }

    setIsSaving(true);
    try {
      // Save to localStorage
      setEnvConfig({ ...envConfig });
      setLastSaved(new Date());
      
      // Also save to .env file via API call
      const response = await fetch('/api/save-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envConfig),
      });

      if (response.ok) {
        addLog('✅ Environment configuration saved and validated');
        addLog('💾 Configuration persisted to local storage');
        addLog('📄 Configuration written to .env file');
        addLog('🔄 Deployment scripts will now use your configuration');
      } else {
        // Fallback: still save to localStorage even if .env write fails
        addLog('✅ Configuration saved to local storage');
        addLog('⚠️ Could not write to .env file - you may need to download and place it manually');
      }
    } catch (error) {
      addLog('✅ Configuration saved to local storage');
      addLog('⚠️ Could not write to .env file - you may need to download and place it manually');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const generateEnvFile = () => {
    const envContent = `# CryptoVault Credit Intelligence Environment Configuration
# Generated on ${new Date().toISOString()}

# Testnet RPC URLs
GOERLI_RPC_URL=${envConfig.GOERLI_RPC_URL}
SEPOLIA_RPC_URL=${envConfig.SEPOLIA_RPC_URL}

# Deployment Configuration
PRIVATE_KEY=${envConfig.PRIVATE_KEY}
ETHERSCAN_API_KEY=${envConfig.ETHERSCAN_API_KEY}

# Gas Configuration
GAS_PRICE_GWEI=${envConfig.GAS_PRICE_GWEI}
GAS_LIMIT=${envConfig.GAS_LIMIT}

# Contract Addresses (will be populated after deployment)
GOERLI_SIMPLE_CREDIT_SCORE=
SEPOLIA_SIMPLE_CREDIT_SCORE=
`;

    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('📁 .env file downloaded');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addLog(`📋 ${label} copied to clipboard`);
  };

  const clearConfiguration = () => {
    if (confirm('Are you sure you want to clear all configuration? This cannot be undone.')) {
      const emptyConfig = {
        GOERLI_RPC_URL: '',
        SEPOLIA_RPC_URL: '',
        PRIVATE_KEY: '',
        ETHERSCAN_API_KEY: '',
        GAS_PRICE_GWEI: '20',
        GAS_LIMIT: '8000000',
      };
      setEnvConfig(emptyConfig);
      setValidationErrors({});
      setLastSaved(null);
      addLog('🗑️ Configuration cleared');
    }
  };

  const testConfiguration = async () => {
    if (!isConfigValid) {
      addLog('❌ Cannot test invalid configuration');
      return;
    }

    addLog('🧪 Testing configuration...');
    try {
      // Test RPC connection
      const response = await fetch(envConfig.GOERLI_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          addLog('✅ Goerli RPC connection successful');
          addLog(`📊 Current block: ${parseInt(data.result, 16)}`);
        }
      } else {
        addLog('⚠️ Goerli RPC connection failed');
      }
    } catch (error) {
      addLog('⚠️ Could not test RPC connection');
    }

    addLog('✅ Configuration test completed');
  };

  const isConfigValid = Object.keys(validationErrors).length === 0 && 
    envConfig.GOERLI_RPC_URL && envConfig.PRIVATE_KEY && envConfig.ETHERSCAN_API_KEY;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Environment Configuration</h2>
            <p className="text-gray-600 mt-1">
              Configure your RPC URLs, private keys, and API keys for testnet deployment
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isConfigValid ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            )}
            <span className="font-medium">
              {isConfigValid ? 'Configuration Valid' : 'Setup Required'}
            </span>
          </div>
        </div>
      </div>

      {/* RPC Configuration */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">RPC Provider Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">
              Goerli RPC URL *
              <a 
                href="https://infura.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4 inline" />
              </a>
            </label>
            <div className="relative">
              <input
                type="text"
                className={`input ${validationErrors.GOERLI_RPC_URL ? 'border-red-500' : ''}`}
                placeholder="https://goerli.infura.io/v3/your-project-id"
                value={envConfig.GOERLI_RPC_URL}
                onChange={(e) => handleInputChange('GOERLI_RPC_URL', e.target.value)}
              />
              <button
                onClick={() => copyToClipboard(envConfig.GOERLI_RPC_URL, 'Goerli RPC URL')}
                className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {validationErrors.GOERLI_RPC_URL && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.GOERLI_RPC_URL}</p>
            )}
          </div>

          <div>
            <label className="label">
              Sepolia RPC URL *
              <a 
                href="https://alchemy.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4 inline" />
              </a>
            </label>
            <div className="relative">
              <input
                type="text"
                className={`input ${validationErrors.SEPOLIA_RPC_URL ? 'border-red-500' : ''}`}
                placeholder="https://sepolia.infura.io/v3/your-project-id"
                value={envConfig.SEPOLIA_RPC_URL}
                onChange={(e) => handleInputChange('SEPOLIA_RPC_URL', e.target.value)}
              />
              <button
                onClick={() => copyToClipboard(envConfig.SEPOLIA_RPC_URL, 'Sepolia RPC URL')}
                className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {validationErrors.SEPOLIA_RPC_URL && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.SEPOLIA_RPC_URL}</p>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Getting RPC URLs</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sign up at Infura.io or Alchemy.com</li>
            <li>• Create a new project</li>
            <li>• Copy the endpoint URLs for Goerli and Sepolia networks</li>
            <li>• Paste them in the fields above</li>
          </ul>
        </div>
      </div>

      {/* Security Configuration */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Security Configuration</h3>
        <div className="space-y-6">
          <div>
            <label className="label">
              Private Key *
              <span className="text-red-600 ml-2">(Keep this secure!)</span>
            </label>
            <div className="relative">
              <input
                type={showPrivateKey ? 'text' : 'password'}
                className={`input pr-20 ${validationErrors.PRIVATE_KEY ? 'border-red-500' : ''}`}
                placeholder="64-character private key (without 0x prefix)"
                value={envConfig.PRIVATE_KEY}
                onChange={(e) => handleInputChange('PRIVATE_KEY', e.target.value)}
              />
              <div className="absolute right-2 top-2 flex space-x-1">
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(envConfig.PRIVATE_KEY, 'Private Key')}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            {validationErrors.PRIVATE_KEY && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.PRIVATE_KEY}</p>
            )}
          </div>

          <div>
            <label className="label">
              Etherscan API Key *
              <a 
                href="https://etherscan.io/apis" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4 inline" />
              </a>
            </label>
            <div className="relative">
              <input
                type="text"
                className={`input ${validationErrors.ETHERSCAN_API_KEY ? 'border-red-500' : ''}`}
                placeholder="Get from etherscan.io/apis"
                value={envConfig.ETHERSCAN_API_KEY}
                onChange={(e) => handleInputChange('ETHERSCAN_API_KEY', e.target.value)}
              />
              <button
                onClick={() => copyToClipboard(envConfig.ETHERSCAN_API_KEY, 'Etherscan API Key')}
                className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {validationErrors.ETHERSCAN_API_KEY && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.ETHERSCAN_API_KEY}</p>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Security Best Practices</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Use a separate wallet for testnet deployments</li>
            <li>• Never use your mainnet private key for testing</li>
            <li>• Keep your private key secure and never share it</li>
            <li>• Consider using environment variables in production</li>
          </ul>
        </div>
      </div>

      {/* Gas Configuration */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Gas Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Gas Price (gwei)</label>
            <input
              type="number"
              className={`input ${validationErrors.GAS_PRICE_GWEI ? 'border-red-500' : ''}`}
              placeholder="20"
              min="1"
              max="1000"
              value={envConfig.GAS_PRICE_GWEI}
              onChange={(e) => handleInputChange('GAS_PRICE_GWEI', e.target.value)}
            />
            {validationErrors.GAS_PRICE_GWEI && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.GAS_PRICE_GWEI}</p>
            )}
          </div>

          <div>
            <label className="label">Gas Limit</label>
            <input
              type="number"
              className={`input ${validationErrors.GAS_LIMIT ? 'border-red-500' : ''}`}
              placeholder="8000000"
              min="1000000"
              max="30000000"
              value={envConfig.GAS_LIMIT}
              onChange={(e) => handleInputChange('GAS_LIMIT', e.target.value)}
            />
            {validationErrors.GAS_LIMIT && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.GAS_LIMIT}</p>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Gas Recommendations</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use 10-20 gwei for testnet deployments</li>
            <li>• Higher gas prices = faster transaction confirmation</li>
            <li>• Gas limit of 8M is sufficient for most deployments</li>
            <li>• Monitor network congestion and adjust accordingly</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Save Configuration</h3>
            <p className="text-gray-600 text-sm">
              Save your configuration and generate .env file for deployment
            </p>
            {lastSaved && (
              <p className="text-green-600 text-xs mt-1">
                ✅ Auto-saved at {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={clearConfiguration}
              className="btn btn-secondary text-red-600 hover:bg-red-50"
            >
              Clear All
            </button>
            <button
              onClick={testConfiguration}
              disabled={!isConfigValid}
              className="btn btn-secondary"
            >
              Test Config
            </button>
            <button
              onClick={generateEnvFile}
              className="btn btn-secondary"
            >
              Download .env
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !isConfigValid}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save to .env'}</span>
            </button>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Auto-Save Enabled</h4>
              <p className="text-green-800 text-sm mt-1">
                Your configuration is automatically saved as you type and will be restored when you return to this page.
                Use "Validate & Save" to run validation checks and confirm your settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvConfigPanel;