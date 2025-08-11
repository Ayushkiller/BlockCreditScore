import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, message, signature } = req.body;

    if (!address || !message || !signature) {
      return res.status(400).json({ 
        error: 'Missing required fields: address, message, signature' 
      });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();

    const verificationResult = {
      address,
      message,
      signature,
      timestamp: Date.now(),
      isValid,
      verificationMethod: 'personal_sign',
      recoveredAddress
    };

    if (isValid) {
      // Store the verification result
      const response = await fetch('http://localhost:3001/api/blockchain-verification/store-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationResult)
      });

      if (!response.ok) {
        console.error('Failed to store verification result');
      }
    }

    res.status(200).json({
      success: true,
      verification: verificationResult
    });
  } catch (error) {
    console.error('Error verifying wallet:', error);
    res.status(500).json({ 
      error: 'Failed to verify wallet signature',
      details: error.message 
    });
  }
}