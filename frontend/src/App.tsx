import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { WalletProvider } from './contexts/WalletContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ScoreHistory from './pages/ScoreHistory'
import APIDocumentation from './pages/APIDocumentation'

function App() {
  return (
    <WalletProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<ScoreHistory />} />
          <Route path="/docs" element={<APIDocumentation />} />
        </Routes>
      </Layout>
    </WalletProvider>
  )
}

export default App