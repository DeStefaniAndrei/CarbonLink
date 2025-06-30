/**
 * CarbonLink Chainlink Functions Integration
 * Connects carbon calculations to Chainlink's decentralized oracle network
 */

const { ethers } = require('ethers');
const { config } = require('./config');

class ChainlinkFunctionsIntegration {
  constructor() {
    // Initialize provider
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    
    // Initialize signer if private key is provided
    if (config.privateKey) {
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
    }
    
    this.functionsRouter = null;
  }

  /**
   * Initialize the Chainlink Functions Router contract
   */
  async initializeRouter() {
    if (!this.signer) {
      throw new Error('Private key required for Chainlink Functions operations');
    }

    // Chainlink Functions Router ABI (simplified for MVP)
    const routerAbi = [
      'function sendRequest(uint64 subscriptionId, bytes calldata data, uint16 dataVersion, uint32 callbackGasLimit, bytes32 donId) external returns (bytes32)',
      'function fulfillRequest(bytes32 requestId, bytes calldata response, bytes calldata err) external',
      'event RequestSent(bytes32 indexed requestId, address indexed sender, uint64 indexed subscriptionId, bytes data, uint16 dataVersion, uint32 callbackGasLimit, bytes32 donId)',
      'event RequestFulfilled(bytes32 indexed requestId, bytes response, bytes err)',
    ];

    this.functionsRouter = new ethers.Contract(
      config.chainlinkFunctionsRouter,
      routerAbi,
      this.signer
    );

    console.log('✅ Chainlink Functions Router initialized');
  }

  /**
   * Create the Chainlink Functions source code for carbon calculations
   */
  generateCarbonCalculationSource() {
    return `

`;
  }

  /**
   * Submit a carbon calculation request to Chainlink Functions
   */
  async submitCarbonCalculation(location, projectArea, projectDuration, baselineScenario = 'business-as-usual', projectType = 'reforestation') {
    if (!this.functionsRouter) {
      await this.initializeRouter();
    }

    if (!this.functionsRouter) {
      throw new Error('Failed to initialize Chainlink Functions Router');
    }

    // Prepare the request data
    const args = [
      location.latitude.toString(),
      location.longitude.toString(),
      location.elevation.toString(),
      projectArea.toString(),
      projectDuration.toString(),
      baselineScenario,
      projectType
    ];

    // Encode the arguments
    const encodedArgs = ethers.utils.defaultAbiCoder.encode(['string[]'], [args]);

    // Prepare secrets (API keys if needed)
    const secrets = {};
    if (config.openweatherApiKey) {
      secrets.OPENWEATHER_API_KEY = config.openweatherApiKey;
    }
    if (config.sentinelApiKey) {
      secrets.SENTINEL_API_KEY = config.sentinelApiKey;
    }

    // Encode secrets
    const encodedSecrets = ethers.utils.defaultAbiCoder.encode(
      ['string[]', 'string[]'],
      [Object.keys(secrets), Object.values(secrets)]
    );

    // Combine data and secrets
    const data = ethers.utils.concat([encodedArgs, encodedSecrets]);

    try {
      // Submit the request
      const tx = await this.functionsRouter.sendRequest(
        config.chainlinkSubscriptionId,
        data,
        1, // dataVersion
        300000, // callbackGasLimit
        config.chainlinkDonId
      );

      console.log('📡 Chainlink Functions request submitted');
      console.log(`🔗 Transaction hash: ${tx.hash}`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed');

      // Extract request ID from event
      const requestSentEvent = receipt.logs.find(
        (log) => log.eventName === 'RequestSent'
      );

      if (requestSentEvent) {
        const requestId = requestSentEvent.args.requestId;
        console.log(`🆔 Request ID: ${requestId}`);
        return requestId;
      } else {
        throw new Error('RequestSent event not found in transaction receipt');
      }

    } catch (error) {
      console.error('❌ Error submitting Chainlink Functions request:', error);
      throw error;
    }
  }

  /**
   * Get the result of a Chainlink Functions request
   */
  async getRequestResult(requestId) {
    if (!this.functionsRouter) {
      await this.initializeRouter();
    }

    if (!this.functionsRouter) {
      throw new Error('Failed to initialize Chainlink Functions Router');
    }

    try {
      // Get the request details
      const request = await this.functionsRouter.getRequest(requestId);
      
      if (!request) {
        console.log('Request not found or not yet processed');
        return null;
      }

      // Check if request is fulfilled
      if (request.response === '0x') {
        console.log('Request is still pending');
        return null;
      }

      // Decode the response
      const responseData = ethers.utils.defaultAbiCoder.decode(
        ['string'],
        request.response
      )[0];

      const result = JSON.parse(responseData);

      if (result.error) {
        throw new Error(`Chainlink Functions error: ${result.error}`);
      }

      return {
        netCarbonBalance: result.netCarbonBalance,
        totalProjectCarbon: result.totalProjectCarbon,
        confidence: result.confidence,
        uncertainty: result.uncertainty,
        timestamp: result.timestamp,
        requestId: requestId
      };

    } catch (error) {
      console.error('❌ Error getting request result:', error);
      throw error;
    }
  }

  /**
   * Wait for a Chainlink Functions request to complete
   */
  async waitForRequestCompletion(requestId, maxWaitTime = 300000) {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const result = await this.getRequestResult(requestId);
        if (result) {
          console.log('✅ Chainlink Functions request completed');
          return result;
        }
      } catch (error) {
        console.log('Request still processing...');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Request timeout - Chainlink Functions request did not complete within the specified time');
  }

  /**
   * Complete carbon calculation workflow
   */
  async calculateCarbonOffsetOnChain(location, projectArea, projectDuration, baselineScenario = 'business-as-usual', projectType = 'reforestation') {
    console.log('🚀 Starting on-chain carbon calculation...');
    
    // Submit the request
    const requestId = await this.submitCarbonCalculation(
      location,
      projectArea,
      projectDuration,
      baselineScenario,
      projectType
    );

    // Wait for completion
    const result = await this.waitForRequestCompletion(requestId);
    
    console.log('🎉 Carbon calculation completed on-chain!');
    console.log(`📊 Net Carbon Balance: ${result.netCarbonBalance.toFixed(2)} tCO2e/ha/year`);
    console.log(`🌍 Total Project Carbon: ${result.totalProjectCarbon.toFixed(2)} tCO2e`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`❓ Uncertainty: ${result.uncertainty.toFixed(1)}%`);

    return result;
  }
}

// Export singleton instance
const chainlinkFunctionsIntegration = new ChainlinkFunctionsIntegration();

module.exports = {
  chainlinkFunctionsIntegration,
  ChainlinkFunctionsIntegration
}; 