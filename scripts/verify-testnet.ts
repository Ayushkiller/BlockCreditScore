const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

interface DeploymentInfo {
  simpleCreditScore: string;
  network: string;
  chainId: number;
}

async function main() {
  console.log("🔍 Starting contract verification on testnet...");
  
  const network = await hre.network.name;
  console.log(`📍 Network: ${network}`);
  
  // Load deployment addresses
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestFile = path.join(deploymentsDir, `${network}-testnet-latest.json`);
  
  if (!fs.existsSync(latestFile)) {
    throw new Error(`❌ No deployment found for ${network}. Please deploy first.`);
  }
  
  const deploymentInfo: DeploymentInfo = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
  console.log(`📋 Loaded deployment: ${deploymentInfo.simpleCreditScore}`);
  
  try {
    console.log("\n📝 Verifying SimpleCreditScore contract...");
    
    await run("verify:verify", {
      address: deploymentInfo.simpleCreditScore,
      constructorArguments: [], // SimpleCreditScore has no constructor arguments
      contract: "contracts/SimpleCreditScore.sol:SimpleCreditScore"
    });
    
    console.log("✅ SimpleCreditScore contract verified successfully!");
    
    console.log("\n📊 Verification Summary:");
    console.log("=" .repeat(50));
    console.log(`Network: ${network}`);
    console.log(`SimpleCreditScore: ${deploymentInfo.simpleCreditScore}`);
    console.log(`Etherscan URL: https://${network === 'goerli' ? 'goerli.' : network === 'sepolia' ? 'sepolia.' : ''}etherscan.io/address/${deploymentInfo.simpleCreditScore}`);
    console.log("=" .repeat(50));
    
    console.log("\n🎉 Contract verification completed successfully!");
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error);
      throw error;
    }
  }
}

// Execute verification
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };