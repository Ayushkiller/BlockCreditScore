import { ethers } from "hardhat";
import { Contract } from "ethers";
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
  console.log("🚀 Starting CryptoVault Credit Intelligence deployment...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  Warning: Low balance. Ensure you have enough ETH for deployment.");
  }

  const deploymentAddresses: DeploymentAddresses = {
    creditScore: "",
    creditCertificate: "",
    zkVerifier: "",
    network: network.name,
    blockNumber: 0,
    timestamp: Date.now()
  };

  try {
    // Step 1: Deploy CreditScore contract
    console.log("\n📋 Step 1: Deploying CreditScore contract...");
    const CreditScore = await ethers.getContractFactory("CreditScore");
    const creditScore = await CreditScore.deploy();
    await creditScore.waitForDeployment();
    
    const creditScoreAddress = await creditScore.getAddress();
    deploymentAddresses.creditScore = creditScoreAddress;
    
    console.log(`✅ CreditScore deployed to: ${creditScoreAddress}`);
    
    // Step 2: Deploy ZKVerifier contract
    console.log("\n🔐 Step 2: Deploying ZKVerifier contract...");
    const ZKVerifier = await ethers.getContractFactory("ZKVerifier");
    const zkVerifier = await ZKVerifier.deploy(creditScoreAddress);
    await zkVerifier.waitForDeployment();
    
    const zkVerifierAddress = await zkVerifier.getAddress();
    deploymentAddresses.zkVerifier = zkVerifierAddress;
    
    console.log(`✅ ZKVerifier deployed to: ${zkVerifierAddress}`);
    
    // Step 3: Deploy CreditCertificate contract
    console.log("\n🎖️  Step 3: Deploying CreditCertificate contract...");
    const CreditCertificate = await ethers.getContractFactory("CreditCertificate");
    const creditCertificate = await CreditCertificate.deploy(
      creditScoreAddress,
      "CryptoVault Credit Certificate",
      "CVCC"
    );
    await creditCertificate.waitForDeployment();
    
    const creditCertificateAddress = await creditCertificate.getAddress();
    deploymentAddresses.creditCertificate = creditCertificateAddress;
    
    console.log(`✅ CreditCertificate deployed to: ${creditCertificateAddress}`);
    
    // Step 4: Configure contract permissions
    console.log("\n⚙️  Step 4: Configuring contract permissions...");
    
    // Add ZKVerifier as authorized updater for CreditScore
    const addZKVerifierTx = await creditScore.addAuthorizedUpdater(zkVerifierAddress);
    await addZKVerifierTx.wait();
    console.log(`✅ Added ZKVerifier as authorized updater for CreditScore`);
    
    // Add CreditCertificate as authorized updater for CreditScore
    const addCertificateTx = await creditScore.addAuthorizedUpdater(creditCertificateAddress);
    await addCertificateTx.wait();
    console.log(`✅ Added CreditCertificate as authorized updater for CreditScore`);
    
    // Get current block number for deployment record
    const currentBlock = await ethers.provider.getBlockNumber();
    deploymentAddresses.blockNumber = currentBlock;
    
    // Step 5: Save deployment addresses
    console.log("\n💾 Step 5: Saving deployment addresses...");
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `${network.name}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentAddresses, null, 2));
    
    // Also save as latest deployment
    const latestFile = path.join(deploymentsDir, `${network.name}-latest.json`);
    fs.writeFileSync(latestFile, JSON.stringify(deploymentAddresses, null, 2));
    
    console.log(`✅ Deployment addresses saved to: ${deploymentFile}`);
    
    // Step 6: Verify gas usage and provide summary
    console.log("\n📊 Deployment Summary:");
    console.log("=" .repeat(50));
    console.log(`Network: ${network.name}`);
    console.log(`Block Number: ${currentBlock}`);
    console.log(`CreditScore: ${creditScoreAddress}`);
    console.log(`ZKVerifier: ${zkVerifierAddress}`);
    console.log(`CreditCertificate: ${creditCertificateAddress}`);
    console.log("=" .repeat(50));
    
    // Step 7: Test basic functionality
    console.log("\n🧪 Step 7: Testing basic contract functionality...");
    
    // Test CreditScore basic functions
    const maxScore = await creditScore.MAX_SCORE();
    console.log(`✅ CreditScore MAX_SCORE: ${maxScore}`);
    
    // Test ZKVerifier basic functions
    const isKeySet = await zkVerifier.isVerifyingKeySet();
    console.log(`✅ ZKVerifier key set status: ${isKeySet}`);
    
    // Test CreditCertificate basic functions
    const certificateName = await creditCertificate.name();
    const certificateSymbol = await creditCertificate.symbol();
    console.log(`✅ CreditCertificate: ${certificateName} (${certificateSymbol})`);
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Verify contracts on Etherscan using: npm run verify:goerli");
    console.log("2. Set up monitoring for real-time functionality");
    console.log("3. Configure data aggregation services to use these contract addresses");
    console.log("4. Test with actual testnet transactions");
    
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

export { main as deployContracts };