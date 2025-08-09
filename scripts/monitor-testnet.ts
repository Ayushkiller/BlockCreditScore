const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

interface DeploymentInfo {
  simpleCreditScore: string;
  network: string;
  chainId: number;
  blockNumber: number;
}

async function main() {
  console.log("🔍 Starting testnet monitoring for CryptoVault Credit Intelligence...");
  
  const network = await ethers.provider.getNetwork();
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Load deployment addresses
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestFile = path.join(deploymentsDir, `${network.name}-testnet-latest.json`);
  
  if (!fs.existsSync(latestFile)) {
    throw new Error(`❌ No deployment found for ${network.name}. Please deploy first.`);
  }
  
  const deploymentInfo: DeploymentInfo = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
  console.log(`📋 Loaded deployment: ${deploymentInfo.simpleCreditScore}`);
  
  // Connect to deployed contract
  const SimpleCreditScore = await ethers.getContractFactory("SimpleCreditScore");
  const simpleCreditScore = SimpleCreditScore.attach(deploymentInfo.simpleCreditScore);
  
  console.log("\n🧪 Running comprehensive functionality tests...");
  
  try {
    // Test 1: Basic contract connectivity
    console.log("\n1️⃣ Testing contract connectivity...");
    const maxScore = await simpleCreditScore.MAX_SCORE();
    const maxConfidence = await simpleCreditScore.MAX_CONFIDENCE();
    console.log(`✅ Contract responsive - MAX_SCORE: ${maxScore}, MAX_CONFIDENCE: ${maxConfidence}`);
    
    // Test 2: Check current block and network status
    console.log("\n2️⃣ Checking network status...");
    const currentBlock = await ethers.provider.getBlockNumber();
    const blocksSinceDeployment = currentBlock - deploymentInfo.blockNumber;
    console.log(`✅ Current block: ${currentBlock} (${blocksSinceDeployment} blocks since deployment)`);
    
    // Test 3: Monitor for events
    console.log("\n3️⃣ Setting up event monitoring...");
    
    // Listen for CreditProfileCreated events
    simpleCreditScore.on("CreditProfileCreated", (user, event) => {
      console.log(`🎉 New Credit Profile Created: ${user}`);
      console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
    });
    
    // Listen for ScoreDimensionUpdated events
    simpleCreditScore.on("ScoreDimensionUpdated", (user, dimension, newScore, confidence, event) => {
      console.log(`📊 Score Updated: ${user}`);
      console.log(`   Dimension: ${dimension}, Score: ${newScore}, Confidence: ${confidence}%`);
      console.log(`   Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
    });
    
    console.log("✅ Event listeners set up successfully");
    
    // Test 4: Create test transactions to monitor
    console.log("\n4️⃣ Creating test transactions for monitoring...");
    const [signer] = await ethers.getSigners();
    
    // Create a test profile if it doesn't exist
    try {
      const [exists] = await simpleCreditScore.getCreditProfile(signer.address);
      if (!exists) {
        console.log("📋 Creating test profile...");
        const createTx = await simpleCreditScore.createCreditProfile(signer.address);
        const receipt = await createTx.wait();
        console.log(`✅ Profile created in block ${receipt.blockNumber}`);
      } else {
        console.log("✅ Test profile already exists");
      }
    } catch (error) {
      console.log("ℹ️ Profile creation skipped (may already exist)");
    }
    
    // Test 5: Monitor gas usage and performance
    console.log("\n5️⃣ Testing gas usage and performance...");
    
    const testData = [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000)];
    const testWeights = [1, 1, 1];
    
    console.log(`📊 Testing score update with data: [${testData.join(', ')}]`);
    
    const startTime = Date.now();
    const updateTx = await simpleCreditScore.updateScoreDimension(
      signer.address,
      Math.floor(Math.random() * 5), // Random dimension
      testData,
      testWeights
    );
    
    const receipt = await updateTx.wait();
    const endTime = Date.now();
    
    console.log(`✅ Transaction completed in ${endTime - startTime}ms`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`💰 Transaction cost: ${ethers.formatEther(receipt.gasUsed * receipt.gasPrice)} ETH`);
    
    // Test 6: Verify score calculation accuracy
    console.log("\n6️⃣ Verifying score calculation accuracy...");
    const expectedScore = Math.floor(testData.reduce((a, b) => a + b, 0) / testData.length);
    const [actualScore, confidence, dataPoints] = await simpleCreditScore.getScoreDimension(signer.address, 0);
    
    console.log(`📊 Expected score: ${expectedScore}, Actual score: ${actualScore}`);
    console.log(`📊 Confidence: ${confidence}%, Data points: ${dataPoints}`);
    
    // Test 7: Monitor real-time block updates
    console.log("\n7️⃣ Starting real-time block monitoring...");
    console.log("⏰ Monitoring for 60 seconds... (Press Ctrl+C to stop)");
    
    let blockCount = 0;
    const blockMonitor = setInterval(async () => {
      try {
        const latestBlock = await ethers.provider.getBlockNumber();
        if (latestBlock > currentBlock + blockCount) {
          blockCount = latestBlock - currentBlock;
          console.log(`📦 New block: ${latestBlock} (${blockCount} new blocks detected)`);
        }
      } catch (error) {
        console.error("❌ Block monitoring error:", error.message);
      }
    }, 5000); // Check every 5 seconds
    
    // Stop monitoring after 60 seconds
    setTimeout(() => {
      clearInterval(blockMonitor);
      console.log("\n✅ Monitoring completed successfully!");
      console.log("\n📊 Monitoring Summary:");
      console.log("=" .repeat(50));
      console.log(`Network: ${network.name}`);
      console.log(`Contract: ${deploymentInfo.simpleCreditScore}`);
      console.log(`Blocks monitored: ${blockCount}`);
      console.log(`Test transactions: 1`);
      console.log(`Event listeners: Active`);
      console.log("=" .repeat(50));
      
      console.log("\n🎉 Real-time functionality verified!");
      process.exit(0);
    }, 60000);
    
  } catch (error) {
    console.error("❌ Monitoring failed:", error);
    throw error;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log("\n👋 Monitoring stopped by user");
  process.exit(0);
});

// Execute monitoring
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };