import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { network, envConfig } = req.body;

  if (!network || !envConfig) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    // Create temporary .env file with provided config
    const envContent = `
GOERLI_RPC_URL=${envConfig.GOERLI_RPC_URL}
SEPOLIA_RPC_URL=${envConfig.SEPOLIA_RPC_URL}
PRIVATE_KEY=${envConfig.PRIVATE_KEY}
ETHERSCAN_API_KEY=${envConfig.ETHERSCAN_API_KEY}
GAS_PRICE_GWEI=${envConfig.GAS_PRICE_GWEI}
GAS_LIMIT=${envConfig.GAS_LIMIT}
`;

    // Execute deployment script
    const command = `cd .. && npx hardhat run scripts/deploy-testnet.ts --network ${network}`;
    const { stdout, stderr } = await execAsync(command, {
      env: { ...process.env, ...envConfig }
    });

    if (stderr) {
      console.error('Deployment stderr:', stderr);
    }

    // Parse deployment output to extract contract address
    const addressMatch = stdout.match(/SimpleCreditScore deployed to: (0x[a-fA-F0-9]{40})/);
    const blockMatch = stdout.match(/Block Number: (\d+)/);
    const gasMatch = stdout.match(/Total Gas Used: ([\d,]+)/);

    const result = {
      success: true,
      contractAddress: addressMatch ? addressMatch[1] : null,
      blockNumber: blockMatch ? parseInt(blockMatch[1]) : null,
      gasUsed: gasMatch ? parseInt(gasMatch[1].replace(/,/g, '')) : null,
      output: stdout,
      network
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Deployment failed',
      error: error
    });
  }
}