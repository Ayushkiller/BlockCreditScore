// Monitor training status
const http = require('http');

function checkTrainingStatus() {
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/training/status',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      const response = JSON.parse(responseData);
      const data = response.data;
      
      console.log(`\n📊 Training Status: ${new Date().toLocaleTimeString()}`);
      console.log(`🎯 Is Training: ${data.isTraining}`);
      console.log(`🧮 Algorithm: ${data.algorithm}`);
      console.log(`🔧 Model Loaded: ${data.modelLoaded}`);
      
      if (data.history && data.history.length > 0) {
        const latest = data.history[data.history.length - 1];
        console.log(`📈 Latest Epoch: ${latest.epoch}/100`);
        console.log(`📉 Loss: ${latest.loss.toFixed(4)}`);
        console.log(`📊 Accuracy: ${latest.accuracy.toFixed(4)}`);
        console.log(`📏 Validation Loss: ${latest.val_loss.toFixed(4)}`);
      }
      
      if (data.weights) {
        console.log('\n🎚️  Current Model Weights:');
        Object.entries(data.weights).forEach(([key, value]) => {
          console.log(`   ${key}: ${value.toFixed(4)}`);
        });
      }
      
      // Continue monitoring if still training
      if (data.isTraining) {
        setTimeout(checkTrainingStatus, 5000); // Check every 5 seconds
      } else {
        console.log('\n🎉 Training completed!');
        console.log('🔄 You can now test predictions...');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error checking status:', e.message);
  });

  req.end();
}

console.log('🔍 Starting training monitor...');
checkTrainingStatus();
