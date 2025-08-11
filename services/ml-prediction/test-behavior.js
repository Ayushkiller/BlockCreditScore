// Test behavior analysis
const http = require('http');

function testBehaviorAnalysis(testCase) {
  const data = JSON.stringify({
    address: testCase.address,
    timeframe: testCase.timeframe
  });

  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/analyze/behavior',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  console.log(`\n🧠 Analyzing behavior for: ${testCase.name}`);
  console.log(`📅 Timeframe: ${testCase.timeframe}`);

  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      const response = JSON.parse(responseData);
      const result = response.data;
      
      console.log('\n🔬 Behavior Analysis Results:');
      console.log(`👤 Address: ${result.address}`);
      console.log(`⚠️  Overall Risk Score: ${(result.overallRiskScore * 100).toFixed(1)}%`);
      console.log(`🏆 Creditworthiness: ${result.creditworthiness}/1000`);
      console.log(`📊 Data Completeness: ${(result.dataCompleteness * 100).toFixed(1)}%`);
      console.log(`🔥 Activity Level: ${result.activityLevel.toUpperCase()}`);
      console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      
      console.log('\n🏷️  Behavior Patterns:');
      result.patterns.forEach(pattern => {
        console.log(`   • ${pattern}`);
      });
      
      console.log('\n📈 Behavior Profile:');
      Object.entries(result.behaviors).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
      
      console.log('\n' + '='.repeat(60));
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error analyzing behavior:', e.message);
  });

  req.write(data);
  req.end();
}

// Test cases for behavior analysis
const behaviorTests = [
  {
    name: 'Conservative DeFi User',
    address: '0x1234567890123456789012345678901234567890',
    timeframe: '90d'
  },
  {
    name: 'Active Yield Farmer',
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    timeframe: '30d'
  },
  {
    name: 'High-Frequency Trader',
    address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    timeframe: '7d'
  }
];

console.log('🧠 Testing Behavior Analysis');
console.log('🔍 Analyzing different user behavior patterns...');

// Run behavior tests sequentially
let currentTest = 0;
function runNextBehaviorTest() {
  if (currentTest < behaviorTests.length) {
    testBehaviorAnalysis(behaviorTests[currentTest]);
    currentTest++;
    setTimeout(runNextBehaviorTest, 2000); // 2 second delay
  } else {
    console.log('\n🎉 All behavior analysis tests completed!');
    console.log('🧠 The ML service provides comprehensive user behavior insights.');
  }
}

runNextBehaviorTest();
