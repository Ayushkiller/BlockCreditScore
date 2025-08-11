// Simple test script to start ML training
const http = require('http');

const data = JSON.stringify({
  samples: 2000,
  epochs: 100
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/train',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('🚀 Starting ML model training...');
console.log('Configuration:', JSON.parse(data));

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Training request sent successfully!');
    console.log('Response:', JSON.parse(responseData));
  });
});

req.on('error', (e) => {
  console.error('❌ Error starting training:', e.message);
});

req.write(data);
req.end();
