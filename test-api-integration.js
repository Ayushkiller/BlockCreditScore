// Simple test script to verify API integration
const testApiIntegration = async () => {
  console.log('Testing API integration...')
  
  // Test if backend is running
  try {
    const response = await fetch('http://localhost:3001/health')
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Backend health check passed:', data)
    } else {
      console.log('❌ Backend health check failed:', response.status)
    }
  } catch (error) {
    console.log('❌ Backend is not running or not accessible:', error.message)
  }
  
  // Test API endpoint
  try {
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    const response = await fetch(`http://localhost:3001/api/score/${testAddress}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API endpoint test passed:', data)
    } else {
      const errorData = await response.json()
      console.log('⚠️ API endpoint returned error:', errorData)
    }
  } catch (error) {
    console.log('❌ API endpoint test failed:', error.message)
  }
}

// Run the test
testApiIntegration()