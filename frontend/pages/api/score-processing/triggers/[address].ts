// API endpoint for score update triggers for a specific address
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  if (req.method === 'GET') {
    try {
      console.log(`🔍 Getting REAL triggers for address: ${address}`);
      
      // Import the real blockchain service
      const { realBlockchainService } = await import('../../../../services/blockchain/real-blockchain-service');
      
      // Get real transaction data to determine triggers
      const transactions = await realBlockchainService.getWalletTransactions(address);
      
      // Analyze real transactions to create triggers based on actual activity
      const triggers = [];
      
      // Check for DeFi supply activities
      const supplyTxs = transactions.filter(tx => 
        tx.methodId === '0xa9059cbb' || // transfer
        tx.methodId === '0x23b872dd'    // transferFrom
      );
      
      if (supplyTxs.length > 0) {
        triggers.push({
          triggerId: `supply_${address.slice(-8)}`,
          userAddress: address,
          eventType: 'Supply',
          confirmationThreshold: 12,
          isActive: true,
          lastTriggered: Math.floor(supplyTxs[0].timestamp / 1000),
          totalTriggers: supplyTxs.length
        });
      }
      
      // Check for staking activities
      const stakingTxs = transactions.filter(tx => 
        tx.to === '0x00000000219ab540356cbb839cbe05303d7705fa' || // ETH2 deposit
        tx.methodId === '0x22895118' // deposit
      );
      
      if (stakingTxs.length > 0) {
        triggers.push({
          triggerId: `stake_${address.slice(-8)}`,
          userAddress: address,
          eventType: 'Stake',
          confirmationThreshold: 32,
          isActive: true,
          lastTriggered: Math.floor(stakingTxs[0].timestamp / 1000),
          totalTriggers: stakingTxs.length
        });
      }
      
      // Check for swap activities
      const swapTxs = transactions.filter(tx => 
        tx.to === '0x7a250d5630b4cf539739df2c5dacb4c659f2488d' || // Uniswap V2
        tx.methodId === '0x38ed1739' // swapExactTokensForTokens
      );
      
      if (swapTxs.length > 0) {
        triggers.push({
          triggerId: `swap_${address.slice(-8)}`,
          userAddress: address,
          eventType: 'Swap',
          confirmationThreshold: 12,
          isActive: swapTxs.length > 5, // Active if more than 5 swaps
          lastTriggered: Math.floor(swapTxs[0].timestamp / 1000),
          totalTriggers: swapTxs.length
        });
      }
      
      console.log(`✅ Found ${triggers.length} real triggers for ${address}`);

      res.status(200).json(triggers);
    } catch (error) {
      console.error('Error fetching score update triggers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}