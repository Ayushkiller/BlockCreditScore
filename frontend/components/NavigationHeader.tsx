import React from 'react';
import { useRouter } from 'next/router';
import {
  Home,
  Network,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Brain,
} from 'lucide-react';

interface NavigationHeaderProps {
  currentSection: 'dashboard' | 'contracts' | 'ml-training';
  onSectionChange: (section: 'dashboard' | 'contracts' | 'ml-training') => void;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentSection,
  onSectionChange,
}) => {
  const router = useRouter();

  const handleSectionChange = (section: 'dashboard' | 'contracts' | 'ml-training') => {
    onSectionChange(section);
    // Update URL without page reload
    let newUrl = '/';
    if (section === 'contracts') newUrl = '/?section=contracts';
    if (section === 'ml-training') newUrl = '/ml-training';
    
    router.push(newUrl, undefined, { shallow: true });
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'dashboard': return 'Credit Dashboard';
      case 'contracts': return 'Smart Contracts';
      case 'ml-training': return 'ML Training';
      default: return 'Credit Dashboard';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Home className="w-4 h-4" />
              <span>BlockCreditScore</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">
                {getSectionTitle()}
              </span>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex items-center space-x-2">
            <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleSectionChange('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentSection === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => handleSectionChange('contracts')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentSection === 'contracts'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Network className="w-4 h-4" />
                <span>Contracts</span>
              </button>
              <button
                onClick={() => handleSectionChange('ml-training')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentSection === 'ml-training'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>ML Training</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationHeader;