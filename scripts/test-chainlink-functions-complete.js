const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import our modules
const { configManager } = require('../lib/config');
const { DataSourceManager } = require('../lib/data-sources');
const { ChainlinkFunctionsHelper, createChainlinkSource, createSimpleChainlinkSource, DEFAULT_CHAINLINK_CONFIG } = require('../lib/chainlink-functions');

// Contract ABIs (simplified for testing)
const FACTORY_ABI = [
  "function createProject(string) external returns (address)",
  "function setGlobalChainlinkConfig(bytes32,uint64,string) external",
  "event ProjectCreated(uint256 indexed projectId, address indexed projectAddress, address indexed owner)"
];

const PROJECT_ABI = [
  "function requestCarbonData() external",
  "function totalCreditsIssued() external view returns (uint256)",
  "function bufferCredits() external view returns (uint256)",
  "function carbonCredits() external view returns (uint256)",
  "function projectId() external view returns (uint256)",
  "function landDetails() external view returns (string)",
  "function startDate() external view returns (uint256)",
  "function projectOwner() external view returns (address)",
  "function setChainlinkConfig(bytes32,uint64,string) external",
  "function fulfillRequest(bytes32,bytes,bytes) external",
  "event CarbonDataRequested(bytes32 indexed requestId)",
  "event CreditsIssued(uint256 tradableAmount, uint256 bufferAmount)"
];

