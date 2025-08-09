const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting CryptoVault testnet deployment...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  
  // Check minimum balance requirements
  const minBalance = ethers.parseEther("0.1");
  if (balance < minBalance) {
    throw new Error(`❌ Insufficient balance. Need at least 0.1 ETH, have ${ethers.formatEther(balance)} ETH`);
  }

  const deploymentAddresses = {
    simpleCreditScore: "",
    network: network.name,
    chainId: Number(network.chainId),
    blockNumber: 0,
    timestamp: Date.now(),
    deployer: deployer.address,
    gasUsed: {
      simpleCreditScore: 0,
      total: 0
    }
  };

  try {
    console.log("\n📋 Deploying SimpleCreditScore contract...");
    
    // Get gas price
    const gasPrice = await ethers.provider.getFeeData();
    console.log(`⛽ Gas Price: ${ethers.formatUnits(gasPrice.gasPrice, "gwei")} gwei`);
    
    // Deploy SimpleCreditScore contract
    const SimpleCreditScore = await ethers.getContractFactory("SimpleCreditScore");
    
    console.log(`📊 Deploying with estimated gas limit...`);
    
    const simpleCreditScore = await SimpleCreditScore.deploy();
    
    console.log(`⏳ Transaction hash: ${simpleCreditScore.deploymentTransaction().hash}`);
    console.log("⏳ Waiting for deployment confirmation...");
    
    await simpleCreditScore.waitForDeployment();
    
    const simpleCreditScoreAddress = await simpleCreditScore.getAddress();
    deploymentAddresses.simpleCreditScore = simpleCreditScoreAddress;
    
    // Get deployment receipt for gas usage
    const deploymentReceipt = await simpleCreditScore.deploymentTransaction().wait();
    deploymentAddresses.gasUsed.simpleCreditScore = Number(deploymentReceipt.gasUsed);
    deploymentAddresses.gasUsed.total = Number(deploymentReceipt.gasUsed);
    
    console.log(`✅ SimpleCreditScore deployed to: ${simpleCreditScoreAddress}`);
    console.log(`⛽ Gas used: ${deploymentReceipt.gasUsed.toString()}`);
    
    // Get current block number for deployment record
    const currentBlock = await ethers.provider.getBlockNumber();
    deploymentAddresses.blockNumber = currentBlock;
    
    // Save deployment addresses
    console.log("\n💾 Saving deployment addresses...");
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const deploymentFile = path.join(deploymentsDir, `${network.name}-testnet-${timestamp}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentAddresses, null, 2));
    
    // Also save as latest deployment
    const latestFile = path.join(deploymentsDir, `${network.name}-testnet-latest.json`);
    fs.writeFileSync(latestFile, JSON.stringify(deploymentAddresses, null, 2));
    
    console.log(`✅ Deployment addresses saved to: ${deploymentFile}`);
    
    // Test basic functionality
    console.log("\n🧪 Testing basic contract functionality...");
    
    // Test constants
    const maxScore = await simpleCreditScore.MAX_SCORE();
    const maxConfidence = await simpleCreditScore.MAX_CONFIDENCE();
    console.log(`✅ MAX_SCORE: ${maxScore}`);
    console.log(`✅ MAX_CONFIDENCE: ${maxConfidence}`);
    
    // Test profile creation
    console.log("\n📋 Testing profile creation...");
    const createProfileTx = await simpleCreditScore.createCreditProfile(deployer.address);
    const createProfileReceipt = await createProfileTx.wait();
    console.log(`✅ Profile created. Gas used: ${createProfileReceipt.gasUsed}`);
    
    // Verify profile exists
    const [exists, userAddress, lastUpdated] = await simpleCreditScore.getCreditProfile(deployer.address);
    console.log(`✅ Profile verification - Exists: ${exists}, User: ${userAddress}`);
    
    // Test score update with realistic DeFi data
    console.log("\n📊 Testing score update with sample DeFi data...");
    const testData = [750, 800, 720, 680, 790, 850, 730]; // Sample DeFi reliability scores
    const testWeights = [1, 1, 1, 1, 1, 1, 1]; // Equal weights
    
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
    console.log(`✅ Trend: ${trend === 0 ? 'IMPROVING' : trend === 1 ? 'STABLE' : 'DECLINING'}`);
    console.log(`✅ Has Insufficient Data: ${hasInsufficientData}`);
    
    // Test composite score
    console.log("\n🎯 Testing composite score...");
    const [compositeScore, overallConfidence] = await simpleCreditScore.getCompositeScore(deployer.address);
    console.log(`✅ Composite Score: ${compositeScore}, Overall Confidence: ${overallConfidence}%`);
    
    // Test authorization functionality
    console.log("\n🔐 Testing authorization functionality...");
    const isAuthorized = await simpleCreditScore.authorizedUpdaters(deployer.address);
    console.log(`✅ Deployer authorized: ${isAuthorized}`);
    
    console.log("\n📊 Deployment Summary:");
    console.log("=" .repeat(60));
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Block Number: ${currentBlock}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`SimpleCreditScore: ${simpleCreditScoreAddress}`);
    console.log(`Total Gas Used: ${deploymentAddresses.gasUsed.total.toLocaleString()}`);
    console.log(`Deployment Cost: ~${ethers.formatEther(BigInt(deploymentAddresses.gasUsed.total) * gasPrice.gasPrice)} ETH`);
    console.log("=" .repeat(60));
    
    console.log("\n🎉 Testnet deployment completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network ${network.name} ${simpleCreditScoreAddress}`);
    console.log("2. Set up monitoring for real-time functionality");
    console.log("3. Test with actual testnet transactions");
    console.log("4. Update environment variables with deployed addresses");
    
    // Update environment file with deployed address
    const envFile = `.env.${network.name}`;
    const envContent = `# Deployed contract addresses for ${network.name}\n${network.name.toUpperCase()}_SIMPLE_CREDIT_SCORE=${simpleCreditScoreAddress}\n`;
    fs.appendFileSync(envFile, envContent);
    console.log(`5. Contract address saved to ${envFile}`);
    
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