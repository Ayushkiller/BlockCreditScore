import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'

interface WalletContextType {
  account: string | null
  provider: ethers.BrowserProvider | null
  isConnecting: boolean
  error: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if wallet is already connected on page load
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        
        if (accounts.length > 0) {
          setAccount(accounts[0].address)
          setProvider(provider)
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Request account access (this will show MetaMask popup to switch accounts)
      await provider.send('eth_requestAccounts', [])
      
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      
      setAccount(address)
      setProvider(provider)
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Please connect to MetaMask.')
      } else if (err.code === -32002) {
        setError('MetaMask is already processing a request. Please check MetaMask.')
      } else {
        setError('An error occurred while connecting to your wallet.')
      }
      console.error('Error connecting wallet:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setError(null)
  }

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setAccount(accounts[0])
        }
      }

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum?.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const value: WalletContextType = {
    account,
    provider,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}