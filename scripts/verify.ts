import { run } from "hardhat";
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
  console.log("🔍 Starting contract verification...");
  
  // Load latest deployment addresses
  const network = process.env.HARDHAT_NETWORK || "goerli";
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network}-latest.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }
  
  const deployment: DeploymentAddresses = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  console.log(`📍 Network: ${deployment.network}`);
  console.log(`📋 CreditScore: ${deployment.creditScore}`);
  console.log(`🔐 ZKVerifier: ${deployment.zkVerifier}`);
  console.log(`🎖️  CreditCertificate: ${deployment.creditCertificate}`);
  
  try {
    // Verify CreditScore contract
    console.log("\n📋 Verifying CreditScore contract...");
    await run("verify:verify", {
      address: deployment.creditScore,
      constructorArguments: [],
    });
    console.log("✅ CreditScore verified successfully");
    
    // Verify ZKVerifier contract
    console.log("\n🔐 Verifying ZKVerifier contract...");
    await run("verify:verify", {
      address: deployment.zkVerifier,
      constructorArguments: [deployment.creditScore],
    });
    console.log("✅ ZKVerifier verified successfully");
    
    // Verify CreditCertificate contract
    console.log("\n🎖️  Verifying CreditCertificate contract...");
    await run("verify:verify", {
      address: deployment.creditCertificate,
      constructorArguments: [
        deployment.creditScore,
        "CryptoVault Credit Certificate",
        "CVCC"
      ],
    });
    console.log("✅ CreditCertificate verified successfully");
    
    console.log("\n🎉 All contracts verified successfully!");
    console.log("\n📝 Verification URLs:");
    console.log(`CreditScore: https://${network}.etherscan.io/address/${deployment.creditScore}`);
    console.log(`ZKVerifier: https://${network}.etherscan.io/address/${deployment.zkVerifier}`);
    console.log(`CreditCertificate: https://${network}.etherscan.io/address/${deployment.creditCertificate}`);
    
  } catch (error) {
    console.error("❌ Verification failed:", error);
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