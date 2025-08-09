import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      return res.status(200).json({
        GOERLI_RPC_URL: '',
        SEPOLIA_RPC_URL: '',
        PRIVATE_KEY: '',
        ETHERSCAN_API_KEY: '',
        GAS_PRICE_GWEI: '20',
        GAS_LIMIT: '8000000',
      });
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars: Record<string, string> = {};

    // Parse .env file
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    // Return the configuration values that the frontend expects
    const config = {
      GOERLI_RPC_URL: envVars.GOERLI_RPC_URL || '',
      SEPOLIA_RPC_URL: envVars.SEPOLIA_RPC_URL || '',
      PRIVATE_KEY: envVars.PRIVATE_KEY || '',
      ETHERSCAN_API_KEY: envVars.ETHERSCAN_API_KEY || '',
      GAS_PRICE_GWEI: envVars.GAS_PRICE_GWEI || '20',
      GAS_LIMIT: envVars.GAS_LIMIT || '8000000',
    };

    res.status(200).json(config);

  } catch (error) {
    console.error('Error loading environment configuration:', error);
    res.status(500).json({ 
      error: 'Failed to load environment configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}