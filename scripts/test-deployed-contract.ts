const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing deployed SimpleCreditScore contract...");
  
  const [deployer, testUser1, testUser2] = await ethers.getSigners();
  
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`🧪 Test User 1: ${testUser1.address}`);
  console.log(`🧪 Test User 2: ${testUser2.address}`);
  
  // Deploy a fresh contract for testing
  console.log("\n📋 Deploying fresh contract for testing...");
  const SimpleCreditScore = await ethers.getContractFactory("SimpleCreditScore");
  const simpleCreditScore = await SimpleCreditScore.deploy();
  await simpleCreditScore.waitForDeployment();
  
  const contractAddress = await simpleCreditScore.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}`);
  
  try {
    // Test 1: Create credit profiles
    console.log("\n📋 Test 1: Creating credit profiles...");
    
    const createProfile1Tx = await simpleCreditScore.createCreditProfile(testUser1.address);
    await createProfile1Tx.wait();
    console.log(`✅ Profile 1 created for ${testUser1.address}`);
    
    const createProfile2Tx = await simpleCreditScore.createCreditProfile(testUser2.address);
    await createProfile2Tx.wait();
    console.log(`✅ Profile 2 created for ${testUser2.address}`);
    
    // Test 2: Verify profiles exist
    console.log("\n🔍 Test 2: Verifying profiles...");
    
    const [user1Exists, user1Address, user1LastUpdated] = await simpleCreditScore.getCreditProfile(testUser1.address);
    console.log(`User 1 - Exists: ${user1Exists}, Address: ${user1Address}`);
    
    const [user2Exists, user2Address, user2LastUpdated] = await simpleCreditScore.getCreditProfile(testUser2.address);
    console.log(`User 2 - Exists: ${user2Exists}, Address: ${user2Address}`);
    
    // Test 3: Update scores
    console.log("\n📊 Test 3: Updating scores...");
    
    const highScores = [850, 900, 820, 880, 870];
    const updateUser1Tx = await simpleCreditScore.updateScoreDimension(
      testUser1.address,
      0, // DEFI_RELIABILITY
      highScores,
      []
    );
    await updateUser1Tx.wait();
    console.log(`✅ User 1 DeFi Reliability updated`);
    
    // Test 4: Check individual dimension
    console.log("\n📈 Test 4: Checking individual dimension...");
    
    const [score, confidence, dataPoints, trend, lastCalculated, hasInsufficientData] = 
      await simpleCreditScore.getScoreDimension(testUser1.address, 0);
    
    console.log(`User 1 DeFi Reliability:`);
    console.log(`  Score: ${score}`);
    console.log(`  Confidence: ${confidence}%`);
    console.log(`  Data Points: ${dataPoints}`);
    console.log(`  Has Insufficient Data: ${hasInsufficientData}`);
    
    // Test 5: Get composite score
    console.log("\n🎯 Test 5: Getting composite score...");
    
    const [compositeScore, overallConfidence] = await simpleCreditScore.getCompositeScore(testUser1.address);
    console.log(`User 1 Composite Score: ${compositeScore}, Confidence: ${overallConfidence}%`);
    
    // Test 6: Test user with no sufficient data
    console.log("\n📊 Test 6: Testing user with insufficient data...");
    
    const [user2CompositeScore, user2OverallConfidence] = await simpleCreditScore.getCompositeScore(testUser2.address);
    console.log(`User 2 Composite Score: ${user2CompositeScore}, Confidence: ${user2OverallConfidence}%`);
    
    // Test 7: Gas estimation
    console.log("\n⛽ Test 7: Gas estimation...");
    
    const gasEstimate = await simpleCreditScore.updateScoreDimension.estimateGas(
      testUser1.address, 1, [600, 650, 700], []
    );
    console.log(`Update score gas estimate: ${gasEstimate}`);
    
    console.log("\n🎉 All tests completed successfully!");
    
    return true;
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}