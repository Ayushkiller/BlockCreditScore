import React, { useState } from 'react'
import { runApiIntegrationTests, logTestResults, type TestResult } from '../utils/testApiIntegration'

export default function ApiTestPanel() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    try {
      const results = await runApiIntegrationTests()
      setTestResults(results)
      logTestResults(results)
    } catch (error) {
      console.error('Failed to run tests:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return '✅'
      case 'fail': return '❌'
      case 'skip': return '⏭️'
      default: return '❓'
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return 'text-success-600'
      case 'fail': return 'text-danger-600'
      case 'skip': return 'text-warning-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">API Integration Tests</h3>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="btn-primary"
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      {isRunning && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Running API integration tests...</p>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                {testResults.filter(r => r.status === 'pass').length}
              </div>
              <div className="text-sm text-gray-500">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger-600">
                {testResults.filter(r => r.status === 'fail').length}
              </div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">
                {testResults.filter(r => r.status === 'skip').length}
              </div>
              <div className="text-sm text-gray-500">Skipped</div>
            </div>
          </div>

          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getStatusIcon(result.status)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{result.test}</h4>
                      <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          View Response Data
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isRunning && testResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Click "Run Tests" to verify API integration</p>
        </div>
      )}
    </div>
  )
}