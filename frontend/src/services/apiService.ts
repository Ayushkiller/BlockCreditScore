interface CreditScore {
  address: string
  score: number
  timestamp: number
  breakdown: {
    transactionVolume: number
    transactionFrequency: number
    stakingActivity: number
    defiInteractions: number
  }
  cached?: boolean
}

interface ScoreHistoryEntry {
  score: number
  timestamp: number
  date: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface ScoreHistoryResponse {
  address: string
  total: number
  history: ScoreHistoryEntry[]
}

class ApiService {
  private baseUrl = '/api'

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Handle specific error codes
      if (errorData.error === 'INSUFFICIENT_DATA') {
        throw new Error('Insufficient transaction history for credit scoring')
      } else if (errorData.error === 'INVALID_ADDRESS') {
        throw new Error('Invalid Ethereum address format')
      } else if (errorData.error === 'RATE_LIMITED') {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result: ApiResponse<T> = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'API request failed')
    }

    if (!result.data) {
      throw new Error('No data received from API')
    }

    return result.data
  }

  async getCreditScore(address: string): Promise<CreditScore> {
    const response = await fetch(`${this.baseUrl}/score/${address}`)
    return this.handleResponse<CreditScore>(response)
  }

  async refreshCreditScore(address: string): Promise<CreditScore> {
    const response = await fetch(`${this.baseUrl}/score/${address}/refresh`, {
      method: 'POST'
    })
    return this.handleResponse<CreditScore>(response)
  }

  async getScoreHistory(address: string, limit?: number): Promise<ScoreHistoryResponse> {
    const url = limit 
      ? `${this.baseUrl}/score/${address}/history?limit=${limit}`
      : `${this.baseUrl}/score/${address}/history`
    
    const response = await fetch(url)
    return this.handleResponse<ScoreHistoryResponse>(response)
  }

  async getBatchScores(addresses: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/score/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ addresses })
    })
    return this.handleResponse<any>(response)
  }
}

export const apiService = new ApiService()
export type { CreditScore, ScoreHistoryEntry, ScoreHistoryResponse }