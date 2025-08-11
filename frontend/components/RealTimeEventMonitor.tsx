import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Filter,
  Zap,
  Shield,
  TrendingUp,
  Database,
  Network,
  Hash,
  ExternalLink
} from 'lucide-react';

interface BlockchainEvent {
  eventId: string;
  contractAddress: string;
  eventName: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  timestamp: number;
  confirmations: number;
  isConfirmed: boolean;
  protocolName?: string;
  decodedData?: any;
  userAddress?: string;
  actionType?: string;
}

interface EventMonitoringStatus {
  isMonitoring: boolean;
  activeFilters: number;
  eventsDetected: number;
  eventsConfirmed: number;
  chainReorganizations: number;
  userActionsDetected: number;
  currentBlock: number;
  lastEventTimestamp: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  providerName: string;
  eventsPerSecond: number;
  averageConfirmationTime: number;
}

interface ChainReorganization {
  oldBlockHash: string;
  newBlockHash: string;
  blockNumber: number;
  affectedEvents: BlockchainEvent[];
  timestamp: number;
}

interface RealTimeEventMonitorProps {
  userAddress?: string | null;
  showNotifications?: boolean;
  maxEvents?: number;
}

const RealTimeEventMonitor: React.FC<RealTimeEventMonitorProps> = ({
  userAddress,
  showNotifications = true,
  maxEvents = 50
}) => {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState<EventMonitoringStatus | null>(null);
  const [chainReorgs, setChainReorgs] = useState<ChainReorganization[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(showNotifications);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time event subscription
  useEffect(() => {
    let unsubscribeEvents: (() => void) | null = null;
    let unsubscribeStatus: (() => void) | null = null;
    let unsubscribeReorgs: (() => void) | null = null;

    const setupEventMonitoring = async () => {
      try {
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

        // Subscribe to real-time blockchain events
        unsubscribeEvents = await creditIntelligenceService.subscribeToBlockchainEvents((event: BlockchainEvent) => {
          setEvents(prevEvents => {
            const newEvents = [event, ...prevEvents].slice(0, maxEvents);
            return newEvents;
          });

          // Show notification for new events
          if (notificationsEnabled && (!userAddress || event.userAddress === userAddress)) {
            showEventNotification(event);
          }
        });

        // Subscribe to monitoring status updates
        unsubscribeStatus = creditIntelligenceService.subscribe('statusUpdate', (status: EventMonitoringStatus) => {
          setMonitoringStatus(status);
        });

        // Subscribe to chain reorganization alerts
        unsubscribeReorgs = creditIntelligenceService.subscribe('chainReorganization', (reorg: ChainReorganization) => {
          setChainReorgs(prevReorgs => [reorg, ...prevReorgs].slice(0, 10));
          
          if (notificationsEnabled) {
            showReorganizationAlert(reorg);
          }
        });

        // Get initial data
        const [initialEvents, initialStatus, recentReorgs] = await Promise.all([
          creditIntelligenceService.getRecentEvents?.(maxEvents) || [],
          creditIntelligenceService.getBlockchainStatus?.() || null,
          creditIntelligenceService.getChainReorganizations?.() || []
        ]);

        setEvents(initialEvents);
        setMonitoringStatus(initialStatus);
        setChainReorgs(recentReorgs.slice(0, 10));
        setLoading(false);

      } catch (err) {
        console.error('Failed to setup event monitoring:', err);
        setError('Failed to connect to blockchain event monitoring');
        setLoading(false);
      }
    };

    setupEventMonitoring();

    return () => {
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeStatus) unsubscribeStatus();
      if (unsubscribeReorgs) unsubscribeReorgs();
    };
  }, [userAddress, maxEvents, notificationsEnabled]);

  const showEventNotification = useCallback((event: BlockchainEvent) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New ${event.protocolName || 'DeFi'} Event`, {
        body: `${event.eventName} detected in block ${event.blockNumber}`,
        icon: '/favicon.ico',
        tag: event.eventId
      });
    }
  }, []);

  const showReorganizationAlert = useCallback((reorg: ChainReorganization) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Chain Reorganization Alert', {
        body: `Block ${reorg.blockNumber} reorganized, ${reorg.affectedEvents.length} events affected`,
        icon: '/favicon.ico',
        tag: `reorg-${reorg.blockNumber}`
      });
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const getEventIcon = (eventName: string, protocolName?: string) => {
    const name = eventName.toLowerCase();
    
    if (name.includes('deposit') || name.includes('supply')) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (name.includes('withdraw') || name.includes('redeem')) {
      return <TrendingUp className="w-4 h-4 text-blue-500 transform rotate-180" />;
    } else if (name.includes('swap') || name.includes('trade')) {
      return <RefreshCw className="w-4 h-4 text-purple-500" />;
    } else if (name.includes('liquidation')) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    } else if (name.includes('stake')) {
      return <Shield className="w-4 h-4 text-yellow-500" />;
    }
    
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getProtocolColor = (protocolName?: string) => {
    switch (protocolName?.toLowerCase()) {
      case 'aave v3':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'uniswap v3':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'compound':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredEvents = selectedProtocol === 'all' 
    ? events 
    : events.filter(event => event.protocolName?.toLowerCase() === selectedProtocol.toLowerCase());

  const uniqueProtocols = Array.from(new Set(events.map(e => e.protocolName).filter(Boolean)));

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Connecting to blockchain event monitor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8 text-red-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monitoring Status Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {monitoringStatus?.connectionStatus === 'connected' ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                Real-Time Blockchain Events
              </h3>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              monitoringStatus?.connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {monitoringStatus?.connectionStatus || 'disconnected'}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="p-2 rounded-lg hover:bg-gray-100"
              title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4 text-blue-500" />
              ) : (
                <BellOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="p-2 rounded-lg hover:bg-gray-100"
              title={isVisible ? 'Hide events' : 'Show events'}
            >
              {isVisible ? (
                <Eye className="w-4 h-4 text-gray-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Status Metrics */}
        {monitoringStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-600">Current Block</div>
              <div className="text-lg font-bold text-blue-900">
                {monitoringStatus.currentBlock.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-600">Events/sec</div>
              <div className="text-lg font-bold text-green-900">
                {monitoringStatus.eventsPerSecond.toFixed(1)}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-600">Confirmed</div>
              <div className="text-lg font-bold text-purple-900">
                {monitoringStatus.eventsConfirmed.toLocaleString()}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-600">Provider</div>
              <div className="text-lg font-bold text-yellow-900">
                {monitoringStatus.providerName}
              </div>
            </div>
          </div>
        )}

        {/* Chain Reorganization Alerts */}
        {chainReorgs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">
                Recent Chain Reorganizations
              </span>
            </div>
            <div className="space-y-2">
              {chainReorgs.slice(0, 3).map((reorg, index) => (
                <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-orange-900">
                        Block {reorg.blockNumber} reorganized
                      </div>
                      <div className="text-xs text-orange-700">
                        {reorg.affectedEvents.length} events affected
                      </div>
                    </div>
                    <div className="text-xs text-orange-600">
                      {new Date(reorg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Event List */}
      {isVisible && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Live Event Stream</h4>
            
            {/* Protocol Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedProtocol}
                onChange={(e) => setSelectedProtocol(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Protocols</option>
                {uniqueProtocols.map(protocol => (
                  <option key={protocol} value={protocol?.toLowerCase()}>
                    {protocol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events detected yet</p>
                <p className="text-sm">Events will appear here as they occur on-chain</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.eventId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    event.isConfirmed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getEventIcon(event.eventName, event.protocolName)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {event.eventName}
                        </span>
                        {event.protocolName && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getProtocolColor(event.protocolName)}`}>
                            {event.protocolName}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Block {event.blockNumber} • 
                        {event.isConfirmed ? (
                          <span className="text-green-600 ml-1">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            Confirmed ({event.confirmations})
                          </span>
                        ) : (
                          <span className="text-yellow-600 ml-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Pending ({event.confirmations})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {new Date(event.timestamp * 1000).toLocaleTimeString()}
                      </div>
                      <a
                        href={`https://etherscan.io/tx/${event.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Hash className="w-3 h-3 mr-1" />
                        View Tx
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredEvents.length >= maxEvents && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing latest {maxEvents} events • Older events are automatically archived
              </p>
            </div>
          )}
        </div>
      )}

      {/* Block Confirmation Status */}
      {monitoringStatus && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">Block Confirmation Status</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Current Block</div>
              <div className="text-2xl font-bold text-blue-900">
                {monitoringStatus.currentBlock.toLocaleString()}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Latest confirmed block
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Pending Events</div>
              <div className="text-2xl font-bold text-yellow-900">
                {(monitoringStatus.eventsDetected - monitoringStatus.eventsConfirmed)}
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                Awaiting confirmation
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Avg Confirmation</div>
              <div className="text-2xl font-bold text-green-900">
                {`${monitoringStatus.averageConfirmationTime.toFixed(1)}s`}
              </div>
              <div className="text-xs text-green-700 mt-1">
                Average time to confirm
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeEventMonitor;