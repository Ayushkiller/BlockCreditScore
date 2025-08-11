import React, { useState } from 'react';
import {
  Settings,
  Rocket,
  TestTube,
  FileText,
  Activity,
  Network,
  Shield,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import ContractTestPanel from './ContractTestPanel';
import DeploymentPanel from './DeploymentPanel';
import EnvConfigPanel from './EnvConfigPanel';
import LogsPanel from './LogsPanel';
import MonitoringPanel from './MonitoringPanel';

const ContractsLayout: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'deployment' | 'testing' | 'config' | 'logs' | 'monitoring'
  >('overview');

  const sections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: FileText,
      description: 'Contract information and status',
    },
    {
      id: 'deployment',
      label: 'Deployment',
      icon: Rocket,
      description: 'Deploy contracts to testnets',
    },
    {
      id: 'testing',
      label: 'Testing',
      icon: TestTube,
      description: 'Test contract functionality',
    },
    {
      id: 'config',
      label: 'Configuration',
      icon: Settings,
      description: 'Environment and network settings',
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: Activity,
      description: 'Deployment and transaction logs',
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: Shield,
      description: 'Contract health and performance',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Network className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Smart Contracts
                </h1>
                <p className="text-sm text-gray-500">
                  Deploy, test, and monitor credit scoring contracts
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Contracts System</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <section.icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'overview' && <OverviewSection />}
        {activeSection === 'deployment' && <DeploymentPanel />}
        {activeSection === 'testing' && <ContractTestPanel />}
        {activeSection === 'config' && <EnvConfigPanel />}
        {activeSection === 'logs' && <LogsPanel />}
        {activeSection === 'monitoring' && <MonitoringPanel />}
      </div>
    </div>
  );
};

// Overview Section Component
const OverviewSection: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Contract Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            SimpleCreditScore Contract
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Contract Purpose
            </h3>
            <p className="text-sm text-gray-600">
              On-chain credit scoring system that aggregates DeFi behavior,
              transaction patterns, and protocol interactions to generate
              comprehensive creditworthiness assessments.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Key Features
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Multi-dimensional scoring</li>
              <li>• Real-time score updates</li>
              <li>• Transparent algorithms</li>
              <li>• Gas-optimized operations</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Supported Networks
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Ethereum Mainnet</li>
              <li>• Goerli Testnet</li>
              <li>• Sepolia Testnet</li>
              <li>• Local Hardhat</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            icon={Rocket}
            title="Deploy Contract"
            description="Deploy to Goerli or Sepolia testnet"
            action="deployment"
            color="blue"
          />
          <ActionCard
            icon={TestTube}
            title="Test Functions"
            description="Test contract integration and functionality"
            action="testing"
            color="green"
          />
          <ActionCard
            icon={Settings}
            title="Configure Environment"
            description="Set up RPC URLs and API keys"
            action="config"
            color="purple"
          />
          <ActionCard
            icon={Activity}
            title="View Logs"
            description="Monitor deployment and transaction logs"
            action="logs"
            color="orange"
          />
          <ActionCard
            icon={Shield}
            title="Monitor Health"
            description="Check contract status and performance"
            action="monitoring"
            color="red"
          />
          <ActionCard
            icon={ExternalLink}
            title="View on Explorer"
            description="Open deployed contracts on Etherscan"
            action="external"
            color="gray"
          />
        </div>
      </div>

      {/* Contract Architecture */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Contract Architecture
        </h2>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Core Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700">Score Dimensions</h4>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• DeFi Reliability</li>
                  <li>• Trading Consistency</li>
                  <li>• Staking Commitment</li>
                  <li>• Liquidation History</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Data Sources</h4>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• Transaction history</li>
                  <li>• Protocol interactions</li>
                  <li>• Token holdings</li>
                  <li>• Staking behavior</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Security Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700">Access Control</h4>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• Owner-only functions</li>
                  <li>• Role-based permissions</li>
                  <li>• Pausable operations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Data Integrity</h4>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>• Input validation</li>
                  <li>• Overflow protection</li>
                  <li>• Reentrancy guards</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Action Card Component
interface ActionCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  action: string;
  color: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon: Icon,
  title,
  description,
  action,
  color,
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
    green: 'text-green-600 bg-green-50 hover:bg-green-100',
    purple: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
    orange: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
    red: 'text-red-600 bg-red-50 hover:bg-red-100',
    gray: 'text-gray-600 bg-gray-50 hover:bg-gray-100',
  };

  return (
    <div
      className={`p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer ${
        colorClasses[color] || colorClasses.gray
      }`}
    >
      <div className="flex items-center space-x-3 mb-2">
        <Icon className="w-5 h-5" />
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <div className="flex items-center text-sm font-medium">
        <span>Get Started</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );
};

export default ContractsLayout;