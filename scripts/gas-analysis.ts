const { ethers } = require("hardhat");

async function main() {
  console.log("⛽ Starting gas analysis for CryptoVault contracts...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Deploy contract for testing
  console.log("\n📋 Deploying SimpleCreditScore for gas analysis...");
  const SimpleCreditScore = await ethers.getContractFactory("SimpleCreditScore");
  const simpleCreditScore = await SimpleCreditScore.deploy();
  await simpleCreditScore.waitForDeployment();
  
  const deploymentReceipt = await simpleCreditScore.deploymentTransaction().wait();
  console.log(`✅ Contract deployed. Gas used: ${deploymentReceipt.gasUsed.toString()}`);
  
  const gasAnalysis = {
    deployment: Number(deploymentReceipt.gasUsed),
    operations: {}
  };
  
  // Test gas usage for different operations
  console.log("\n📊 Analyzing gas usage for operations...");
  
  // 1. Profile Creation
  console.log("\n1️⃣ Testing profile creation gas usage...");
  const createProfileTx = await simpleCreditScore.createCreditProfile(deployer.address);
  const createProfileReceipt = await createProfileTx.wait();
  gasAnalysis.operations.createProfile = Number(createProfileReceipt.gasUsed);
  console.log(`✅ Profile creation: ${createProfileReceipt.gasUsed.toString()} gas`);
  
  // 2. Score Updates with different data sizes
  console.log("\n2️⃣ Testing score update gas usage with different data sizes...");
  
  const testCases = [
    { name: "Small dataset (3 points)", data: [750, 800, 720] },
    { name: "Medium dataset (5 points)", data: [750, 800, 720, 680, 790] },
    { name: "Large dataset (10 points)", data: [750, 800, 720, 680, 790, 850, 730, 760, 810, 740] },
    { name: "Max dataset (20 points)", data: Array.from({length: 20}, () => Math.floor(Math.random() * 1000)) }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const weights = new Array(testCase.data.length).fill(1);
    
    const updateTx = await simpleCreditScore.updateScoreDimension(
      deployer.address,
      i % 5, // Cycle through dimensions
      testCase.data,
      weights
    );
    const updateReceipt = await updateTx.wait();
    
    gasAnalysis.operations[`scoreUpdate_${testCase.data.length}points`] = Number(updateReceipt.gasUsed);
    console.log(`✅ ${testCase.name}: ${updateReceipt.gasUsed.toString()} gas`);
  }
  
  // 3. View function gas usage (these don't cost gas but good to know)
  console.log("\n3️⃣ Testing view function complexity...");
  
  const startTime = Date.now();
  const [score, confidence] = await simpleCreditScore.getScoreDimension(deployer.address, 0);
  const dimensionTime = Date.now() - startTime;
  console.log(`✅ getScoreDimension: ${dimensionTime}ms response time`);
  
  const startTime2 = Date.now();
  const [compositeScore, overallConfidence] = await simpleCreditScore.getCompositeScore(deployer.address);
  const compositeTime = Date.now() - startTime2;
  console.log(`✅ getCompositeScore: ${compositeTime}ms response time`);
  
  // 4. Authorization operations
  console.log("\n4️⃣ Testing authorization gas usage...");
  
  const testAddress = "0x1234567890123456789012345678901234567890";
  const addAuthTx = await simpleCreditScore.addAuthorizedUpdater(testAddress);
  const addAuthReceipt = await addAuthTx.wait();
  gasAnalysis.operations.addAuthorizedUpdater = Number(addAuthReceipt.gasUsed);
  console.log(`✅ Add authorized updater: ${addAuthReceipt.gasUsed.toString()} gas`);
  
  const removeAuthTx = await simpleCreditScore.removeAuthorizedUpdater(testAddress);
  const removeAuthReceipt = await removeAuthTx.wait();
  gasAnalysis.operations.removeAuthorizedUpdater = Number(removeAuthReceipt.gasUsed);
  console.log(`✅ Remove authorized updater: ${removeAuthReceipt.gasUsed.toString()} gas`);
  
  // Calculate costs at different gas prices
  console.log("\n💰 Cost analysis at different gas prices:");
  const gasPrices = [10, 20, 50, 100]; // gwei
  
  console.log("\n📊 Gas Usage Summary:");
  console.log("=" .repeat(60));
  console.log(`Contract Deployment: ${gasAnalysis.deployment.toLocaleString()} gas`);
  console.log(`Profile Creation: ${gasAnalysis.operations.createProfile.toLocaleString()} gas`);
  console.log(`Score Update (5 points): ${gasAnalysis.operations.scoreUpdate_5points.toLocaleString()} gas`);
  console.log(`Score Update (20 points): ${gasAnalysis.operations.scoreUpdate_20points.toLocaleString()} gas`);
  console.log("=" .repeat(60));
  
  console.log("\n💸 Cost Estimates (USD at $2000 ETH):");
  gasPrices.forEach(gasPrice => {
    const deploymentCost = (gasAnalysis.deployment * gasPrice * 1e-9) * 2000;
    const profileCost = (gasAnalysis.operations.createProfile * gasPrice * 1e-9) * 2000;
    const updateCost = (gasAnalysis.operations.scoreUpdate_5points * gasPrice * 1e-9) * 2000;
    
    console.log(`\n⛽ At ${gasPrice} gwei:`);
    console.log(`   Deployment: $${deploymentCost.toFixed(2)}`);
    console.log(`   Profile Creation: $${profileCost.toFixed(4)}`);
    console.log(`   Score Update: $${updateCost.toFixed(4)}`);
  });
  
  // Optimization recommendations
  console.log("\n🔧 Optimization Recommendations:");
  console.log("1. ✅ Use batch operations for multiple score updates");
  console.log("2. ✅ Consider data compression for large datasets");
  console.log("3. ✅ Implement score update thresholds to reduce unnecessary updates");
  console.log("4. ✅ Use events for off-chain data aggregation");
  
  // Save gas analysis results
  const fs = require("fs");
  const path = require("path");
  
  const analysisDir = path.join(__dirname, "..", "gas-analysis");
  if (!fs.existsSync(analysisDir)) {
    fs.mkdirSync(analysisDir, { recursive: true });
  }
  
  const analysisFile = path.join(analysisDir, `gas-analysis-${Date.now()}.json`);
  fs.writeFileSync(analysisFile, JSON.stringify(gasAnalysis, null, 2));
  console.log(`\n💾 Gas analysis saved to: ${analysisFile}`);
  
  console.log("\n🎉 Gas analysis completed successfully!");
}

// Execute gas analysis
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };