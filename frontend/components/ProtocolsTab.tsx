import React from 'react';
import {
  Network,
  Activity,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import {
  RefreshCw
} from 'lucide-react';
import ProtocolTVLDisplay from './ProtocolTVLDisplay';
import EventMonitoringAnalytics from './EventMonitoringAnalytics';
import RealTimePriceDisplay from './RealTimePriceDisplay';
import USDValueDisplay from './USDValueDisplay';

interface ProtocolsTabProps {
  dashboardData: any;
  connectedAddress: string | null;
  timeframe: string;
  loading: boolean;
}

const ProtocolsTab: React.FC<ProtocolsTabProps> = ({
  dashboardData,
  connectedAddress,
  timeframe,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg text-gray-600">
          Loading protocol data...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Protocol TVL Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Protocol TVL Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Aave</span>
              <Network className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">$12.4B</div>
            <div className="text-xs text-gray-500">Total Value Locked</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Compound</span>
              <Network className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">$3.2B</div>
            <div className="text-xs text-gray-500">Total Value Locked</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Uniswap</span>
              <Network className="w-4 h-4 text-pink-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">$5.8B</div>
            <div className="text-xs text-gray-500">Total Value Locked</div>
          </div>
        </div>
      </div>

      {/* Event Monitoring */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Protocol Event Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Recent Events</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Deposit:</span> 1.5 ETH to Aave
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Swap:</span> 500 USDC → ETH
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Stake:</span> 2.0 ETH to Lido
              </div>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="font-medium">Activity Trends</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                DeFi Activity: <span className="text-green-600">+15%</span>
              </div>
              <div className="text-sm text-gray-600">
                Trading Volume: <span className="text-blue-600">+8%</span>
              </div>
              <div className="text-sm text-gray-600">
                Staking Rewards: <span className="text-purple-600">+12%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Price Displays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Real-time Prices
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">ETH</span>
                </div>
                <div>
                  <div className="font-medium">Ethereum</div>
                  <div className="text-sm text-gray-500">ETH</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">$2,450.50</div>
                <div className="text-sm text-green-600">+2.5%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">BTC</span>
                </div>
                <div>
                  <div className="font-medium">Bitcoin</div>
                  <div className="text-sm text-gray-500">BTC</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">$43,250.00</div>
                <div className="text-sm text-green-600">+1.8%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">USDC</span>
                </div>
                <div>
                  <div className="font-medium">USD Coin</div>
                  <div className="text-sm text-gray-500">USDC</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">$1.00</div>
                <div className="text-sm text-gray-600">0.0%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            USD Values
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">1 ETH</div>
                <div className="text-sm text-gray-500">Ethereum</div>
              </div>
              <div className="text-right">
                <div className="font-bold">$2,450.50</div>
                <div className="text-sm text-gray-500">USD</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">1 BTC</div>
                <div className="text-sm text-gray-500">Bitcoin</div>
              </div>
              <div className="text-right">
                <div className="font-bold">$43,250.00</div>
                <div className="text-sm text-gray-500">USD</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">1000 USDC</div>
                <div className="text-sm text-gray-500">USD Coin</div>
              </div>
              <div className="text-right">
                <div className="font-bold">$1,000.00</div>
                <div className="text-sm text-gray-500">USD</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolsTab;
