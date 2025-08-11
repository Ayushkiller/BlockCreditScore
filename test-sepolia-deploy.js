const { ethers } = require("hardhat");
require("dotenv").config();

async function testSepoliaDeployment() {
  try {
    console.log("🚀 Testing Sepolia deployment...");
    
    // Check network configuration
    const network = await ethers.provider.getNetwork();
    console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther("0.01")) {
      console.error("❌ Insufficient balance for deployment");
      return;
    }
    
    // Deploy SimpleCreditScore
    console.log("\n📋 Deploying SimpleCreditScore...");
    const SimpleCreditScore = await ethers.getContractFactory("SimpleCreditScore");
    const simpleCreditScore = await SimpleCreditScore.deploy();
    
    console.log("⏳ Waiting for deployment...");
    await simpleCreditScore.waitForDeployment();
    
    const address = await simpleCreditScore.getAddress();
    console.log(`✅ SimpleCreditScore deployed to: ${address}`);
    
    // Save deployment info
    const fs = require("fs");
    const path = require("path");
    
    const deploymentData = {
      simpleCreditScore: address,
      network: network.name,
      chainId: network.chainId,
      blockNumber: await ethers.provider.getBlockNumber(),
      timestamp: Date.now(),
      deployer: deployer.address
    };
    
    const deploymentsDir = path.join(__dirname, "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `sepolia-simple-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    
    const latestFile = path.join(deploymentsDir, "sepolia-simple-latest.json");
    fs.writeFileSync(latestFile, JSON.stringify(deploymentData, null, 2));
    
    console.log(`💾 Deployment saved to: ${deploymentFile}`);
    console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${address}`);
    
    return deploymentData;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

testSepoliaDeployment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });