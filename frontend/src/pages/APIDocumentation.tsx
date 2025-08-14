import React from 'react'

export default function APIDocumentation() {

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">API Documentation</h1>
        <p className="text-lg text-gray-600 mb-4">
          Integrate CryptoScore into your DeFi application with our simple REST API.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-900">Development Environment</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            This API is currently running in development mode on localhost. No production domain is configured.
          </p>
        </div>
      </div>

      {/* Base URL */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Base URL</h2>
        <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
          http://localhost:3001
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Development server running locally. No production domain configured.
        </p>
      </div>

      {/* Authentication */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication</h2>
        <p className="text-gray-600 mb-4">
          No authentication is required for the current MVP. All credit scores are publicly accessible.
        </p>
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <p className="text-warning-800 text-sm">
            <strong>Note:</strong> Rate limiting is applied to prevent abuse. Maximum 100 requests per minute per IP.
          </p>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Endpoints</h2>

        {/* Get Score */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-success-100 text-success-800 px-2 py-1 rounded text-sm font-medium">GET</span>
            <code className="text-lg font-mono">/api/score/:address</code>
          </div>
          
          <p className="text-gray-600 mb-4">Get the credit score for a specific Ethereum address.</p>
          
          <h4 className="font-semibold text-gray-900 mb-2">Parameters</h4>
          <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
            <li><code>address</code> - Ethereum address (required)</li>
          </ul>

          <h4 className="font-semibold text-gray-900 mb-2">Example Request</h4>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <pre className="text-sm overflow-x-auto">
{`curl -X GET "http://localhost:3001/api/score/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"`}
            </pre>
          </div>

          <h4 className="font-semibold text-gray-900 mb-2">Example Response</h4>
          <div className="bg-gray-100 rounded-lg p-4">
            <pre className="text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "score": 750,
    "timestamp": 1699123456,
    "breakdown": {
      "transactionVolume": 225,
      "transactionFrequency": 188,
      "stakingActivity": 200,
      "defiInteractions": 137
    },
    "cached": false
  }
}`}
            </pre>
          </div>
        </div>

        {/* Batch Scores */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm font-medium">POST</span>
            <code className="text-lg font-mono">/api/score/batch</code>
          </div>
          
          <p className="text-gray-600 mb-4">Get credit scores for multiple Ethereum addresses.</p>
          
          <h4 className="font-semibold text-gray-900 mb-2">Example Request</h4>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <pre className="text-sm overflow-x-auto">
{`curl -X POST "http://localhost:3001/api/score/batch" \\
  -H "Content-Type: application/json" \\
  -d '{
    "addresses": [
      "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "0x8ba1f109551bD432803012645Hac136c22C57B"
    ]
  }'`}
            </pre>
          </div>

          <h4 className="font-semibold text-gray-900 mb-2">Request Body</h4>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <pre className="text-sm overflow-x-auto">
{`{
  "addresses": [
    "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "0x8ba1f109551bD432803012645Hac136c22C57B"
  ]
}`}
            </pre>
          </div>

          <h4 className="font-semibold text-gray-900 mb-2">Example Response</h4>
          <div className="bg-gray-100 rounded-lg p-4">
            <pre className="text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "total": 2,
    "successful": 1,
    "failed": 1,
    "results": [
      {
        "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        "score": 750,
        "timestamp": 1699123456,
        "breakdown": {
          "transactionVolume": 225,
          "transactionFrequency": 188,
          "stakingActivity": 200,
          "defiInteractions": 137
        },
        "cached": false,
        "success": true
      },
      {
        "address": "0x8ba1f109551bD432803012645Hac136c22C57B",
        "success": false,
        "error": "INSUFFICIENT_DATA",
        "message": "Insufficient data for credit scoring"
      }
    ]
  }
}`}
            </pre>
          </div>
        </div>

        {/* Score History */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-success-100 text-success-800 px-2 py-1 rounded text-sm font-medium">GET</span>
            <code className="text-lg font-mono">/api/score/:address/history</code>
          </div>
          
          <p className="text-gray-600 mb-4">Get historical credit scores for an address.</p>
          
          <h4 className="font-semibold text-gray-900 mb-2">Example Request</h4>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <pre className="text-sm overflow-x-auto">
{`curl -X GET "http://localhost:3001/api/score/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6/history"`}
            </pre>
          </div>

          <h4 className="font-semibold text-gray-900 mb-2">Example Response</h4>
          <div className="bg-gray-100 rounded-lg p-4">
            <pre className="text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "total": 2,
    "history": [
      {
        "score": 750,
        "timestamp": 1699123456,
        "date": "2023-11-04T20:30:56.000Z"
      },
      {
        "score": 720,
        "timestamp": 1699037056,
        "date": "2023-11-03T20:30:56.000Z"
      }
    ]
  }
}`}
            </pre>
          </div>
        </div>

        {/* Refresh Score */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm font-medium">POST</span>
            <code className="text-lg font-mono">/api/score/:address/refresh</code>
          </div>
          
          <p className="text-gray-600 mb-4">Force recalculation of credit score with latest blockchain data.</p>
          
          <h4 className="font-semibold text-gray-900 mb-2">Example Request</h4>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <pre className="text-sm overflow-x-auto">
{`curl -X POST "http://localhost:3001/api/score/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6/refresh"`}
            </pre>
          </div>

          <h4 className="font-semibold text-gray-900 mb-2">Example Response</h4>
          <div className="bg-gray-100 rounded-lg p-4">
            <pre className="text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "score": 755,
    "timestamp": 1699123456,
    "breakdown": {
      "transactionVolume": 230,
      "transactionFrequency": 190,
      "stakingActivity": 200,
      "defiInteractions": 135
    },
    "refreshed": true
  }
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Error Responses */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Responses</h2>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">400 Bad Request</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <pre className="text-sm">
{`{
  "success": false,
  "error": "INVALID_ADDRESS",
  "message": "Invalid Ethereum address format"
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">400 Bad Request (Insufficient Data)</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <pre className="text-sm">
{`{
  "success": false,
  "error": "INSUFFICIENT_DATA",
  "message": "Insufficient data for credit scoring",
  "details": ["Minimum 10 transactions required", "Account age must be at least 30 days"]
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">429 Too Many Requests</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <pre className="text-sm">
{`{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Rate limit exceeded",
  "retryAfter": 60
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Examples */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Integration Examples</h2>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">JavaScript/TypeScript</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <pre className="text-sm overflow-x-auto">
{`async function getCreditScore(address) {
  try {
    const response = await fetch(\`http://localhost:3001/api/score/\${address}\`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch credit score');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch credit score');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching credit score:', error);
    return null;
  }
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">React Hook</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <pre className="text-sm overflow-x-auto">
{`function useCreditScore(address) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    fetch(\`http://localhost:3001/api/score/\${address}\`)
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch score');
        }
        return res.json();
      })
      .then(result => {
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch score');
        }
        setScore(result.data);
      })
      .catch(err => {
        setError(err.message);
        setScore(null);
      })
      .finally(() => setLoading(false));
  }, [address]);
  
  return { score, loading, error };
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}