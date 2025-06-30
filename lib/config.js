/**
 * CarbonLink Configuration Management
 * Manages environment variables and configuration for the backend system
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration object
const config = {
  // Smart Contract Configuration
  rpcUrl: process.env.RPC_URL || 'https://sepolia.infura.io/v3/your-project-id',
  projectContractAddress: process.env.PROJECT_CONTRACT_ADDRESS || '0xfd96eFfcac6eeC9c46bE26DddE17a29E5F08688D',
  managerContractAddress: process.env.MANAGER_CONTRACT_ADDRESS || '0x53B9AE8267c2D99152d1577C8F64978A84FAeBE3',
  
  // Chainlink Functions Configuration
  chainlinkFunctionsRouter: process.env.CHAINLINK_FUNCTIONS_ROUTER || '0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C',
  chainlinkDonId: process.env.CHAINLINK_DON_ID || '0x66756e2d657468657265756d2d7365706f6c69612d310000000000000000',
  chainlinkSubscriptionId: process.env.CHAINLINK_SUBSCRIPTION_ID || 'your_subscription_id_here',
  
  // API Keys
  openweatherApiKey: process.env.OPENWEATHER_API_KEY,
  sentinelApiKey: process.env.SENTINEL_API_KEY,
  sentinelUserId: process.env.SENTINEL_USER_ID,
  sentinelSecret: process.env.SENTINEL_SECRET,
  planetLabsApiKey: process.env.PLANET_LABS_API_KEY,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  nasaFirmsApiKey: process.env.NASA_FIRMS_API_KEY,
  
  // Private Key
  privateKey: process.env.PRIVATE_KEY,
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  logConsole: process.env.LOG_CONSOLE === 'true',
  logFile: process.env.LOG_FILE === 'true',
};

// Validation function
function validateConfig() {
  const requiredFields = [
    'rpcUrl',
    'chainlinkFunctionsRouter',
    'chainlinkDonId'
  ];
  
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
  }
  
  // Validate Chainlink configuration
  if (!config.chainlinkFunctionsRouter.startsWith('0x')) {
    throw new Error('CHAINLINK_FUNCTIONS_ROUTER must be a valid Ethereum address');
  }
  
  if (!config.chainlinkDonId.startsWith('0x')) {
    throw new Error('CHAINLINK_DON_ID must be a valid hex string');
  }
  
  console.log('✅ Configuration validated successfully');
  console.log(`🌐 RPC URL: ${config.rpcUrl}`);
  console.log(`🏗️ Manager Contract: ${config.managerContractAddress}`);
  console.log(`📦 Project Contract: ${config.projectContractAddress}`);
  console.log(`🔗 Chainlink Functions Router: ${config.chainlinkFunctionsRouter}`);
  console.log(`🆔 Chainlink DON ID: ${config.chainlinkDonId}`);
  console.log(`📋 Chainlink Subscription ID: ${config.chainlinkSubscriptionId}`);
}

// Export config and validation function
module.exports = {
  config,
  validateConfig
}; 