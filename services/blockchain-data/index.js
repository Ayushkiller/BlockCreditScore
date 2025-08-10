// CommonJS wrapper for blockchain data manager
const { createRequire } = require('module');
const require = createRequire(import.meta.url);

// Dynamic import for ES modules
let blockchainDataModule;

async function loadBlockchainDataModule() {
  if (!blockchainDataModule) {
    blockchainDataModule = await import('./src/index.js');
  }
  return blockchainDataModule;
}

// Export CommonJS compatible interface
module.exports = {
  async createBlockchainDataManager() {
    const module = await loadBlockchainDataModule();
    return module.createBlockchainDataManager();
  },
  
  async getRealBlockchainDataManager() {
    const module = await loadBlockchainDataModule();
    return module.RealBlockchainDataManager;
  },
  
  async getEthereumConnectionService() {
    const module = await loadBlockchainDataModule();
    return module.EthereumConnectionService;
  }
};