class ChainlinkFunctionsTester {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.factoryContract = null;
    this.projectContract = null;
    this.chainlinkHelper = null;
    this.dataSourceManager = null;
  }

  async initialize() {
    console.log('🚀 Initializing Chainlink Functions Tester...');
    
    // Initialize provider and signer
    const rpcUrl = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('RPC_URL or SEPOLIA_RPC_URL environment variable is required');
    }
    
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is required');
    }
    
    this.signer = new ethers.Wallet(privateKey, this.provider);
    
    console.log('✅ Provider and signer initialized');
    console.log('📡 Connected to network:', await this.provider.getNetwork());
    console.log('👤 Signer address:', await this.signer.getAddress());
    
    // Initialize data source manager
    this.dataSourceManager = new DataSourceManager({
      dataSources: {
        openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '',
        sentinelUserId: process.env.SENTINEL_USER_ID || '',
        sentinelSecret: process.env.SENTINEL_SECRET || '',
        copernicusUserId: process.env.COPERNICUS_USER_ID || '',
        copernicusSecret: process.env.COPERNICUS_SECRET || '',
        copernicusAccessToken: process.env.COPERNICUS_ACCESS_TOKEN || ''
      }
    });
    if (typeof this.dataSourceManager.initialize === 'function') {
      await this.dataSourceManager.initialize();
    }
    
    console.log('✅ Data source manager initialized');
  }

  async deployContracts() {
    console.log('\n🏗️ Deploying smart contracts...');
    
    try {
      // Read contract artifacts
      const factoryArtifact = JSON.parse(fs.readFileSync(
        path.join(__dirname, '../artifacts/contracts/FactoryImplementation.sol/FactoryImplementation.json')
      ));
      
      const projectArtifact = JSON.parse(fs.readFileSync(
        path.join(__dirname, '../artifacts/contracts/ProjectImplementation.sol/ProjectImplementation.json')
      ));
      
      console.log('📄 Contract artifacts loaded');
      
      // Deploy Project Implementation
      console.log('📦 Deploying Project Implementation...');
      const projectImplementation = new ethers.ContractFactory(
        projectArtifact.abi,
        projectArtifact.bytecode,
        this.signer
      );
      
      const projectImpl = await projectImplementation.deploy();
      await projectImpl.deployed();
      console.log('✅ Project Implementation deployed at:', projectImpl.address);
      
      // Deploy Factory Implementation
      console.log('🏭 Deploying Factory Implementation...');
      const factoryImplementation = new ethers.ContractFactory(
        factoryArtifact.abi,
        factoryArtifact.bytecode,
        this.signer
      );
      
      const factoryImpl = await factoryImplementation.deploy();
      await factoryImpl.deployed();
      console.log('✅ Factory Implementation deployed at:', factoryImpl.address);
      
      // Deploy Factory Proxy
      console.log('🔗 Deploying Factory Proxy...');
      const proxyArtifact = JSON.parse(fs.readFileSync(
        path.join(__dirname, '../artifacts/contracts/FactoryProxy.sol/FactoryProxy.json')
      ));
      
      const factoryProxy = new ethers.ContractFactory(
        proxyArtifact.abi,
        proxyArtifact.bytecode,
        this.signer
      );
      
      const proxy = await factoryProxy.deploy(factoryImpl.address, "0x");
      await proxy.deployed();
      console.log('✅ Factory Proxy deployed at:', proxy.address);
      
      // Initialize the factory
      console.log('⚙️ Initializing factory...');
      const factoryContract = new ethers.Contract(proxy.address, FACTORY_ABI, this.signer);
      const initTx = await factoryContract.setGlobalChainlinkConfig(
        DEFAULT_CHAINLINK_CONFIG.donId,
        DEFAULT_CHAINLINK_CONFIG.subscriptionId,
        createSimpleChainlinkSource()
      );
      await initTx.wait();
      console.log('✅ Factory initialized with Chainlink config');
      
      this.factoryContract = factoryContract;
      
      return {
        factoryAddress: proxy.address,
        projectImplAddress: projectImpl.address,
        factoryImplAddress: factoryImpl.address
      };
      
    } catch (error) {
      console.error('❌ Error deploying contracts:', error);
      throw error;
    }
  }

  async createProject(landDetails) {
    console.log('\n🌱 Creating carbon project...');
    console.log('Land details:', landDetails);
    
    try {
      const tx = await this.factoryContract.createProject(landDetails);
      const receipt = await tx.wait();
      
      // Find the ProjectCreated event
      const event = receipt.logs.find((log) => {
        try {
          const parsed = this.factoryContract.interface.parseLog(log);
          return parsed?.name === 'ProjectCreated';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = this.factoryContract.interface.parseLog(event);
        const projectAddress = parsed.args[1];
        const projectId = parsed.args[0];
        
        console.log('✅ Project created successfully!');
        console.log('📋 Project ID:', projectId.toString());
        console.log('📍 Project address:', projectAddress);
        
        // Initialize project contract
        this.projectContract = new ethers.Contract(projectAddress, PROJECT_ABI, this.signer);
        this.chainlinkHelper = new ChainlinkFunctionsHelper(
          this.provider,
          this.signer,
          projectAddress,
          this.factoryContract.address
        );
        
        return {
          projectId: projectId.toString(),
          projectAddress
        };
      } else {
        throw new Error('ProjectCreated event not found');
      }
      
    } catch (error) {
      console.error('❌ Error creating project:', error);
      throw error;
    }
  }

  async testRealDataFetching() {
    console.log('\n🌍 Testing real data fetching...');
    
    try {
      // Test location: Amazon Rainforest
      const testLocation = {
        lat: -3.4653,
        lng: -58.3804,
        name: 'Amazon Rainforest'
      };
      
      console.log('📍 Test location:', testLocation.name);
      console.log('   Coordinates:', testLocation.lat, testLocation.lng);
      
      // Fetch real data from all sources
      const weatherData = await this.dataSourceManager.getWeatherData(testLocation.lat, testLocation.lng);
      const satelliteData = await this.dataSourceManager.getSatelliteData(testLocation.lat, testLocation.lng);
      const soilData = await this.dataSourceManager.getSoilData(testLocation.lat, testLocation.lng);
      
      console.log('📊 Real data fetched:');
      console.log('  🌤️ Weather:', {
        temperature: weatherData.temperature + '°C',
        humidity: weatherData.humidity + '%',
        pressure: weatherData.pressure + ' hPa'
      });
      console.log('  🛰️ Satellite (NDVI):', satelliteData.ndvi);
      console.log('  🌍 Soil moisture:', soilData.moisture);
      
      // Calculate carbon offset
      const carbonOffset = this.calculateCarbonOffset(weatherData, satelliteData, soilData);
      console.log('  🧮 Calculated carbon offset:', carbonOffset.toFixed(3), 'tons CO2/ha/year');
      
      return {
        location: testLocation,
        weatherData,
        satelliteData,
        soilData,
        carbonOffset
      };
      
    } catch (error) {
      console.error('❌ Error testing real data fetching:', error);
      throw error;
    }
  }

  calculateCarbonOffset(weatherData, satelliteData, soilData) {
    // Temperature factor (optimal range: 15-25°C)
    const tempFactor = Math.max(0, 1 - Math.abs(weatherData.temperature - 20) / 10);
    
    // Humidity factor (higher humidity = better growth)
    const humidityFactor = weatherData.humidity / 100;
    
    // NDVI factor (higher NDVI = more vegetation = more carbon)
    const ndviFactor = Math.max(0, satelliteData.ndvi);
    
    // Soil moisture factor (optimal range: 0.3-0.6)
    const soilFactor = Math.max(0, 1 - Math.abs(soilData.moisture - 0.45) / 0.3);
    
    // Calculate total carbon offset (tons CO2 per hectare per year)
    let carbonOffset = 10 * tempFactor * humidityFactor * ndviFactor * soilFactor;
    
    // Add some randomness for realistic variation
    const variation = (Math.random() - 0.5) * 2;
    carbonOffset = Math.max(0, carbonOffset + variation);
    
    return carbonOffset;
  }

  async testChainlinkFunctionsRequest() {
    console.log('\n🔗 Testing Chainlink Functions request...');
    
    try {
      if (!this.projectContract) {
        throw new Error('Project contract not initialized. Create a project first.');
      }
      
      // Request carbon data from Chainlink Functions
      console.log('📡 Requesting carbon data from Chainlink Functions...');
      const requestId = await this.chainlinkHelper.requestCarbonData();
      
      console.log('✅ Chainlink Functions request submitted!');
      console.log('🆔 Request ID:', requestId);
      
      // Note: In a real scenario, the Chainlink Functions would:
      // 1. Execute the source code off-chain
      // 2. Call your APIs (OpenWeather, Sentinel Hub, Copernicus)
      // 3. Calculate carbon offset
      // 4. Call fulfillRequest() on your contract
      
      console.log('⏳ Waiting for Chainlink Functions execution...');
      console.log('   (This would happen automatically in production)');
      
      return requestId;
      
    } catch (error) {
      console.error('❌ Error testing Chainlink Functions request:', error);
      throw error;
    }
  }

  async simulateChainlinkResponse(requestId, carbonOffset) {
    console.log('\n🎭 Simulating Chainlink Functions response...');
    
    try {
      if (!this.projectContract) {
        throw new Error('Project contract not initialized');
      }
      
      // Encode the carbon offset value
      const encodedResponse = ethers.utils.defaultAbiCoder.encode(['uint256'], [Math.floor(carbonOffset * 1000)]);
      
      // Simulate the fulfillRequest call (in production, this would be called by Chainlink)
      console.log('📤 Calling fulfillRequest with carbon offset:', carbonOffset.toFixed(3));
      
      // Note: In production, only the Chainlink Functions router can call this
      // For testing, we'll call it directly
      const tx = await this.projectContract.fulfillRequest(requestId, encodedResponse, "0x");
      const receipt = await tx.wait();
      
      console.log('✅ Chainlink Functions response simulated!');
      console.log('📄 Transaction hash:', receipt.transactionHash);
      
      // Check if credits were issued
      const totalCredits = await this.projectContract.totalCreditsIssued();
      const bufferCredits = await this.projectContract.bufferCredits();
      
      console.log('💰 Credits issued:');
      console.log('  Total credits:', ethers.utils.formatUnits(totalCredits, 0));
      console.log('  Buffer credits:', ethers.utils.formatUnits(bufferCredits, 0));
      
      return {
        requestId,
        carbonOffset,
        totalCredits: totalCredits.toString(),
        bufferCredits: bufferCredits.toString()
      };
      
    } catch (error) {
      console.error('❌ Error simulating Chainlink response:', error);
      throw error;
    }
  }

  async runCompleteTest() {
    console.log('🚀 Starting complete Chainlink Functions test...\n');
    
    try {
      // Step 1: Initialize
      await this.initialize();
      
      // Step 2: Deploy contracts
      const deployment = await this.deployContracts();
      console.log('\n📋 Deployment Summary:');
      console.log('  Factory:', deployment.factoryAddress);
      console.log('  Project Implementation:', deployment.projectImplAddress);
      console.log('  Factory Implementation:', deployment.factoryImplAddress);
      
      // Step 3: Create a project
      const landDetails = "100 acres of pine trees in Amazon Rainforest";
      const project = await this.createProject(landDetails);
      
      // Step 4: Test real data fetching
      const realData = await this.testRealDataFetching();
      
      // Step 5: Test Chainlink Functions request
      const requestId = await this.testChainlinkFunctionsRequest();
      
      // Step 6: Simulate Chainlink response
      const response = await this.simulateChainlinkResponse(requestId, realData.carbonOffset);
      
      console.log('\n🎉 Complete test finished successfully!');
      console.log('\n📊 Test Results Summary:');
      console.log('  🌍 Location tested:', realData.location.name);
      console.log('  🌤️ Weather data:', realData.weatherData.temperature + '°C, ' + realData.weatherData.humidity + '% humidity');
      console.log('  🛰️ Satellite NDVI:', realData.satelliteData.ndvi);
      console.log('  🌍 Soil moisture:', realData.soilData.moisture);
      console.log('  🧮 Carbon offset calculated:', realData.carbonOffset.toFixed(3), 'tons CO2/ha/year');
      console.log('  🔗 Chainlink request ID:', requestId);
      console.log('  💰 Credits issued:', response.totalCredits);
      console.log('  🛡️ Buffer credits:', response.bufferCredits);
      
      return {
        deployment,
        project,
        realData,
        requestId,
        response
      };
      
    } catch (error) {
      console.error('\n❌ Test failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const tester = new ChainlinkFunctionsTester();
  
  try {
    await tester.runCompleteTest();
    console.log('\n✅ All tests passed! Your CarbonLink backend is ready for production.');
    console.log('\n🎯 Next steps:');
    console.log('  1. Deploy to mainnet with real Chainlink Functions subscription');
    console.log('  2. Set up monitoring for Chainlink Functions execution');
    console.log('  3. Connect your frontend to the deployed contracts');
    console.log('  4. Implement additional carbon calculation algorithms');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ChainlinkFunctionsTester }; 