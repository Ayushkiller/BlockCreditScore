const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("📊 Starting SimpleCreditScore monitoring...");
  
  // Load deployment addresses
  const network = process.env.HARDHAT_NETWORK || "hardhat";
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network}-simple-latest.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  // Connect to contract
  const simpleCreditScore = await ethers.getContractAt("SimpleCreditScore", deployment.simpleCreditScore);
  
  console.log(`📍 Monitoring SimpleCreditScore on ${network}:`);
  console.log(`📋 Contract: ${deployment.simpleCreditScore}`);
  
  // Set up event listeners
  console.log("\n🎧 Setting up event listeners...");
  
  // Profile creation events
  simpleCreditScore.on("CreditProfileCreated", (user, event) => {
    console.log(`📋 New Credit Profile Created: ${user}`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });
  
  // Score update events
  simpleCreditScore.on("ScoreDimensionUpdated", (user, dimension, newScore, confidence, event) => {
    console.log(`📊 Score Updated: ${user}`);
    console.log(`   Dimension: ${dimension}, Score: ${newScore}, Confidence: ${confidence}%`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });
  
  // Wallet linking events
  simpleCreditScore.on("WalletLinked", (user, linkedWallet, event) => {
    console.log(`🔗 Wallet Linked: ${linkedWallet} to ${user}`);
    console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
  });
  
  // Periodic health check function
  async function performHealthCheck() {
    try {
      console.log("\n🏥 Performing health check...");
      
      const currentBlock = await ethers.provider.getBlockNumber();
      console.log(`📦 Current Block: ${currentBlock}`);
      
      // Check contract state
      const maxScore = await simpleCreditScore.MAX_SCORE();
      const maxConfidence = await simpleCreditScore.MAX_CONFIDENCE();
      
      console.log(`📋 Contract Constants:`);
      console.log(`   MAX_SCORE: ${maxScore}`);
      console.log(`   MAX_CONFIDENCE: ${maxConfidence}`);
      
      // Check owner
      const owner = await simpleCreditScore.owner();
      console.log(`👤 Contract Owner: ${owner}`);
      
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
  
  // Set up periodic health checks every 2 minutes for testing
  const healthCheckInterval = setInterval(performHealthCheck, 2 * 60 * 1000);
  
  console.log("\n🔄 Monitoring active. Press Ctrl+C to stop.");
  console.log("📊 Health checks will run every 2 minutes.");
  console.log("🎧 Event listeners are active for real-time updates.");
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log("\n🛑 Shutting down monitoring...");
    clearInterval(healthCheckInterval);
    
    // Remove event listeners
    simpleCreditScore.removeAllListeners();
    
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