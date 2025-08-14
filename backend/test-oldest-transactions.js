// Test script to get the oldest transactions for WETH contract
const axios = require('axios');
require('dotenv').config();

async function testOldestTransactions() {
  console.log('Testing oldest transactions for WETH contract...\n');
  
  const testAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
  
  if (!etherscanApiKey) {
    console.log('❌ No Etherscan API key found');
    return;
  }
  
  try {
    console.log(`Testing address: ${testAddress}`);
    console.log('Fetching OLDEST transactions (asc order)...\n');
    
    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'txlist',
        address: testAddress,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: 5, // Just get 5 oldest transactions
        sort: 'asc', // OLDEST FIRST
        apikey: etherscanApiKey
      },
      timeout: 10000
    });
    
    console.log('📊 Etherscan API Response:');
    console.log('Status:', response.data.status);
    console.log('Message:', response.data.message);
    console.log('Result count:', response.data.result?.length || 0);
    
    if (response.data.result && response.data.result.length > 0) {
      console.log('\n🔍 OLDEST transactions:');
      
      response.data.result.slice(0, 5).forEach((tx, index) => {
        console.log(`\nTransaction ${index + 1} (oldest):`);
        console.log('- Hash:', tx.hash);
        console.log('- TimeStamp (raw):', tx.timeStamp);
        console.log('- Date:', new Date(parseInt(tx.timeStamp) * 1000).toISOString());
        console.log('- Block Number:', tx.blockNumber);
        console.log('- From:', tx.from);
        console.log('- To:', tx.to);
      });
      
      // Calculate account age from oldest transaction
      const oldestTx = response.data.result[0];
      const oldestTimestamp = parseInt(oldestTx.timeStamp);
      const oldestDate = new Date(oldestTimestamp * 1000);
      const currentDate = new Date();
      const accountAgeDays = Math.floor((currentDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log('\n⏰ Account Age Analysis:');
      console.log('- Oldest transaction date:', oldestDate.toISOString());
      console.log('- Current date:', currentDate.toISOString());
      console.log('- Account age:', accountAgeDays, 'days');
      console.log('- Account age:', Math.floor(accountAgeDays / 365), 'years');
      
      if (accountAgeDays > 365) {
        console.log('✅ This is an old account (over 1 year)');
      } else if (accountAgeDays > 30) {
        console.log('✅ This is a mature account (over 1 month)');
      } else {
        console.log('⚠️ This appears to be a new account');
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

testOldestTransactions();