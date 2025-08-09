import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface EnvConfig {
  GOERLI_RPC_URL: string;
  SEPOLIA_RPC_URL: string;
  PRIVATE_KEY: string;
  ETHERSCAN_API_KEY: string;
  GAS_PRICE_GWEI: string;
  GAS_LIMIT: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config: EnvConfig = req.body;
    
    // Validate required fields
    if (!config.GOERLI_RPC_URL || !config.PRIVATE_KEY || !config.ETHERSCAN_API_KEY) {
      return res.status(400).json({ error: 'Missing required configuration fields' });
    }

    // Generate clean .env content
    const newEnvContent = `# CryptoVault Credit Intelligence - Environment Configuration
# Updated on ${new Date().toISOString()}

# Deployment Configuration (Updated from Dashboard)
GOERLI_RPC_URL=${config.GOERLI_RPC_URL}
SEPOLIA_RPC_URL=${config.SEPOLIA_RPC_URL}
PRIVATE_KEY=${config.PRIVATE_KEY}
ETHERSCAN_API_KEY=${config.ETHERSCAN_API_KEY}
GAS_PRICE_GWEI=${config.GAS_PRICE_GWEI}
GAS_LIMIT=${config.GAS_LIMIT}

# Application Environment
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001

# Smart Contract Addresses (Populated after deployment)
GOERLI_SIMPLE_CREDIT_SCORE=
SEPOLIA_SIMPLE_CREDIT_SCORE=

# Feature Flags
ENABLE_ZK_PROOFS=true
ENABLE_ML_PREDICTIONS=true
ENABLE_SOCIAL_CREDIT=true
ENABLE_GAMIFICATION=true

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
`;

    // Write the new .env file
    const envPath = path.join(process.cwd(), '.env');
    fs.writeFileSync(envPath, newEnvContent);

    res.status(200).json({ 
      success: true, 
      message: 'Environment configuration saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error saving environment configuration:', error);
    res.status(500).json({ 
      error: 'Failed to save environment configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}