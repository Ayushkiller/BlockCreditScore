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

  const { network, contractAddress, action } = req.body;

  if (!network || !contractAddress || !action) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    let command = '';
    
    switch (action) {
      case 'start':
        command = `cd .. && npx hardhat run scripts/monitor-testnet.ts --network ${network}`;
        break;
      case 'check-balance':
        command = `cd .. && npx hardhat run scripts/check-balance.ts --network ${network}`;
        break;
      case 'verify':
        command = `cd .. && npx hardhat run scripts/verify-testnet.ts --network ${network}`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

    if (stderr) {
      console.error('Monitor stderr:', stderr);
    }

    // Parse monitoring output
    const balanceMatch = stdout.match(/Balance: ([\d.]+) ETH/);
    const blockMatch = stdout.match(/Latest block: (\d+)/);
    const gasPriceMatch = stdout.match(/Gas price: ([\d.]+) gwei/);

    const result = {
      success: true,
      balance: balanceMatch ? balanceMatch[1] : null,
      latestBlock: blockMatch ? parseInt(blockMatch[1]) : null,
      gasPrice: gasPriceMatch ? gasPriceMatch[1] : null,
      output: stdout,
      network,
      contractAddress
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Monitor error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Monitoring failed',
      error: error
    });
  }
}