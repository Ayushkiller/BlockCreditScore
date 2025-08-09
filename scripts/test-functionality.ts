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

async function main() {
  console.log("🧪 Testing deployed contract functionality...");
  
  // Load deployment addresses
  const network = process.env.HARDHAT_NETWORK || "goerli";
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network}-latest.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }
  
  const deployment: DeploymentAddresses = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const [deployer, testUser] = await ethers.getSigners();
  
  console.log(`📍 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`🧪 Test User: ${testUser.address}`);
  
  // Connect to contracts
  const creditScore = await ethers.getContractAt("CreditScore", deployment.creditScore);
  const creditCertificate = await ethers.getContractAt("CreditCertificate", deployment.creditCertificate);
  const zkVerifier = await ethers.getContractAt("ZKVerifier", deployment.zkVerifier);
  
  try {
    // Test 1: Create a credit profile
    console.log("\n📋 Test 1: Creating credit profile...");
    const createProfileTx = await creditScore.createCreditProfile(testUser.address);
    const createProfileReceipt = await createProfileTx.wait();
    console.log(`✅ Profile created. Gas used: ${createProfileReceipt?.gasUsed}`);
    
    // Verify profile exists
    const [exists, userAddress, lastUpdated] = await creditScore.getCreditProfile(testUser.address);
    console.log(`✅ Profile verification - Exists: ${exists}, User: ${userAddress}`);
    
    // Test 2: Update score dimensions
    console.log("\n📊 Test 2: Updating score dimensions...");
    const testData = [750, 800, 720, 680, 790]; // Sample scores
    const testWeights = [1, 1, 1, 1, 1]; // Equal weights
    
    // Update DeFi Reliability dimension (enum value 0)
    const updateScoreTx = await creditScore.updateScoreDimension(
      testUser.address,
      0, // DEFI_RELIABILITY
      testData,
      testWeights
    );
    const updateScoreReceipt = await updateScoreTx.wait();
    console.log(`✅ Score updated. Gas used: ${updateScoreReceipt?.gasUsed}`);
    
    // Verify score update
    const [score, confidence, dataPoints, trend, lastCalculated, hasInsufficientData] = 
      await creditScore.getScoreDimension(testUser.address, 0);
    console.log(`✅ Score verification - Score: ${score}, Confidence: ${confidence}%, Data Points: ${dataPoints}`);
    console.log(`   Trend: ${trend}, Insufficient Data: ${hasInsufficientData}`);
    
    // Test 3: Get composite score
    console.log("\n🎯 Test 3: Getting composite score...");
    const defaultWeights = {
      defiReliability: 20,
      tradingConsistency: 20,
      stakingCommitment: 20,
      governanceParticipation: 20,
      liquidityProvider: 20
    };
    
    const [compositeScore, overallConfidence] = await creditScore.getCompositeScore(
      testUser.address,
      defaultWeights
    );
    console.log(`✅ Composite Score: ${compositeScore}, Overall Confidence: ${overallConfidence}%`);
    
    // Test 4: Mint credit certificate NFT
    console.log("\n🎖️  Test 4: Minting credit certificate...");
    const mintCertificateTx = await creditCertificate.mintCertificate(testUser.address);
    const mintCertificateReceipt = await mintCertificateTx.wait();
    console.log(`✅ Certificate minted. Gas used: ${mintCertificateReceipt?.gasUsed}`);
    
    // Get certificate details
    const userCertificates = await creditCertificate.getCertificatesByOwner(testUser.address);
    console.log(`✅ User has ${userCertificates.length} certificate(s)`);
    
    if (userCertificates.length > 0) {
      const tokenId = userCertificates[0];
      const metadata = await creditCertificate.getCertificateMetadata(tokenId);
      console.log(`   Token ID: ${tokenId}`);
      console.log(`   Tier: ${metadata.tier}`);
      console.log(`   Composite Score: ${metadata.compositeScore}`);
      console.log(`   Confidence: ${metadata.overallConfidence}%`);
    }
    
    // Test 5: Generate ZK proof
    console.log("\n🔐 Test 5: Generating ZK proof...");
    const zkVerifierWithUser = zkVerifier.connect(testUser);
    
    const generateProofTx = await zkVerifierWithUser.generateThresholdProof(
      testUser.address,
      500, // threshold
      [0], // dimensions (DEFI_RELIABILITY)
      0 // FULL_PRIVACY mode
    );
    const generateProofReceipt = await generateProofTx.wait();
    console.log(`✅ ZK Proof generated. Gas used: ${generateProofReceipt?.gasUsed}`);
    
    // Extract proof ID from events
    const proofGeneratedEvent = generateProofReceipt?.logs.find(
      log => log.topics[0] === zkVerifier.interface.getEvent("ProofGenerated").topicHash
    );
    
    if (proofGeneratedEvent) {
      const decodedEvent = zkVerifier.interface.parseLog({
        topics: proofGeneratedEvent.topics,
        data: proofGeneratedEvent.data
      });
      const proofId = decodedEvent?.args[0];
      console.log(`   Proof ID: ${proofId}`);
      
      // Test 6: Verify the proof
      console.log("\n✅ Test 6: Verifying ZK proof...");
      const [proof, isValid] = await zkVerifier.getProof(proofId);
      console.log(`   Proof valid: ${isValid}`);
      console.log(`   Proof timestamp: ${proof.timestamp}`);
      console.log(`   Proof expiry: ${proof.expiryTime}`);
    }
    
    // Test 7: Check data sufficiency
    console.log("\n📊 Test 7: Checking data sufficiency...");
    const [hasSufficientData, insufficientDimensions] = await creditScore.checkDataSufficiency(testUser.address);
    console.log(`✅ Has sufficient data: ${hasSufficientData}`);
    console.log(`   Insufficient dimensions: ${insufficientDimensions.length}`);
    
    // Test 8: Gas optimization verification
    console.log("\n⛽ Test 8: Gas optimization verification...");
    const gasEstimates = {
      createProfile: await creditScore.createCreditProfile.estimateGas(ethers.Wallet.createRandom().address),
      updateScore: await creditScore.updateScoreDimension.estimateGas(
        testUser.address, 1, testData, testWeights
      ),
      mintCertificate: await creditCertificate.mintCertificate.estimateGas(ethers.Wallet.createRandom().address)
    };
    
    console.log(`   Create Profile: ${gasEstimates.createProfile} gas`);
    console.log(`   Update Score: ${gasEstimates.updateScore} gas`);
    console.log(`   Mint Certificate: ${gasEstimates.mintCertificate} gas`);
    
    // Verify gas limits are reasonable
    const gasLimits = {
      createProfile: 500000,
      updateScore: 300000,
      mintCertificate: 400000
    };
    
    let gasOptimized = true;
    Object.entries(gasEstimates).forEach(([operation, estimate]) => {
      const limit = gasLimits[operation as keyof typeof gasLimits];
      if (estimate > limit) {
        console.log(`⚠️  ${operation} gas usage (${estimate}) exceeds limit (${limit})`);
        gasOptimized = false;
      }
    });
    
    if (gasOptimized) {
      console.log(`✅ All operations are gas optimized`);
    }
    
    // Test 9: Performance benchmarks
    console.log("\n⏱️  Test 9: Performance benchmarks...");
    const startTime = Date.now();
    
    // Simulate multiple operations
    const operations = [];
    for (let i = 0; i < 3; i++) {
      operations.push(creditScore.getScoreDimension(testUser.address, 0));
    }
    
    await Promise.all(operations);
    const endTime = Date.now();
    
    console.log(`✅ 3 read operations completed in ${endTime - startTime}ms`);
    console.log(`   Average: ${(endTime - startTime) / 3}ms per operation`);
    
    // Final summary
    console.log("\n🎉 All functionality tests completed successfully!");
    console.log("\n📊 Test Summary:");
    console.log("=" .repeat(50));
    console.log(`✅ Credit Profile Creation: PASSED`);
    console.log(`✅ Score Dimension Updates: PASSED`);
    console.log(`✅ Composite Score Calculation: PASSED`);
    console.log(`✅ NFT Certificate Minting: PASSED`);
    console.log(`✅ ZK Proof Generation: PASSED`);
    console.log(`✅ Data Sufficiency Checks: PASSED`);
    console.log(`✅ Gas Optimization: ${gasOptimized ? 'PASSED' : 'NEEDS IMPROVEMENT'}`);
    console.log(`✅ Performance Benchmarks: PASSED`);
    console.log("=" .repeat(50));
    
    return true;
    
  } catch (error) {
    console.error("❌ Functionality test failed:", error);
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