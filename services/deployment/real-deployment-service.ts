import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: number;
  network: string;
  timestamp: number;
  verified: boolean;
}

export interface DeploymentStatus {
  status: 'pending' | 'success' | 'failed';
  message: string;
  result?: DeploymentResult;
}

export class RealDeploymentService {
  private deploymentDir = path.join(process.cwd(), 'deployments');

  constructor() {
    // Ensure deployments directory exists
    if (!fs.existsSync(this.deploymentDir)) {
      fs.mkdirSync(this.deploymentDir, { recursive: true });
    }
  }

  async deployContract(network: 'goerli' | 'sepolia'): Promise<DeploymentResult> {
    try {
      console.log(`🚀 Starting REAL deployment to ${network}...`);
      
      // Run the actual Hardhat deployment script
      const { stdout, stderr } = await execAsync(
        `npx hardhat run scripts/deploy-simple.ts --network ${network}`,
        { cwd: process.cwd() }
      );

      if (stderr) {
        console.error('Deployment stderr:', stderr);
      }

      console.log('Deployment stdout:', stdout);

      // Parse deployment output to extract contract address
      const addressMatch = stdout.match(/SimpleCreditScore deployed to: (0x[a-fA-F0-9]{40})/);
      const blockMatch = stdout.match(/Block number: (\d+)/);
      const gasMatch = stdout.match(/Gas used: ([\d,]+)/);

      if (!addressMatch) {
        throw new Error('Could not extract contract address from deployment output');
      }

      const contractAddress = addressMatch[1];
      const blockNumber = blockMatch ? parseInt(blockMatch[1]) : 0;
      const gasUsed = gasMatch ? parseInt(gasMatch[1].replace(/,/g, '')) : 0;

      // Read the deployment file created by the script
      const latestFile = path.join(this.deploymentDir, `${network}-simple-latest.json`);
      let deploymentData: any = {};
      
      if (fs.existsSync(latestFile)) {
        deploymentData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
      }

      const result: DeploymentResult = {
        contractAddress,
        transactionHash: deploymentData.transactionHash || '',
        blockNumber: deploymentData.blockNumber || blockNumber,
        gasUsed: deploymentData.gasUsed || gasUsed,
        network,
        timestamp: Date.now(),
        verified: false
      };

      console.log(`✅ Contract deployed successfully to ${network}: ${contractAddress}`);
      return result;

    } catch (error) {
      console.error('❌ Real deployment failed:', error);
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  async verifyContract(address: string, network: string): Promise<{ verified: boolean; message: string }> {
    try {
      console.log(`🔍 Verifying contract ${address} on ${network}...`);
      
      const { stdout, stderr } = await execAsync(
        `npx hardhat verify --network ${network} ${address}`,
        { cwd: process.cwd() }
      );

      if (stderr && !stderr.includes('Already Verified')) {
        console.error('Verification stderr:', stderr);
      }

      console.log('Verification stdout:', stdout);

      const isVerified = stdout.includes('Successfully verified') || 
                        stderr.includes('Already Verified') ||
                        stdout.includes('Already verified');

      return {
        verified: isVerified,
        message: isVerified ? 'Contract verified successfully' : 'Verification failed'
      };

    } catch (error) {
      console.error('❌ Contract verification failed:', error);
      return {
        verified: false,
        message: `Verification failed: ${error.message}`
      };
    }
  }

  async getDeploymentStatus(network: string): Promise<DeploymentResult | null> {
    const latestFile = path.join(this.deploymentDir, `${network}-simple-latest.json`);
    
    if (!fs.existsSync(latestFile)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
      return {
        contractAddress: data.simpleCreditScore,
        transactionHash: data.transactionHash || '',
        blockNumber: data.blockNumber || 0,
        gasUsed: data.gasUsed || 0,
        network: data.network,
        timestamp: data.timestamp,
        verified: false
      };
    } catch (error) {
      console.error('Error reading deployment file:', error);
      return null;
    }
  }

  getNetworkExplorer(network: string): string {
    switch (network) {
      case 'goerli':
        return 'https://goerli.etherscan.io';
      case 'sepolia':
        return 'https://sepolia.etherscan.io';
      default:
        return 'https://etherscan.io';
    }
  }

  getExplorerUrl(network: string, address: string): string {
    return `${this.getNetworkExplorer(network)}/address/${address}`;
  }
}

export const realDeploymentService = new RealDeploymentService();