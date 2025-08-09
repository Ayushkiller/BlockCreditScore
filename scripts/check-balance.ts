const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Checking account balance and network status...");
  
  try {
    const [signer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    
    console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`👤 Account: ${signer.address}`);
    
    // Check balance
    const balance = await ethers.provider.getBalance(signer.address);
    const balanceEth = ethers.formatEther(balance);
    console.log(`💰 Balance: ${balanceEth} ETH`);
    
    // Check if balance is sufficient for deployment
    const minBalance = 0.1;
    if (parseFloat(balanceEth) < minBalance) {
      console.log(`⚠️  Warning: Balance is below recommended minimum of ${minBalance} ETH`);
      console.log("🚰 Get testnet ETH from faucets:");
      if (network.name === 'goerli') {
        console.log("   - https://goerlifaucet.com/");
        console.log("   - https://faucets.chain.link/goerli");
      } else if (network.name === 'sepolia') {
        console.log("   - https://sepoliafaucet.com/");
        console.log("   - https://faucets.chain.link/sepolia");
      }
    } else {
      console.log("✅ Balance is sufficient for deployment");
    }
    
    // Check network connectivity
    console.log("\n🌐 Testing network connectivity...");
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`📦 Latest block: ${blockNumber}`);
    
    // Get gas price
    const feeData = await ethers.provider.getFeeData();
    console.log(`⛽ Gas price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`);
    
    // Estimate deployment cost
    const estimatedGas = 2500000; // Approximate gas for contract deployment
    const estimatedCost = BigInt(estimatedGas) * feeData.gasPrice;
    console.log(`💸 Estimated deployment cost: ~${ethers.formatEther(estimatedCost)} ETH`);
    
    console.log("\n✅ Network status check completed!");
    
  } catch (error) {
    console.error("❌ Network check failed:", error.message);
    
    if (error.message.includes("could not detect network")) {
      console.log("🔧 Troubleshooting tips:");
      console.log("1. Check your RPC URL in .env file");
      console.log("2. Verify your internet connection");
      console.log("3. Try a different RPC provider");
    } else if (error.message.includes("private key")) {
      console.log("🔧 Troubleshooting tips:");
      console.log("1. Check PRIVATE_KEY in .env file");
      console.log("2. Ensure private key is without 0x prefix");
      console.log("3. Verify the private key is valid");
    }
    
    throw error;
  }
}

// Execute balance check
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };