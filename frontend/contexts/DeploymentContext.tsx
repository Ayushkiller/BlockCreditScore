import React, { createContext, useContext, useState, useEffect } from 'react';

export interface EnvConfig {
  GOERLI_RPC_URL: string;
  SEPOLIA_RPC_URL: string;
  PRIVATE_KEY: string;
  ETHERSCAN_API_KEY: string;
  GAS_PRICE_GWEI: string;
  GAS_LIMIT: string;
}

export interface DeploymentInfo {
  network: string;
  contractAddress: string;
  blockNumber: number;
  gasUsed: number;
  timestamp: number;
  status: 'pending' | 'deployed' | 'verified' | 'failed';
}

export interface MonitoringData {
  isConnected: boolean;
  latestBlock: number;
  gasPrice: string;
  balance: string;
  lastUpdate: number;
}

interface DeploymentContextType {
  envConfig: EnvConfig;
  setEnvConfig: (config: EnvConfig) => void;
  deployments: DeploymentInfo[];
  setDeployments: (deployments: DeploymentInfo[]) => void;
  monitoringData: MonitoringData;
  setMonitoringData: (data: MonitoringData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(undefined);

export const useDeployment = () => {
  const context = useContext(DeploymentContext);
  if (!context) {
    throw new Error('useDeployment must be used within a DeploymentProvider');
  }
  return context;
};

export const DeploymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [envConfig, setEnvConfig] = useState<EnvConfig>({
    GOERLI_RPC_URL: '',
    SEPOLIA_RPC_URL: '',
    PRIVATE_KEY: '',
    ETHERSCAN_API_KEY: '',
    GAS_PRICE_GWEI: '20',
    GAS_LIMIT: '8000000',
  });

  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [monitoringData, setMonitoringData] = useState<MonitoringData>({
    isConnected: false,
    latestBlock: 0,
    gasPrice: '0',
    balance: '0',
    lastUpdate: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Load saved config from localStorage and .env file
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // First try to load from .env file via API
        const response = await fetch('/api/load-env');
        if (response.ok) {
          const envConfig = await response.json();
          setEnvConfig(envConfig);
          console.log('✅ Configuration loaded from .env file');
        } else {
          // Fallback to localStorage
          const savedConfig = localStorage.getItem('cryptovault-env-config');
          if (savedConfig) {
            setEnvConfig(JSON.parse(savedConfig));
            console.log('✅ Configuration loaded from localStorage');
          }
        }
      } catch (error) {
        console.error('Failed to load env config from API, trying localStorage:', error);
        // Fallback to localStorage
        const savedConfig = localStorage.getItem('cryptovault-env-config');
        if (savedConfig) {
          try {
            setEnvConfig(JSON.parse(savedConfig));
            console.log('✅ Configuration loaded from localStorage (fallback)');
          } catch (parseError) {
            console.error('Failed to parse localStorage config:', parseError);
          }
        }
      }
    };

    const loadDeployments = () => {
      const savedDeployments = localStorage.getItem('cryptovault-deployments');
      if (savedDeployments) {
        try {
          setDeployments(JSON.parse(savedDeployments));
        } catch (error) {
          console.error('Failed to load saved deployments:', error);
        }
      }
    };

    loadConfiguration();
    loadDeployments();
  }, []);

  // Save config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cryptovault-env-config', JSON.stringify(envConfig));
  }, [envConfig]);

  // Save deployments to localStorage when they change
  useEffect(() => {
    localStorage.setItem('cryptovault-deployments', JSON.stringify(deployments));
  }, [deployments]);

  const value = {
    envConfig,
    setEnvConfig,
    deployments,
    setDeployments,
    monitoringData,
    setMonitoringData,
    isLoading,
    setIsLoading,
    logs,
    addLog,
    clearLogs,
  };

  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  );
};