import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import NavigationHeader from '../components/NavigationHeader';
import UnifiedCreditDashboard from '../components/UnifiedCreditDashboard';
import ContractsLayout from '../components/ContractsLayout';

export default function Home() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'dashboard' | 'contracts'>('dashboard');

  // Handle URL-based routing
  useEffect(() => {
    const section = router.query.section as string;
    if (section === 'contracts') {
      setCurrentView('contracts');
    } else {
      setCurrentView('dashboard');
    }
  }, [router.query.section]);

  const handleSectionChange = (section: 'dashboard' | 'contracts') => {
    setCurrentView(section);
  };

  return (
    <>
      <Head>
        <title>CryptoVault Credit Intelligence - Deployment Dashboard</title>
        <meta name="description" content="Manage your CryptoVault Credit Intelligence smart contract deployments" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <NavigationHeader 
          currentSection={currentView}
          onSectionChange={handleSectionChange}
        />
        
        {currentView === 'dashboard' ? (
          <div className="min-h-screen bg-gray-50">
            {/* Main Header */}
            <div className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Credit Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Real-time blockchain credit analytics and scoring
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <UnifiedCreditDashboard 
                connectedAddress={null}
                privacyMode={false}
                timeframe="7d"
              />
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-gray-50">
            <ContractsLayout />
          </div>
        )}
      </Layout>
    </>
  );
}