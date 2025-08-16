import { useState } from 'react'

interface FloatingActionMenuProps {
  onRefresh?: () => void
  onExport?: () => void
  onShare?: () => void
  onHelp?: () => void
  isVisible?: boolean
}

export default function FloatingActionMenu({ 
  onRefresh, 
  onExport, 
  onShare, 
  onHelp,
  isVisible = true 
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isVisible) return null

  const actions = [
    {
      label: 'Refresh Score',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      onClick: onRefresh,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      label: 'Export Report',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: onExport,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      label: 'Share Results',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      ),
      onClick: onShare,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      label: 'Get Help',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: onHelp,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action Buttons */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-fade-in">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-white px-3 py-2 rounded-lg shadow-lg border text-sm font-medium text-gray-700 whitespace-nowrap">
                {action.label}
              </div>
              <button
                onClick={() => {
                  action.onClick?.()
                  setIsOpen(false)
                }}
                className={`
                  w-12 h-12 rounded-full text-white shadow-lg transition-all duration-200 hover:scale-110
                  ${action.color}
                `}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg 
          transition-all duration-300 hover:scale-110 hover:shadow-xl
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
      >
        <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}