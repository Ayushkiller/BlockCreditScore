import { apiService } from '../services/apiService'

export interface TestResult {
  test: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  data?: any
}

export const runApiIntegrationTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = []
  
  // Test 1: Health check
  try {
    const response = await fetch('/api')
    if (response.ok) {
      const data = await response.json()
      results.push({
        test: 'API Health Check',
        status: 'pass',
        message: 'API server is responding',
        data
      })
    } else {
      results.push({
        test: 'API Health Check',
        status: 'fail',
        message: `HTTP ${response.status}: ${response.statusText}`
      })
    }
  } catch (error) {
    results.push({
      test: 'API Health Check',
      status: 'fail',
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }

  // Test 2: Get credit score with valid address
  try {
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    const score = await apiService.getCreditScore(testAddress)
    results.push({
      test: 'Get Credit Score (Valid Address)',
      status: 'pass',
      message: `Successfully retrieved score: ${score.score}`,
      data: score
    })
  } catch (error) {
    results.push({
      test: 'Get Credit Score (Valid Address)',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 3: Get credit score with invalid address
  try {
    const invalidAddress = 'invalid-address'
    await apiService.getCreditScore(invalidAddress)
    results.push({
      test: 'Get Credit Score (Invalid Address)',
      status: 'fail',
      message: 'Should have thrown an error for invalid address'
    })
  } catch (error) {
    results.push({
      test: 'Get Credit Score (Invalid Address)',
      status: 'pass',
      message: `Correctly rejected invalid address: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }

  // Test 4: Get score history
  try {
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    const history = await apiService.getScoreHistory(testAddress)
    results.push({
      test: 'Get Score History',
      status: 'pass',
      message: `Retrieved ${history.history.length} history entries`,
      data: history
    })
  } catch (error) {
    results.push({
      test: 'Get Score History',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 5: Refresh score
  try {
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    const refreshedScore = await apiService.refreshCreditScore(testAddress)
    results.push({
      test: 'Refresh Credit Score',
      status: 'pass',
      message: `Successfully refreshed score: ${refreshedScore.score}`,
      data: refreshedScore
    })
  } catch (error) {
    results.push({
      test: 'Refresh Credit Score',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return results
}

export const logTestResults = (results: TestResult[]) => {
  console.log('\n=== API Integration Test Results ===')
  
  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
    console.log(`${index + 1}. ${icon} ${result.test}`)
    console.log(`   ${result.message}`)
    if (result.data) {
      console.log(`   Data:`, result.data)
    }
    console.log('')
  })

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const skipped = results.filter(r => r.status === 'skip').length

  console.log(`Summary: ${passed} passed, ${failed} failed, ${skipped} skipped`)
  console.log('=====================================\n')
}