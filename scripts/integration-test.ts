const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Starting comprehensive integration test...");
  
  const [deployer, user1, user2] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`👤 User1: ${user1.address}`);
  console.log(`👤 User2: ${user2.address}`);
  
  // Deploy contract
  console.log("\n📋 Deploying SimpleCreditScore for integration testing...");
  const SimpleCreditScore = await ethers.getContractFactory("SimpleCreditScore");
  const simpleCreditScore = await SimpleCreditScore.deploy();
  await simpleCreditScore.waitForDeployment();
  
  const contractAddress = await simpleCreditScore.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}`);
  
  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Helper function to run tests
  async function runTest(testName: string, testFunction: () => Promise<void>) {
    try {
      console.log(`\n🔍 ${testName}...`);
      await testFunction();
      console.log(`✅ ${testName} - PASSED`);
      testResults.passed++;
      testResults.tests.push({ name: testName, status: "PASSED" });
    } catch (error) {
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
      testResults.failed++;
      testResults.tests.push({ name: testName, status: "FAILED", error: error.message });
    }
  }
  
  // Test 1: Contract Constants
  await runTest("Contract Constants Verification", async () => {
    const maxScore = await simpleCreditScore.MAX_SCORE();
    const maxConfidence = await simpleCreditScore.MAX_CONFIDENCE();
    
    if (maxScore !== 1000n) throw new Error(`Expected MAX_SCORE 1000, got ${maxScore}`);
    if (maxConfidence !== 100n) throw new Error(`Expected MAX_CONFIDENCE 100, got ${maxConfidence}`);
  });
  
  // Test 2: Profile Creation
  await runTest("Profile Creation", async () => {
    await simpleCreditScore.createCreditProfile(user1.address);
    const [exists, userAddress, lastUpdated] = await simpleCreditScore.getCreditProfile(user1.address);
    
    if (!exists) throw new Error("Profile should exist after creation");
    if (userAddress !== user1.address) throw new Error("User address mismatch");
    if (lastUpdated === 0n) throw new Error("Last updated should be set");
  });
  
  // Test 3: Duplicate Profile Prevention
  await runTest("Duplicate Profile Prevention", async () => {
    try {
      await simpleCreditScore.createCreditProfile(user1.address);
      throw new Error("Should not allow duplicate profile creation");
    } catch (error) {
      if (!error.message.includes("Profile already exists")) {
        throw new Error("Wrong error message for duplicate profile");
      }
    }
  });
  
  // Test 4: Score Dimension Updates
  await runTest("Score Dimension Updates", async () => {
    const testData = [750, 800, 720, 680, 790];
    const testWeights = [1, 1, 1, 1, 1];
    
    await simpleCreditScore.updateScoreDimension(user1.address, 0, testData, testWeights);
    
    const [score, confidence, dataPoints, trend, lastCalculated, hasInsufficientData] = 
      await simpleCreditScore.getScoreDimension(user1.address, 0);
    
    const expectedScore = Math.floor(testData.reduce((a, b) => a + b, 0) / testData.length);
    if (score !== BigInt(expectedScore)) throw new Error(`Score mismatch: expected ${expectedScore}, got ${score}`);
    if (confidence !== 80n) throw new Error(`Confidence should be 80% for 5 data points, got ${confidence}%`);
    if (dataPoints !== 5n) throw new Error(`Data points should be 5, got ${dataPoints}`);
    if (hasInsufficientData) throw new Error("Should not have insufficient data with 5 points");
  });
  
  // Test 5: Insufficient Data Handling
  await runTest("Insufficient Data Handling", async () => {
    await simpleCreditScore.createCreditProfile(user2.address);
    
    const testData = [750, 800]; // Only 2 data points
    const testWeights = [1, 1];
    
    await simpleCreditScore.updateScoreDimension(user2.address, 1, testData, testWeights);
    
    const [score, confidence, dataPoints, trend, lastCalculated, hasInsufficientData] = 
      await simpleCreditScore.getScoreDimension(user2.address, 1);
    
    if (!hasInsufficientData) throw new Error("Should have insufficient data with only 2 points");
    if (confidence !== 40n) throw new Error(`Confidence should be 40% for 2 data points, got ${confidence}%`);
  });
  
  // Test 6: Multiple Dimensions
  await runTest("Multiple Dimensions Support", async () => {
    const dimensions = [0, 1, 2, 3, 4]; // All 5 dimensions
    
    for (let dim of dimensions) {
      const testData = Array.from({length: 6}, () => Math.floor(Math.random() * 1000));
      const testWeights = new Array(6).fill(1);
      
      await simpleCreditScore.updateScoreDimension(user1.address, dim, testData, testWeights);
    }
    
    // Verify all dimensions are updated
    for (let dim of dimensions) {
      const [score, confidence, dataPoints] = await simpleCreditScore.getScoreDimension(user1.address, dim);
      if (dataPoints < 5n) throw new Error(`Dimension ${dim} should have sufficient data`);
    }
  });
  
  // Test 7: Composite Score Calculation
  await runTest("Composite Score Calculation", async () => {
    const [compositeScore, overallConfidence] = await simpleCreditScore.getCompositeScore(user1.address);
    
    if (compositeScore === 0n) throw new Error("Composite score should not be zero with valid dimensions");
    if (overallConfidence === 0n) throw new Error("Overall confidence should not be zero");
  });
  
  // Test 8: Authorization System
  await runTest("Authorization System", async () => {
    // Test initial authorization
    const isInitiallyAuthorized = await simpleCreditScore.authorizedUpdaters(deployer.address);
    if (!isInitiallyAuthorized) throw new Error("Deployer should be initially authorized");
    
    // Test adding authorization
    await simpleCreditScore.addAuthorizedUpdater(user1.address);
    const isAuthorized = await simpleCreditScore.authorizedUpdaters(user1.address);
    if (!isAuthorized) throw new Error("User1 should be authorized after adding");
    
    // Test removing authorization
    await simpleCreditScore.removeAuthorizedUpdater(user1.address);
    const isStillAuthorized = await simpleCreditScore.authorizedUpdaters(user1.address);
    if (isStillAuthorized) throw new Error("User1 should not be authorized after removal");
  });
  
  // Test 9: Unauthorized Access Prevention
  await runTest("Unauthorized Access Prevention", async () => {
    const user1Contract = simpleCreditScore.connect(user1);
    
    try {
      await user1Contract.createCreditProfile(user2.address);
      throw new Error("Should not allow unauthorized profile creation");
    } catch (error) {
      if (!error.message.includes("Not authorized")) {
        throw new Error("Wrong error message for unauthorized access");
      }
    }
  });
  
  // Test 10: Score Trend Calculation
  await runTest("Score Trend Calculation", async () => {
    // First update with lower score
    await simpleCreditScore.updateScoreDimension(user2.address, 0, [500, 520, 510], [1, 1, 1]);
    
    // Second update with higher score (should show improving trend)
    await simpleCreditScore.updateScoreDimension(user2.address, 0, [700, 720, 710], [1, 1, 1]);
    
    const [score, confidence, dataPoints, trend] = await simpleCreditScore.getScoreDimension(user2.address, 0);
    
    // Trend: 0 = IMPROVING, 1 = STABLE, 2 = DECLINING
    if (trend !== 0n) throw new Error(`Expected IMPROVING trend (0), got ${trend}`);
  });
  
  // Test 11: Edge Cases
  await runTest("Edge Cases Handling", async () => {
    // Test with maximum score values
    const maxData = [1000, 1000, 1000, 1000, 1000];
    const weights = [1, 1, 1, 1, 1];
    
    await simpleCreditScore.updateScoreDimension(user2.address, 2, maxData, weights);
    const [maxScore] = await simpleCreditScore.getScoreDimension(user2.address, 2);
    
    if (maxScore !== 1000n) throw new Error(`Max score should be capped at 1000, got ${maxScore}`);
    
    // Test with zero values
    const zeroData = [0, 0, 0, 0, 0];
    await simpleCreditScore.updateScoreDimension(user2.address, 3, zeroData, weights);
    const [zeroScore] = await simpleCreditScore.getScoreDimension(user2.address, 3);
    
    if (zeroScore !== 0n) throw new Error(`Zero score should remain 0, got ${zeroScore}`);
  });
  
  // Test 12: Gas Efficiency
  await runTest("Gas Efficiency Check", async () => {
    const testData = [750, 800, 720, 680, 790];
    const testWeights = [1, 1, 1, 1, 1];
    
    const tx = await simpleCreditScore.updateScoreDimension(user1.address, 4, testData, testWeights);
    const receipt = await tx.wait();
    
    // Gas should be reasonable (less than 200k for score update)
    if (receipt.gasUsed > 200000n) {
      throw new Error(`Gas usage too high: ${receipt.gasUsed} > 200,000`);
    }
  });
  
  // Print test results
  console.log("\n📊 Integration Test Results:");
  console.log("=" .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log("=" .repeat(60));
  
  if (testResults.failed > 0) {
    console.log("\n❌ Failed Tests:");
    testResults.tests.filter(t => t.status === "FAILED").forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
  }
  
  // Save test results
  const fs = require("fs");
  const path = require("path");
  
  const testDir = path.join(__dirname, "..", "test-results");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testFile = path.join(testDir, `integration-test-${Date.now()}.json`);
  fs.writeFileSync(testFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    network: network.name,
    contractAddress,
    results: testResults
  }, null, 2));
  
  console.log(`\n💾 Test results saved to: ${testFile}`);
  
  if (testResults.failed === 0) {
    console.log("\n🎉 All integration tests passed! Contract is ready for testnet deployment.");
  } else {
    console.log("\n⚠️  Some tests failed. Please review and fix issues before testnet deployment.");
    process.exit(1);
  }
}

// Execute integration test
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };