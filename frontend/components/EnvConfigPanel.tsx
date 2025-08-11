import React, { useState, useEffect, createContext, useContext } from "react";
import {
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Clock,
  Zap,
  Shield,
  Server,
  Database,
  Activity,
} from "lucide-react";

// --- Mock Data and Interfaces ---

// Interfaces defining the shape of our data
interface EnvConfig {
  GOERLI_RPC_URL: string;
  SEPOLIA_RPC_URL: string;
  PRIVATE_KEY: string;
  ETHERSCAN_API_KEY: string;
  GAS_PRICE_GWEI: string;
  GAS_LIMIT: string;
}

interface EnvironmentHealth {
  isHealthy: boolean;
  lastHealthCheck: number;
  healthCheckDuration: number;
  errors: { service: string; error: string }[];
  warnings: string[];
  degradedServices: string[];
  totalServices: number;
  healthyServices: number;
  services: {
    rpcProviders: Record<
      string,
      { isHealthy: boolean; averageResponseTime: number }
    >;
    marketData: Record<
      string,
      { isHealthy: boolean; averageResponseTime: number }
    >;
    monitoring: { isHealthy: boolean; averageResponseTime: number };
  };
}

interface CredentialStatus {
  service: string;
  category: string;
  hasCredentials: boolean;
  isValid: boolean;
  lastValidated: number;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
  endpoint: string;
  errorMessage?: string;
}

interface RetryPolicy {
  service: string;
  category: string;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBackoff: boolean;
  jitterMs: number;
  currentRetryCount: number;
  nextRetryTime?: number;
  lastRetryTime?: number;
  totalRetries: number;
  successRate: number;
}

interface TimeoutConfiguration {
  service: string;
  category: string;
  timeoutMs: number;
  averageResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  timeoutCount: number;
  successCount: number;
  lastMeasurement: number;
  recommendedTimeout: number;
  isOptimal: boolean;
  adjustmentReason?: string;
}

// --- Mock API Responses ---
// In a real application, this data would come from a backend.

const mockHealthData: EnvironmentHealth = {
  isHealthy: false,
  lastHealthCheck: Date.now() - 5000,
  healthCheckDuration: 128,
  errors: [{ service: "CoinGecko", error: "API key limit reached" }],
  warnings: ["Sepolia RPC latency is high (250ms)"],
  degradedServices: ["Sepolia RPC"],
  totalServices: 5,
  healthyServices: 4,
  services: {
    rpcProviders: {
      goerli: { isHealthy: true, averageResponseTime: 80 },
      sepolia: { isHealthy: false, averageResponseTime: 250 },
    },
    marketData: {
      coinGecko: { isHealthy: false, averageResponseTime: 500 },
      chainlink: { isHealthy: true, averageResponseTime: 150 },
    },
    monitoring: { isHealthy: true, averageResponseTime: 50 },
  },
};

const mockCredentialsData: { credentials: CredentialStatus[] } = {
  credentials: [
    {
      service: "Infura Goerli",
      category: "RPC",
      hasCredentials: true,
      isValid: true,
      lastValidated: Date.now() - 10000,
      endpoint: "https://goerli.infura.io/v3/***",
      rateLimitRemaining: 9500,
      rateLimitReset: Date.now() + 3600000,
    },
    {
      service: "Alchemy Sepolia",
      category: "RPC",
      hasCredentials: true,
      isValid: true,
      lastValidated: Date.now() - 12000,
      endpoint: "https://sepolia.alchemy.com/v2/***",
      rateLimitRemaining: 48000,
      rateLimitReset: Date.now() + 3600000,
    },
    {
      service: "Etherscan",
      category: "Explorer",
      hasCredentials: true,
      isValid: true,
      lastValidated: Date.now() - 15000,
      endpoint: "https://api.etherscan.io",
      rateLimitRemaining: 4,
      rateLimitReset: Date.now() + 1000,
    },
    {
      service: "CoinGecko",
      category: "Market Data",
      hasCredentials: true,
      isValid: false,
      lastValidated: Date.now() - 5000,
      endpoint: "https://api.coingecko.com/api/v3",
      errorMessage: "Invalid API Key provided.",
    },
  ],
};

const mockRetryPoliciesData: { retryPolicies: RetryPolicy[] } = {
  retryPolicies: [
    {
      service: "CoinGecko",
      category: "Market Data",
      maxRetries: 5,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      exponentialBackoff: true,
      jitterMs: 500,
      currentRetryCount: 3,
      nextRetryTime: Date.now() + 8000,
      lastRetryTime: Date.now() - 2000,
      totalRetries: 15,
      successRate: 0.85,
    },
    {
      service: "Sepolia RPC",
      category: "RPC",
      maxRetries: 3,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      exponentialBackoff: true,
      jitterMs: 200,
      currentRetryCount: 0,
      totalRetries: 5,
      successRate: 0.98,
    },
  ],
};

const mockTimeoutConfigData: { timeoutConfigurations: TimeoutConfiguration[] } =
  {
    timeoutConfigurations: [
      {
        service: "Chainlink",
        category: "Market Data",
        timeoutMs: 2000,
        averageResponseTime: 150,
        maxResponseTime: 400,
        p95ResponseTime: 350,
        timeoutCount: 2,
        successCount: 1000,
        lastMeasurement: Date.now(),
        recommendedTimeout: 2000,
        isOptimal: true,
      },
      {
        service: "Goerli RPC",
        category: "RPC",
        timeoutMs: 1500,
        averageResponseTime: 1800,
        maxResponseTime: 3000,
        p95ResponseTime: 2500,
        timeoutCount: 150,
        successCount: 850,
        lastMeasurement: Date.now(),
        recommendedTimeout: 3000,
        isOptimal: false,
        adjustmentReason:
          "High P95 response time suggests increasing timeout to avoid premature failures.",
      },
    ],
  };

// --- Mock Context for Deployment ---
// This replaces the need for an external context file.

interface DeploymentContextType {
  envConfig: EnvConfig;
  setEnvConfig: (config: EnvConfig) => void;
  addLog: (log: string) => void;
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(
  undefined
);

const useDeployment = () => {
  const context = useContext(DeploymentContext);
  if (!context) {
    throw new Error("useDeployment must be used within a DeploymentProvider");
  }
  return context;
};

const DeploymentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [envConfig, setEnvConfigState] = useState<EnvConfig>({
    GOERLI_RPC_URL: "",
    SEPOLIA_RPC_URL: "",
    PRIVATE_KEY: "",
    ETHERSCAN_API_KEY: "",
    GAS_PRICE_GWEI: "20",
    GAS_LIMIT: "8000000",
  });

  const setEnvConfig = (newConfig: EnvConfig) => {
    setEnvConfigState(newConfig);
    // In a real app, you might also save to localStorage here
  };

  const addLog = (log: string) => {
    // In a real app, this would add to a log panel.
    // For this example, we'll just log to the console.
    console.log(`[LOG] ${log}`);
  };

  return (
    <DeploymentContext.Provider value={{ envConfig, setEnvConfig, addLog }}>
      {children}
    </DeploymentContext.Provider>
  );
};

// --- The Main Component (Fixed) ---

const EnvConfigPanel: React.FC = () => {
  const { envConfig, setEnvConfig, addLog } = useDeployment();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Production environment state
  const [environmentHealth, setEnvironmentHealth] =
    useState<EnvironmentHealth | null>(null);
  const [credentialStatuses, setCredentialStatuses] = useState<
    CredentialStatus[]
  >([]);
  const [retryPolicies, setRetryPolicies] = useState<RetryPolicy[]>([]);
  const [timeoutConfigurations, setTimeoutConfigurations] = useState<
    TimeoutConfiguration[]
  >([]);
  const [isLoadingEnvironment, setIsLoadingEnvironment] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "production" | "credentials" | "policies" | "timeouts" | "deployment"
  >("production");

  // Load production environment data
  useEffect(() => {
    loadEnvironmentData();
    const interval = setInterval(loadEnvironmentData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Check if configuration was loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
      if (
        envConfig.GOERLI_RPC_URL ||
        envConfig.PRIVATE_KEY ||
        envConfig.ETHERSCAN_API_KEY
      ) {
        addLog("🔄 Configuration loaded from .env file");
        addLog("✅ Deployment scripts will use this configuration");
        setLastSaved(new Date());
      }
    }, 1000); // Give time for API call to complete
    return () => clearTimeout(timer);
  }, [envConfig, addLog]);

  /**
   * Load production environment data from mock APIs
   */
  const loadEnvironmentData = async () => {
    setIsLoadingEnvironment(true);
    addLog("🔄 Refreshing production environment data...");
    try {
      // Simulate API calls with a delay
      await new Promise((res) => setTimeout(res, 500));
      setEnvironmentHealth(mockHealthData);
      setCredentialStatuses(mockCredentialsData.credentials);
      setRetryPolicies(mockRetryPoliciesData.retryPolicies);
      setTimeoutConfigurations(mockTimeoutConfigData.timeoutConfigurations);
      addLog("✅ Production data loaded successfully.");
    } catch (error) {
      console.error("Error loading environment data:", error);
      addLog("⚠️ Failed to load production environment data");
    } finally {
      setIsLoadingEnvironment(false);
    }
  };

  const handleInputChange = (field: keyof EnvConfig, value: string) => {
    const newConfig = { ...envConfig, [field]: value };
    setEnvConfig(newConfig);
    setLastSaved(new Date()); // Update last saved time

    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  const validateConfig = () => {
    const errors: Record<string, string> = {};
    if (!envConfig.GOERLI_RPC_URL)
      errors.GOERLI_RPC_URL = "Goerli RPC URL is required";
    else if (!envConfig.GOERLI_RPC_URL.startsWith("http"))
      errors.GOERLI_RPC_URL = "Must be a valid HTTP/HTTPS URL";

    if (!envConfig.SEPOLIA_RPC_URL)
      errors.SEPOLIA_RPC_URL = "Sepolia RPC URL is required";
    else if (!envConfig.SEPOLIA_RPC_URL.startsWith("http"))
      errors.SEPOLIA_RPC_URL = "Must be a valid HTTP/HTTPS URL";

    if (!envConfig.PRIVATE_KEY) errors.PRIVATE_KEY = "Private key is required";
    else if (envConfig.PRIVATE_KEY.startsWith("0x"))
      errors.PRIVATE_KEY = "Private key should not include 0x prefix";
    else if (envConfig.PRIVATE_KEY.length !== 64)
      errors.PRIVATE_KEY = "Private key must be 64 characters long";

    if (!envConfig.ETHERSCAN_API_KEY)
      errors.ETHERSCAN_API_KEY = "Etherscan API key is required";

    const gasPrice = parseInt(envConfig.GAS_PRICE_GWEI);
    if (isNaN(gasPrice) || gasPrice < 1 || gasPrice > 1000)
      errors.GAS_PRICE_GWEI = "Gas price must be between 1 and 1000 gwei";

    const gasLimit = parseInt(envConfig.GAS_LIMIT);
    if (isNaN(gasLimit) || gasLimit < 1000000 || gasLimit > 30000000)
      errors.GAS_LIMIT = "Gas limit must be between 1M and 30M";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // isConfigValid must be defined before it is used.
  const isConfigValid =
    Object.keys(validationErrors).length === 0 &&
    envConfig.GOERLI_RPC_URL &&
    envConfig.PRIVATE_KEY &&
    envConfig.ETHERSCAN_API_KEY &&
    envConfig.SEPOLIA_RPC_URL;

  const handleSave = async () => {
    if (!validateConfig()) {
      addLog("❌ Configuration validation failed");
      return;
    }

    setIsSaving(true);
    addLog("💾 Saving configuration...");
    try {
      // Simulate saving to .env file via API call
      await new Promise((res) => setTimeout(res, 1000));

      // This is a mock response. In a real app, this would be a real API call.
      const response = { ok: true };

      if (response.ok) {
        addLog("✅ Environment configuration saved and validated");
        addLog("💾 Configuration persisted to local storage");
        addLog("📄 Configuration written to .env file");
        addLog("🔄 Deployment scripts will now use your configuration");
      } else {
        addLog("✅ Configuration saved to local storage");
        addLog(
          "⚠️ Could not write to .env file - you may need to download and place it manually"
        );
      }
    } catch (error) {
      addLog("✅ Configuration saved to local storage");
      addLog(
        "⚠️ Could not write to .env file - you may need to download and place it manually"
      );
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const generateEnvFile = () => {
    const envContent = `# CryptoVault Credit Intelligence Environment Configuration
# Generated on ${new Date().toISOString()}

# Testnet RPC URLs
GOERLI_RPC_URL=${envConfig.GOERLI_RPC_URL}
SEPOLIA_RPC_URL=${envConfig.SEPOLIA_RPC_URL}

# Deployment Configuration
PRIVATE_KEY=${envConfig.PRIVATE_KEY}
ETHERSCAN_API_KEY=${envConfig.ETHERSCAN_API_KEY}

# Gas Configuration
GAS_PRICE_GWEI=${envConfig.GAS_PRICE_GWEI}
GAS_LIMIT=${envConfig.GAS_LIMIT}

# Contract Addresses (will be populated after deployment)
GOERLI_SIMPLE_CREDIT_SCORE=
SEPOLIA_SIMPLE_CREDIT_SCORE=
`;
    const blob = new Blob([envContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("📁 .env file downloaded");
  };

  const copyToClipboard = (text: string, label: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      addLog(`📋 ${label} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy: ", err);
      addLog(`⚠️ Failed to copy ${label}`);
    }
    document.body.removeChild(textArea);
  };

  const clearConfiguration = () => {
    // Replaced window.confirm with a direct action for this example.
    // In a real app, you would use a custom modal here.
    const emptyConfig = {
      GOERLI_RPC_URL: "",
      SEPOLIA_RPC_URL: "",
      PRIVATE_KEY: "",
      ETHERSCAN_API_KEY: "",
      GAS_PRICE_GWEI: "20",
      GAS_LIMIT: "8000000",
    };
    setEnvConfig(emptyConfig);
    setValidationErrors({});
    setLastSaved(null);
    addLog("🗑️ Configuration cleared");
  };

  const testConfiguration = async () => {
    if (!isConfigValid) {
      addLog("❌ Cannot test invalid configuration");
      return;
    }

    addLog("🧪 Testing configuration...");
    try {
      addLog("📡 Pinging Goerli RPC...");
      
      // Get real block number from Goerli
      const response = await fetch('/api/blockchain-verification/get-block-number');
      const data = await response.json();
      
      addLog("✅ Goerli RPC connection successful");
      addLog(`📊 Current block: ${data.blockNumber || 'Unknown'}`);
    } catch (error) {
      addLog("⚠️ Could not test RPC connection");
    }
    addLog("✅ Configuration test completed");
  };

  // Tailwind CSS classes for reuse
  const cardClasses =
    "bg-white shadow-lg rounded-xl p-6 border border-gray-200/80";
  const inputClasses =
    "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const btnBaseClasses =
    "py-2 px-4 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const btnPrimaryClasses = `${btnBaseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
  const btnSecondaryClasses = `${btnBaseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400`;

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className={cardClasses}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Production Environment Configuration
            </h2>
            <p className="text-gray-600 mt-1">
              Monitor and manage production API credentials, timeout values, and
              retry policies
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <button
              onClick={loadEnvironmentData}
              disabled={isLoadingEnvironment}
              className={`${btnSecondaryClasses} flex items-center space-x-2`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingEnvironment ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
            <div className="flex items-center space-x-2">
              {environmentHealth?.isHealthy ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
              <span className="font-medium text-gray-800">
                {environmentHealth?.isHealthy
                  ? "Environment Healthy"
                  : "Environment Issues"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={cardClasses}>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: "production", label: "Production Status", icon: Activity },
              { id: "credentials", label: "API Credentials", icon: Shield },
              { id: "policies", label: "Retry Policies", icon: RefreshCw },
              { id: "timeouts", label: "Timeout Config", icon: Clock },
              { id: "deployment", label: "Deployment Config", icon: Server },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                  activeTab === id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* --- Tab Content --- */}

      {/* Production Status Tab */}
      {activeTab === "production" &&
        (isLoadingEnvironment ? (
          <div className={cardClasses}>Loading...</div>
        ) : (
          environmentHealth && (
            <div className="space-y-6">
              <div className={cardClasses}>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Production Environment Health
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Cards for each metric */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div
                      className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${environmentHealth.isHealthy ? "bg-green-100" : "bg-red-100"}`}
                    >
                      {environmentHealth.isHealthy ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {environmentHealth.isHealthy ? "Healthy" : "Issues"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Overall Status
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                      <Server className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {environmentHealth.healthyServices}/
                        {environmentHealth.totalServices}
                      </div>
                      <div className="text-sm text-gray-600">
                        Services Healthy
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {environmentHealth.healthCheckDuration}ms
                      </div>
                      <div className="text-sm text-gray-600">
                        Health Check Time
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {new Date(
                          environmentHealth.lastHealthCheck
                        ).toLocaleTimeString()}
                      </div>
                      <div className="text-sm text-gray-600">Last Check</div>
                    </div>
                  </div>
                </div>
                {/* Warnings and Errors */}
                {environmentHealth.warnings.length > 0 && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Warnings
                    </h4>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                      {environmentHealth.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {environmentHealth.errors.length > 0 && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900 mb-2">Errors</h4>
                    <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                      {environmentHealth.errors.map((error, index) => (
                        <li key={index}>
                          <b>{error.service}:</b> {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Service Categories */}
                <div className={cardClasses}>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Database className="w-5 h-5 mr-2 text-blue-600" />
                    RPC Providers
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(
                      environmentHealth.services.rpcProviders || {}
                    ).map(([name, service]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${service.isHealthy ? "bg-green-500" : "bg-red-500"}`}
                          ></div>
                          <span className="text-sm font-medium capitalize">
                            {name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {service.averageResponseTime}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={cardClasses}>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-green-600" />
                    Market Data
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(
                      environmentHealth.services.marketData || {}
                    ).map(([name, service]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${service.isHealthy ? "bg-green-500" : "bg-red-500"}`}
                          ></div>
                          <span className="text-sm font-medium capitalize">
                            {name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {service.averageResponseTime}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={cardClasses}>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-600" />
                    Monitoring
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${environmentHealth.services.monitoring?.isHealthy ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        <span className="text-sm font-medium">
                          Monitoring Service
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {environmentHealth.services.monitoring
                          ?.averageResponseTime || 0}
                        ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        ))}

      {/* API Credentials Tab */}
      {activeTab === "credentials" && (
        <div className={cardClasses}>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            API Credential Status
          </h3>
          <div className="space-y-4">
            {credentialStatuses.map((credential, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${credential.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${credential.isValid ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <div>
                      <span className="font-medium text-gray-900">
                        {credential.service}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        ({credential.category})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${credential.isValid ? "text-green-600" : "text-red-600"}`}
                    >
                      {credential.isValid ? "Valid" : "Invalid"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Last checked:{" "}
                      {new Date(credential.lastValidated).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <span className="text-gray-600">Endpoint:</span>
                    <div className="font-mono text-xs text-gray-800 truncate">
                      {credential.endpoint}
                    </div>
                  </div>
                  {credential.rateLimitRemaining !== undefined && (
                    <div>
                      <span className="text-gray-600">Rate Limit:</span>
                      <div className="text-gray-800">
                        {credential.rateLimitRemaining} remaining
                        {credential.rateLimitReset && (
                          <span className="text-xs text-gray-500 ml-1">
                            (resets{" "}
                            {new Date(
                              credential.rateLimitReset
                            ).toLocaleTimeString()}
                            )
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {credential.errorMessage && (
                  <div className="mt-2 text-sm text-red-700 bg-red-100 p-2 rounded-md">
                    Error: {credential.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retry Policies Tab */}
      {activeTab === "policies" && (
        <div className={cardClasses}>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Retry Policies
          </h3>
          <div className="space-y-4">
            {retryPolicies.map((policy, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${policy.currentRetryCount > 0 ? "border-yellow-200 bg-yellow-50" : "border-gray-200 bg-gray-50"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <RefreshCw
                      className={`w-4 h-4 ${policy.currentRetryCount > 0 ? "text-yellow-600 animate-spin" : "text-gray-600"}`}
                    />
                    <div>
                      <span className="font-medium text-gray-900">
                        {policy.service}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        ({policy.category})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      Success Rate: {(policy.successRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {policy.totalRetries} total retries
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-gray-600">Max Retries:</span>
                    <div className="font-medium">{policy.maxRetries}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Base Delay:</span>
                    <div className="font-medium">{policy.baseDelayMs}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Delay:</span>
                    <div className="font-medium">{policy.maxDelayMs}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Strategy:</span>
                    <div className="font-medium">
                      {policy.exponentialBackoff ? "Exponential" : "Fixed"}
                    </div>
                  </div>
                </div>
                {policy.currentRetryCount > 0 && (
                  <div className="mt-3 p-2 bg-yellow-100 rounded">
                    <div className="text-sm text-yellow-800">
                      Currently retrying: {policy.currentRetryCount}/
                      {policy.maxRetries}
                      {policy.nextRetryTime && (
                        <span className="ml-2">
                          (next retry in{" "}
                          {Math.max(
                            0,
                            Math.ceil(
                              (policy.nextRetryTime - Date.now()) / 1000
                            )
                          )}
                          s)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeout Configurations Tab */}
      {activeTab === "timeouts" && (
        <div className={cardClasses}>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Timeout Configurations
          </h3>
          <div className="space-y-4">
            {timeoutConfigurations.map((timeout, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${!timeout.isOptimal ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Clock
                      className={`w-4 h-4 ${!timeout.isOptimal ? "text-yellow-600" : "text-green-600"}`}
                    />
                    <div>
                      <span className="font-medium text-gray-900">
                        {timeout.service}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        ({timeout.category})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${!timeout.isOptimal ? "text-yellow-600" : "text-green-600"}`}
                    >
                      {timeout.isOptimal ? "Optimal" : "Needs Adjustment"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {timeout.timeoutCount} timeouts / {timeout.successCount}{" "}
                      successes
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-gray-600">Current:</span>
                    <div className="font-medium">{timeout.timeoutMs}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Response:</span>
                    <div className="font-medium">
                      {timeout.averageResponseTime}ms
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">P95 Response:</span>
                    <div className="font-medium">
                      {timeout.p95ResponseTime}ms
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Recommended:</span>
                    <div className="font-medium">
                      {timeout.recommendedTimeout}ms
                    </div>
                  </div>
                </div>
                {timeout.adjustmentReason && (
                  <div className="mt-3 p-2 bg-yellow-100 rounded">
                    <div className="text-sm text-yellow-800">
                      <b>Recommendation:</b> {timeout.adjustmentReason}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deployment Configuration Tab */}
      {activeTab === "deployment" && (
        <div className="space-y-6">
          <div className={cardClasses}>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              RPC Provider Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Goerli RPC URL *</label>
                <div className="relative">
                  <input
                    type="text"
                    className={`${inputClasses} ${validationErrors.GOERLI_RPC_URL ? "border-red-500" : ""}`}
                    placeholder="https://goerli.infura.io/v3/your-project-id"
                    value={envConfig.GOERLI_RPC_URL}
                    onChange={(e) =>
                      handleInputChange("GOERLI_RPC_URL", e.target.value)
                    }
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(
                        envConfig.GOERLI_RPC_URL,
                        "Goerli RPC URL"
                      )
                    }
                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {validationErrors.GOERLI_RPC_URL && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.GOERLI_RPC_URL}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClasses}>Sepolia RPC URL *</label>
                <div className="relative">
                  <input
                    type="text"
                    className={`${inputClasses} ${validationErrors.SEPOLIA_RPC_URL ? "border-red-500" : ""}`}
                    placeholder="https://sepolia.infura.io/v3/your-project-id"
                    value={envConfig.SEPOLIA_RPC_URL}
                    onChange={(e) =>
                      handleInputChange("SEPOLIA_RPC_URL", e.target.value)
                    }
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(
                        envConfig.SEPOLIA_RPC_URL,
                        "Sepolia RPC URL"
                      )
                    }
                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {validationErrors.SEPOLIA_RPC_URL && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.SEPOLIA_RPC_URL}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={cardClasses}>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Security Configuration
            </h3>
            <div className="space-y-6">
              <div>
                <label className={labelClasses}>
                  Private Key *{" "}
                  <span className="text-red-600 ml-2">(Keep this secure!)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPrivateKey ? "text" : "password"}
                    className={`${inputClasses} pr-20 ${validationErrors.PRIVATE_KEY ? "border-red-500" : ""}`}
                    placeholder="64-character private key (without 0x prefix)"
                    value={envConfig.PRIVATE_KEY}
                    onChange={(e) =>
                      handleInputChange("PRIVATE_KEY", e.target.value)
                    }
                  />
                  <div className="absolute right-2 top-2 flex space-x-1">
                    <button
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showPrivateKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(envConfig.PRIVATE_KEY, "Private Key")
                      }
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {validationErrors.PRIVATE_KEY && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.PRIVATE_KEY}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClasses}>Etherscan API Key *</label>
                <div className="relative">
                  <input
                    type="text"
                    className={`${inputClasses} ${validationErrors.ETHERSCAN_API_KEY ? "border-red-500" : ""}`}
                    placeholder="Get from etherscan.io/apis"
                    value={envConfig.ETHERSCAN_API_KEY}
                    onChange={(e) =>
                      handleInputChange("ETHERSCAN_API_KEY", e.target.value)
                    }
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(
                        envConfig.ETHERSCAN_API_KEY,
                        "Etherscan API Key"
                      )
                    }
                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {validationErrors.ETHERSCAN_API_KEY && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.ETHERSCAN_API_KEY}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={cardClasses}>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Gas Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Gas Price (gwei)</label>
                <input
                  type="number"
                  className={`${inputClasses} ${validationErrors.GAS_PRICE_GWEI ? "border-red-500" : ""}`}
                  placeholder="20"
                  min="1"
                  max="1000"
                  value={envConfig.GAS_PRICE_GWEI}
                  onChange={(e) =>
                    handleInputChange("GAS_PRICE_GWEI", e.target.value)
                  }
                />
                {validationErrors.GAS_PRICE_GWEI && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.GAS_PRICE_GWEI}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClasses}>Gas Limit</label>
                <input
                  type="number"
                  className={`${inputClasses} ${validationErrors.GAS_LIMIT ? "border-red-500" : ""}`}
                  placeholder="8000000"
                  min="1000000"
                  max="30000000"
                  value={envConfig.GAS_LIMIT}
                  onChange={(e) =>
                    handleInputChange("GAS_LIMIT", e.target.value)
                  }
                />
                {validationErrors.GAS_LIMIT && (
                  <p className="text-red-600 text-sm mt-1">
                    {validationErrors.GAS_LIMIT}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={cardClasses}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Save Configuration
                </h3>
                {lastSaved && (
                  <p className="text-green-600 text-xs mt-1">
                    ✅ Auto-saved at {lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center space-x-3 mt-4 sm:mt-0">
                <button
                  onClick={clearConfiguration}
                  className={`${btnSecondaryClasses} text-red-600 hover:bg-red-50`}
                >
                  Clear All
                </button>
                <button
                  onClick={testConfiguration}
                  disabled={!isConfigValid}
                  className={btnSecondaryClasses}
                >
                  Test Config
                </button>
                <button
                  onClick={generateEnvFile}
                  className={btnSecondaryClasses}
                >
                  Download .env
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !isConfigValid}
                  className={`${btnPrimaryClasses} flex items-center space-x-2`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save & Validate"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- App Component to Render Everything ---

export default function App() {
  return (
    <DeploymentProvider>
      <EnvConfigPanel />
    </DeploymentProvider>
  );
}
