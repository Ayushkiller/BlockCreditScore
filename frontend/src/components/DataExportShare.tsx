import React, { useState } from 'react'
import { CreditScore } from '../services/apiService'

interface DataExportShareProps {
  score: CreditScore
  onClose: () => void
}

interface ExportOptions {
  format: 'pdf' | 'json' | 'csv'
  includeBreakdown: boolean
  includeRecommendations: boolean
  includeRiskAssessment: boolean
  includeBenchmarking: boolean
}

export default function DataExportShare({ score, onClose }: DataExportShareProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'share'>('export')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeBreakdown: true,
    includeRecommendations: true,
    includeRiskAssessment: true,
    includeBenchmarking: true
  })
  const [isExporting, setIsExporting] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [shareOptions, setShareOptions] = useState({
    publicView: false,
    expiresIn: '7d',
    passwordProtected: false,
    password: ''
  })

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (exportOptions.format === 'pdf') {
        generatePDFReport()
      } else if (exportOptions.format === 'json') {
        downloadJSONData()
      } else if (exportOptions.format === 'csv') {
        downloadCSVData()
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const generatePDFReport = () => {
    // In a real implementation, this would generate a PDF using libraries like jsPDF or Puppeteer
    const reportData = {
      score: score.score,
      address: score.address,
      timestamp: new Date(score.timestamp * 1000).toISOString(),
      breakdown: exportOptions.includeBreakdown ? score.breakdown : undefined,
      recommendations: exportOptions.includeRecommendations ? score.recommendations : undefined,
      riskAssessment: exportOptions.includeRiskAssessment ? score.riskAssessment : undefined,
      benchmarking: exportOptions.includeBenchmarking ? score.benchmarking : undefined
    }
    
    // Create a blob and download
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `credit-score-report-${score.address.slice(0, 8)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadJSONData = () => {
    const jsonData = {
      ...score,
      exportedAt: new Date().toISOString(),
      exportOptions
    }
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `credit-score-${score.address.slice(0, 8)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadCSVData = () => {
    const csvData = [
      ['Metric', 'Value', 'Weight', 'Score', 'Confidence'],
      ...Object.entries(score.breakdown || {}).map(([key, component]) => [
        key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        component.score || 0,
        Math.round((component.weight || 0) * 100),
        component.weightedScore || 0,
        component.confidence || 0
      ])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `credit-score-breakdown-${score.address.slice(0, 8)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateShareUrl = async () => {
    // In a real implementation, this would call an API to create a shareable link
    const mockShareId = Math.random().toString(36).substring(2, 15)
    const baseUrl = window.location.origin
    const url = `${baseUrl}/shared/${mockShareId}`
    setShareUrl(url)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Show success toast
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My CryptoScore Credit Report',
          text: `Check out my credit score of ${score.score}/1000!`,
          url: shareUrl || window.location.href
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Export & Share</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📥 Export Data
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'share'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🔗 Share Report
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Export Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'pdf', label: 'PDF Report', icon: '📄', desc: 'Professional report' },
                    { value: 'json', label: 'JSON Data', icon: '📊', desc: 'Raw data format' },
                    { value: 'csv', label: 'CSV File', icon: '📈', desc: 'Spreadsheet format' }
                  ].map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                      className={`p-4 border rounded-lg text-center transition-colors ${
                        exportOptions.format === format.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{format.icon}</div>
                      <div className="font-medium text-sm">{format.label}</div>
                      <div className="text-xs text-muted-foreground">{format.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Options */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Include in Export</label>
                <div className="space-y-3">
                  {[
                    { key: 'includeBreakdown', label: 'Score Breakdown', desc: 'Detailed component analysis' },
                    { key: 'includeRecommendations', label: 'Recommendations', desc: 'Improvement suggestions' },
                    { key: 'includeRiskAssessment', label: 'Risk Assessment', desc: 'Risk factors and analysis' },
                    { key: 'includeBenchmarking', label: 'Benchmarking Data', desc: 'Peer comparison data' }
                  ].map((option) => (
                    <label key={option.key} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          [option.key]: e.target.checked
                        }))}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm text-foreground">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export {exportOptions.format.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="space-y-6">
              {/* Share Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Public View</div>
                    <div className="text-sm text-muted-foreground">Allow anyone with the link to view</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareOptions.publicView}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, publicView: e.target.checked }))}
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-2">Link Expires</label>
                  <select
                    value={shareOptions.expiresIn}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, expiresIn: e.target.value }))}
                    className="w-full p-2 border border-border rounded-lg bg-background"
                  >
                    <option value="1h">1 Hour</option>
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Password Protection</div>
                    <div className="text-sm text-muted-foreground">Require password to access</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareOptions.passwordProtected}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, passwordProtected: e.target.checked }))}
                  />
                </div>

                {shareOptions.passwordProtected && (
                  <div>
                    <label className="block font-medium text-foreground mb-2">Password</label>
                    <input
                      type="password"
                      value={shareOptions.password}
                      onChange={(e) => setShareOptions(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                      className="w-full p-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                )}
              </div>

              {/* Generate Share Link */}
              <button
                onClick={generateShareUrl}
                className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Generate Share Link</span>
              </button>

              {/* Share URL */}
              {shareUrl && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg border">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-foreground break-all">{shareUrl}</code>
                      <button
                        onClick={() => copyToClipboard(shareUrl)}
                        className="ml-2 p-1 hover:bg-background rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Share Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => copyToClipboard(shareUrl)}
                      className="btn-outline py-2 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Link</span>
                    </button>

                    {navigator.share && (
                      <button
                        onClick={shareViaWebAPI}
                        className="btn-outline py-2 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <span>Share</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
