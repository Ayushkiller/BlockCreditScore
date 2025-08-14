// Debug script to see what Etherscan API is actually returning
const axios = require('axios');
require('dotenv').config();

async function debugEtherscan() {
  console.log('Debugging Etherscan API response...\n');
  
  const testAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
  
  if (!etherscanApiKey) {
    console.log('❌ No Etherscan API key found');
    return;
  }
  
  try {
    console.log(`Testing address: ${testAddress}`);
    console.log(`API Key: ${etherscanApiKey.substring(0, 8)}...`);
    
    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'txlist',
        address: testAddress,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: 5, // Just get 5 transactions for debugging
        sort: 'desc',
        apikey: etherscanApiKey
      },
      timeout: 10000
    });
    
    console.log('\n📊 Etherscan API Response:');
    console.log('Status:', response.data.status);
    console.log('Message:', response.data.message);
    console.log('Result count:', response.data.result?.length || 0);
    
    if (response.data.result && response.data.result.length > 0) {
      console.log('\n🔍 First few transactions:');
      
      response.data.result.slice(0, 3).forEach((tx, index) => {
        console.log(`\nTransaction ${index + 1}:`);
        console.log('- Hash:', tx.hash);
        console.log('- TimeStamp (raw):', tx.timeStamp);
        console.log('- TimeStamp (parsed):', parseInt(tx.timeStamp));
        console.log('- Date:', new Date(parseInt(tx.timeStamp) * 1000).toISOString());
        console.log('- Block Number:', tx.blockNumber);
        console.log('- From:', tx.from);
        console.log('- To:', tx.to);
        console.log('- Value:', tx.value);
      });
      
      // Check if timestamps make sense
      const firstTx = response.data.result[0];
      const timestamp = parseInt(firstTx.timeStamp);
      const date = new Date(timestamp * 1000);
      const currentDate = new Date();
      
      console.log('\n⏰ Timestamp Analysis:');
      console.log('- Raw timestamp:', firstTx.timeStamp);
      console.log('- Parsed timestamp:', timestamp);
      console.log('- Converted date:', date.toISOString());
      console.log('- Current date:', currentDate.toISOString());
      console.log('- Years ago:', Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365)));
      
      if (date.getFullYear() < 2015) {
        console.log('⚠️ Date seems too old (before Ethereum mainnet)');
      } else if (date > currentDate) {
        console.log('⚠️ Date is in the future!');
      } else if (date.getFullYear() >= 2017) {
        console.log('✅ Date seems reasonable for WETH contract');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

debugEtherscan();