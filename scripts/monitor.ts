import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface DeploymentAddresses {
  creditScore: string;
  creditCertificate: string;
  zkVerifier: string;
  network: string;
  blockNumber: number;
  timestamp: number;
}

interface MonitoringStats {
  totalProfiles: number;
  totalCertificates: number;
  totalProofs: number;
  gasUsage: {
    createProfile: number;
    updateScore: number;
    mintCertificate: number;
    generateProof: number;
  };
  lastChecked: number;
}

async function main() {
  console.log("📊 Starting real-time contract monitoring...");
  
  // Load deployment addresses
  const network = process.env.HARDHAT_NETWORK || "goerli";
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network}-latest.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }
  
  const deployment: DeploymentAddresses = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  // Connect to contracts
  const creditScore = await ethers.getContractAt("CreditScore", deployment.creditScore);
  const creditCertificate = await ethers.getContractAt("CreditCertificate", deployment.creditCertificate);
  const zkVerifier = await ethers.getContractAt("ZKVerifier", deployment.zkVerifier);
  
  console.log(`📍 Monitoring contracts on ${network}:`);
  console.log(`📋 CreditScore: ${deployment.creditScore}`);
  console.log(`🎖️  CreditCertificate: ${deployment.creditCertificate}`);
  console.log(`🔐 ZKVerifier: ${deployment.zkVerifier}`);
  
  // Set up event listeners
  console.log("\n🎧 Setting up event listeners...");
  
  // CreditScore events
  creditScore.on("CreditProfileCreated", (user, event) => {
    console.log(`📋 New Credit Profile Created: ${user}`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });
  
  creditScore.on("ScoreDimensionUpdated", (user, dimension, newScore, confidence, event) => {
    console.log(`📊 Score Updated: ${user}`);
    console.log(`   Dimension: ${dimension}, Score: ${newScore}, Confidence: ${confidence}%`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });
  
  // CreditCertificate events
  creditCertificate.on("CertificateMinted", (to, tokenId, tier, event) => {
    console.log(`🎖️  Certificate Minted: Token ${tokenId} for ${to}`);
    console.log(`   Tier: ${tier}`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });
  
  creditCertificate.on("TierUpgraded", (tokenId, oldTier, newTier, event) => {
    console.log(`⬆️  Tier Upgraded: Token ${tokenId}`);
    console.log(`   ${oldTier} → ${newTier}`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });
  
  // ZKVerifier events
  zkVerifier.on("ProofGenerated", (proofId, user, requester, privacyMode, event) => {
    console.log(`🔐 ZK Proof Generated: ${proofId.slice(0, 10)}...`);
    console.log(`   User: ${user}, Requester: ${requester}, Mode: ${privacyMode}`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });
  
  zkVerifier.on("ProofVerified", (proofId, isValid, status, event) => {
    console.log(`✅ Proof Verified: ${proofId.slice(0, 10)}...`);
    console.log(`   Valid: ${isValid}, Status: ${status}`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });
  
  // Periodic monitoring function
  async function performHealthCheck() {
    try {
      console.log("\n🏥 Performing health check...");
      
      const currentBlock = await ethers.provider.getBlockNumber();
      console.log(`📦 Current Block: ${currentBlock}`);
      
      // Check contract states
      const maxScore = await creditScore.MAX_SCORE();
      const isKeySet = await zkVerifier.isVerifyingKeySet();
      const certificateName = await creditCertificate.name();
      
      console.log(`📋 CreditScore MAX_SCORE: ${maxScore}`);
      console.log(`🔐 ZKVerifier key set: ${isKeySet}`);
      console.log(`🎖️  Certificate name: ${certificateName}`);
      
      // Check for any failed transactions in recent blocks
      const recentBlocks = 10;
      let failedTxCount = 0;
      
      for (let i = 0; i < recentBlocks; i++) {
        const blockNumber = currentBlock - i;
        const block = await ethers.provider.getBlock(blockNumber, true);
        
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (typeof tx === 'object' && tx.to) {
              const isOurContract = [
                deployment.creditScore,
                deployment.creditCertificate,
                deployment.zkVerifier
              ].includes(tx.to.toLowerCase());
              
              if (isOurContract) {
                try {
                  const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
                  if (receipt && receipt.status === 0) {
                    failedTxCount++;
                    console.log(`❌ Failed transaction: ${tx.hash}`);
                  }
                } catch (error) {
                  // Transaction might still be pending
                }
              }
            }
          }
        }
      }
      
      if (failedTxCount === 0) {
        console.log(`✅ No failed transactions in last ${recentBlocks} blocks`);
      } else {
        console.log(`⚠️  Found ${failedTxCount} failed transactions`);
      }
      
      // Gas price monitoring
      const gasPrice = await ethers.provider.getFeeData();
      console.log(`⛽ Current gas price: ${ethers.formatUnits(gasPrice.gasPrice || 0, "gwei")} gwei`);
      
      console.log(`🕐 Health check completed at ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error("❌ Health check failed:", error);
    }
  }
  
  // Perform initial health check
  await performHealthCheck();
  
  // Set up periodic health checks every 5 minutes
  const healthCheckInterval = setInterval(performHealthCheck, 5 * 60 * 1000);
  
  console.log("\n🔄 Monitoring active. Press Ctrl+C to stop.");
  console.log("📊 Health checks will run every 5 minutes.");
  console.log("🎧 Event listeners are active for real-time updates.");
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log("\n🛑 Shutting down monitoring...");
    clearInterval(healthCheckInterval);
    
    // Remove event listeners
    creditScore.removeAllListeners();
    creditCertificate.removeAllListeners();
    zkVerifier.removeAllListeners();
    
    console.log("✅ Monitoring stopped gracefully");
    process.exit(0);
  });
  
  // Keep the process running
  await new Promise(() => {});
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}