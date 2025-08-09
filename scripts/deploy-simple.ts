const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting simplified CryptoVault deployment for testnet...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.05")) {
    console.warn("⚠️  Warning: Low balance. Ensure you have enough ETH for deployment.");
  }

  const deploymentAddresses = {
    simpleCreditScore: "",
    network: network.name,
    blockNumber: 0,
    timestamp: Date.now()
  };

  try {
    // Deploy SimpleCreditScore contract
    console.log("\n📋 Deploying SimpleCreditScore contract...");
    const SimpleCreditScore = await ethers.getContractFactory("SimpleCreditScore");
    const simpleCreditScore = await SimpleCreditScore.deploy();
    await simpleCreditScore.waitForDeployment();
    
    const simpleCreditScoreAddress = await simpleCreditScore.getAddress();
    deploymentAddresses.simpleCreditScore = simpleCreditScoreAddress;
    
    console.log(`✅ SimpleCreditScore deployed to: ${simpleCreditScoreAddress}`);
    
    // Get current block number for deployment record
    const currentBlock = await ethers.provider.getBlockNumber();
    deploymentAddresses.blockNumber = currentBlock;
    
    // Save deployment addresses
    console.log("\n💾 Saving deployment addresses...");
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `${network.name}-simple-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentAddresses, null, 2));
    
    // Also save as latest deployment
    const latestFile = path.join(deploymentsDir, `${network.name}-simple-latest.json`);
    fs.writeFileSync(latestFile, JSON.stringify(deploymentAddresses, null, 2));
    
    console.log(`✅ Deployment addresses saved to: ${deploymentFile}`);
    
    // Test basic functionality
    console.log("\n🧪 Testing basic contract functionality...");
    
    // Test constants
    const maxScore = await simpleCreditScore.MAX_SCORE();
    console.log(`✅ MAX_SCORE: ${maxScore}`);
    
    // Test profile creation
    console.log("\n📋 Testing profile creation...");
    const createProfileTx = await simpleCreditScore.createCreditProfile(deployer.address);
    const createProfileReceipt = await createProfileTx.wait();
    console.log(`✅ Profile created. Gas used: ${createProfileReceipt.gasUsed}`);
    
    // Verify profile exists
    const [exists, userAddress, lastUpdated] = await simpleCreditScore.getCreditProfile(deployer.address);
    console.log(`✅ Profile verification - Exists: ${exists}, User: ${userAddress}`);
    
    // Test score update
    console.log("\n📊 Testing score update...");
    const testData = [750, 800, 720, 680, 790]; // Sample scores
    const testWeights = [1, 1, 1, 1, 1]; // Equal weights
    
    const updateScoreTx = await simpleCreditScore.updateScoreDimension(
      deployer.address,
      0, // DEFI_RELIABILITY
      testData,
      testWeights
    );
    const updateScoreReceipt = await updateScoreTx.wait();
    console.log(`✅ Score updated. Gas used: ${updateScoreReceipt.gasUsed}`);
    
    // Verify score update
    const [score, confidence, dataPoints, trend, lastCalculated, hasInsufficientData] = 
      await simpleCreditScore.getScoreDimension(deployer.address, 0);
    console.log(`✅ Score verification - Score: ${score}, Confidence: ${confidence}%, Data Points: ${dataPoints}`);
    
    // Test composite score
    console.log("\n🎯 Testing composite score...");
    const [compositeScore, overallConfidence] = await simpleCreditScore.getCompositeScore(deployer.address);
    console.log(`✅ Composite Score: ${compositeScore}, Overall Confidence: ${overallConfidence}%`);
    
    console.log("\n📊 Deployment Summary:");
    console.log("=" .repeat(50));
    console.log(`Network: ${network.name}`);
    console.log(`Block Number: ${currentBlock}`);
    console.log(`SimpleCreditScore: ${simpleCreditScoreAddress}`);
    console.log("=" .repeat(50));
    
    console.log("\n🎉 Simplified deployment completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Verify contract on Etherscan");
    console.log("2. Set up monitoring for real-time functionality");
    console.log("3. Test with actual testnet transactions");
    
    return deploymentAddresses;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };