import React, { useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'

export default function WalletConnector() {
  const { account, isConnecting, error, connectWallet, disconnectWallet } = useWallet()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (account) {
    return (
      <div className="flex flex-col items-end space-y-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              {formatAddress(account)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={connectWallet}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              title="Switch wallet"
            >
              Switch
            </button>
            <button
              onClick={disconnectWallet}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Wallet Status - No automatic score fetching */}
        <div className="text-right">
          <div className="text-sm text-gray-600">
            Wallet connected - Ready to analyze
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
          isConnecting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      {error && (
        <p className="text-sm text-red-600 mt-1 max-w-xs text-right">
          {error}
        </p>
      )}
    </div>
  )
}