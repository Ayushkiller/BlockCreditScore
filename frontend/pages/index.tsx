import { useState } from 'react';
import Head from 'next/head';
import { 
  Settings, 
  Rocket, 
  Monitor, 
  FileText, 
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Shield,
  BarChart3,
  Users,
  Lock,
  Award
} from 'lucide-react';
import Layout from '../components/Layout';
import EnvConfigPanel from '../components/EnvConfigPanel';
import DeploymentPanel from '../components/DeploymentPanel';
import MonitoringPanel from '../components/MonitoringPanel';
import LogsPanel from '../components/LogsPanel';
import StatusOverview from '../components/StatusOverview';
import CreditDashboard from '../components/CreditDashboard';
import AnalyticsPanel from '../components/AnalyticsPanel';
import SocialCreditPanel from '../components/SocialCreditPanel';
import PrivacyPanel from '../components/PrivacyPanel';
import WalletConnection from '../components/WalletConnection';
import SimpleCreditDemo from '../components/SimpleCreditDemo';
import ContractTestPanel from '../components/ContractTestPanel';
import { useDeployment } from '../contexts/DeploymentContext';
import { useCreditIntelligence } from '../contexts/CreditIntelligenceContext';

export default function Home() {
  const [activeTab, setActiveTab] = useState('demo');
  const { deployments, monitoringData, envConfig } = useDeployment();
  const { connectedAddress } = useCreditIntelligence();

  const tabs = [
    { id: 'demo', label: 'Credit Analysis Demo', icon: Award },
    { id: 'contract-test', label: 'Contract Test', icon: CheckCircle },
    { id: 'deploy', label: 'Deploy Contracts', icon: Rocket },
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'dashboard', label: 'Credit Dashboard', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'social', label: 'Social & Gamification', icon: Users },
    { id: 'privacy', label: 'Privacy & ZK Proofs', icon: Lock },
    { id: 'config', label: 'Environment Config', icon: Settings },
    { id: 'monitor', label: 'Monitoring', icon: Monitor },
    { id: 'logs', label: 'Logs', icon: FileText },
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'demo':
        return <SimpleCreditDemo />;
      case 'contract-test':
        return <ContractTestPanel />;
      case 'overview':
        return <StatusOverview />;
      case 'dashboard':
        return <CreditDashboard />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'social':
        return <SocialCreditPanel />;
      case 'privacy':
        return <PrivacyPanel />;
      case 'config':
        return <EnvConfigPanel />;
      case 'deploy':
        return <DeploymentPanel />;
      case 'monitor':
        return <MonitoringPanel />;
      case 'logs':
        return <LogsPanel />;
      default:
        return <SimpleCreditDemo />;
    }
  };

  const isConfigured = envConfig.GOERLI_RPC_URL && envConfig.PRIVATE_KEY && envConfig.ETHERSCAN_API_KEY;
  const hasDeployments = deployments.length > 0;
  const isMonitoring = monitoringData.isConnected;

  return (
    <>
      <Head>
        <title>CryptoVault Credit Intelligence - Deployment Dashboard</title>
        <meta name="description" content="Manage your CryptoVault Credit Intelligence smart contract deployments" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    CryptoVault Credit Intelligence
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Autonomous Credit Intelligence Ecosystem
                  </p>
                </div>
                
                {/* Wallet Connection and Status */}
                <div className="flex items-center space-x-6">
                  <WalletConnection />
                  
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      {isConfigured ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium">
                        {isConfigured ? 'Configured' : 'Setup Required'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {hasDeployments ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm font-medium">
                        {hasDeployments ? `${deployments.length} Deployed` : 'Not Deployed'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isMonitoring ? (
                        <Zap className="w-5 h-5 text-green-500" />
                      ) : (
                        <Monitor className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm font-medium">
                        {isMonitoring ? 'Monitoring' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {getTabContent()}
          </div>
        </div>
      </Layout>
    </>
  );
}