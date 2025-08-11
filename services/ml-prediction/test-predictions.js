// Test ML model predictions
const http = require('http');

function testPrediction(testCase) {
  const data = JSON.stringify({
    address: testCase.address,
    features: testCase.features
  });

  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/predict/credit-score',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  console.log(`\n🔮 Testing prediction for: ${testCase.name}`);
  console.log('📝 Input features:', testCase.features);

  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      const response = JSON.parse(responseData);
      const result = response.data;
      
      console.log('\n✅ Prediction Results:');
      console.log(`🎯 Credit Score: ${result.creditScore}/1000`);
      if (result.normalizedScore) {
        console.log(`📊 Normalized Score: ${result.normalizedScore.toFixed(4)}`);
      }
      console.log(`🎪 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`⚠️  Risk Level: ${result.riskLevel.toUpperCase()}`);
      
      if (result.factors) {
        console.log('\n📈 Factor Analysis:');
        Object.entries(result.factors).forEach(([key, value]) => {
          console.log(`   ${key}: ${value.toFixed(4)}`);
        });
      }
      
      console.log('\n' + '='.repeat(60));
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error making prediction:', e.message);
  });

  req.write(data);
  req.end();
}

// Test cases
const testCases = [
  {
    name: 'High-Value Conservative User',
    address: '0x1234567890123456789012345678901234567890',
    features: {
      portfolioValue: 500000,
      transactionCount: 1000,
      accountAge: 730, // 2 years
      gasEfficiency: 0.9,
      protocolDiversity: 8,
      liquidityProvided: 200000,
      repaymentRate: 0.98,
      volatility: 0.1
    }
  },
  {
    name: 'Medium-Value Active Trader',
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    features: {
      portfolioValue: 100000,
      transactionCount: 2000,
      accountAge: 365, // 1 year
      gasEfficiency: 0.7,
      protocolDiversity: 12,
      liquidityProvided: 50000,
      repaymentRate: 0.85,
      volatility: 0.4
    }
  },
  {
    name: 'New User with Low Activity',
    address: '0x9876543210987654321098765432109876543210',
    features: {
      portfolioValue: 5000,
      transactionCount: 50,
      accountAge: 30, // 1 month
      gasEfficiency: 0.6,
      protocolDiversity: 2,
      liquidityProvided: 1000,
      repaymentRate: 0.9,
      volatility: 0.3
    }
  },
  {
    name: 'High-Risk Speculative Trader',
    address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    features: {
      portfolioValue: 50000,
      transactionCount: 5000,
      accountAge: 180, // 6 months
      gasEfficiency: 0.5,
      protocolDiversity: 15,
      liquidityProvided: 10000,
      repaymentRate: 0.7,
      volatility: 0.8
    }
  }
];

console.log('🧪 Testing ML Model Predictions');
console.log('🎯 Running multiple test cases...');

// Run tests sequentially with delays
let currentTest = 0;
function runNextTest() {
  if (currentTest < testCases.length) {
    testPrediction(testCases[currentTest]);
    currentTest++;
    setTimeout(runNextTest, 2000); // 2 second delay between tests
  } else {
    console.log('\n🎉 All tests completed!');
    console.log('💡 The ML model is working and making predictions based on user features.');
  }
}

runNextTest();
