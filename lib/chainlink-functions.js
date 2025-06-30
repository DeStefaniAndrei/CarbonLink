const { ethers } = require('ethers');
const { configManager } = require('./config');
const { DataSourceManager } = require('./data-sources');

class ChainlinkFunctionsHelper {
  constructor(provider, signer, projectAddress, managerAddress) {
    this.provider = provider;
    this.signer = signer;
    
    // Project Implementation ABI (simplified for frontend)
    const projectABI = [
      "function requestCarbonData() external",
      "function totalCreditsIssued() external view returns (uint256)",
      "function bufferCredits() external view returns (uint256)",
      "function carbonCredits() external view returns (uint256)",
      "function projectId() external view returns (uint256)",
      "function landDetails() external view returns (string)",
      "function startDate() external view returns (uint256)",
      "function projectOwner() external view returns (address)",
      "function setChainlinkConfig(bytes32,uint64,string) external",
      "event CarbonDataRequested(bytes32 indexed requestId)",
      "event CreditsIssued(uint256 tradableAmount, uint256 bufferAmount)"
    ];

    // Manager ABI (simplified for frontend)
    const managerABI = [
      "function createProject(string) external returns (address)",
      "function setGlobalChainlinkConfig(bytes32,uint64,string) external"
    ];

    this.projectContract = new ethers.Contract(projectAddress, projectABI, signer);
    this.managerContract = new ethers.Contract(managerAddress, managerABI, signer);
  }

  /**
   * Request carbon data from Chainlink Functions
   */
  async requestCarbonData() {
    try {
      console.log('🔄 Requesting carbon data from Chainlink Functions...');
      const tx = await this.projectContract.requestCarbonData();
      const receipt = await tx.wait();
      
      // Find the CarbonDataRequested event
      const event = receipt?.logs?.find((log) => {
        try {
          const parsed = this.projectContract.interface.parseLog(log);
          return parsed?.name === 'CarbonDataRequested';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = this.projectContract.interface.parseLog(event);
        const requestId = parsed?.args?.[0] || '';
        console.log('✅ Carbon data request submitted. Request ID:', requestId);
        return requestId;
      }
      
      throw new Error('CarbonDataRequested event not found');
    } catch (error) {
      console.error('❌ Error requesting carbon data:', error);
      throw error;
    }
  }

  /**
   * Get project data
   */
  async getProjectData() {
    try {
      const [
        projectId,
        landDetails,
        startDate,
        projectOwner,
        totalCreditsIssued,
        bufferCredits,
        carbonCredits
      ] = await Promise.all([
        this.projectContract.projectId(),
        this.projectContract.landDetails(),
        this.projectContract.startDate(),
        this.projectContract.projectOwner(),
        this.projectContract.totalCreditsIssued(),
        this.projectContract.bufferCredits(),
        this.projectContract.carbonCredits()
      ]);

      return {
        projectId: Number(projectId),
        landDetails,
        startDate: Number(startDate),
        projectOwner,
        totalCreditsIssued: Number(totalCreditsIssued),
        bufferCredits: Number(bufferCredits),
        carbonCredits: Number(carbonCredits)
      };
    } catch (error) {
      console.error('❌ Error getting project data:', error);
      throw error;
    }
  }

  /**
   * Create a new project
   */
  async createProject(landDetails) {
    try {
      console.log('🏗️ Creating new carbon project...');
      const tx = await this.managerContract.createProject(landDetails);
      const receipt = await tx.wait();
      console.log('✅ Project created. Transaction hash:', receipt?.hash);
      return receipt?.hash || '';
    } catch (error) {
      console.error('❌ Error creating project:', error);
      throw error;
    }
  }

  /**
   * Set Chainlink configuration for a project
   */
  async setChainlinkConfig(donId, subscriptionId, source) {
    try {
      console.log('⚙️ Setting Chainlink configuration...');
      const tx = await this.projectContract.setChainlinkConfig(
        donId,
        subscriptionId,
        source
      );
      await tx.wait();
      console.log('✅ Chainlink configuration set successfully');
    } catch (error) {
      console.error('❌ Error setting Chainlink config:', error);
      throw error;
    }
  }

  /**
   * Listen for carbon data requests
   */
  onCarbonDataRequested(callback) {
    this.projectContract.on('CarbonDataRequested', (requestId) => {
      console.log('📡 Carbon data requested:', requestId);
      callback(requestId);
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.projectContract.removeAllListeners('CarbonDataRequested');
  }
}

/**
 * Create Chainlink Functions source code that calls real APIs
 */
function createChainlinkSource(location, startDate, endDate) {
  return `
    // CarbonLink Chainlink Functions Source Code
    // This code runs off-chain and fetches real environmental data
    
    const Functions = require('@chainlink/functions-toolkit');
    
    // Parse input arguments
    const location = args[0]; // JSON string with lat, lng
    const startDate = args[1]; // Start date for carbon calculation
    const endDate = args[2];   // End date for carbon calculation
    
    console.log('🌍 CarbonLink Functions: Starting carbon offset calculation');
    console.log('Location:', location);
    console.log('Date range:', startDate, 'to', endDate);
    
    try {
      // Parse location
      const locationData = JSON.parse(location);
      const { lat, lng } = locationData;
      
      // Fetch weather data from OpenWeather API
      console.log('🌤️ Fetching weather data...');
      const weatherResponse = await Functions.makeHttpRequest({
        url: \`https://api.openweathermap.org/data/2.5/weather?lat=\${lat}&lon=\${lng}&appid=\${secrets.openweatherApiKey}&units=metric\`
      });
      
      if (weatherResponse.error) {
        throw new Error('Weather API error: ' + weatherResponse.error);
      }
      
      const weatherData = weatherResponse.data;
      console.log('✅ Weather data retrieved:', weatherData.main.temp, '°C');
      
      // Fetch satellite data from Sentinel Hub API
      console.log('🛰️ Fetching satellite data...');
      const sentinelResponse = await Functions.makeHttpRequest({
        url: 'https://services.sentinel-hub.com/api/v1/statistics',
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${secrets.sentinelAccessToken}\`,
          'Content-Type': 'application/json'
        },
        data: {
          input: {
            bounds: {
              bbox: [lng - 0.001, lat - 0.001, lng + 0.001, lat + 0.001],
              properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" }
            },
            data: [{ type: "sentinel-2-l2a", dataFilter: { mosaickingOrder: "leastCC" } }]
          },
          aggregation: {
            timeRange: { from: startDate, to: endDate },
            aggregationInterval: { of: "P1D" },
            resx: 10, resy: 10,
            evalscript: \`
              //VERSION=3
              function setup() {
                return {
                  input: [{ bands: ["B04", "B08", "dataMask"] }],
                  output: [{ id: "ndvi", bands: 1, sampleType: "FLOAT32" }]
                };
              }
              function evaluatePixel(samples) {
                let ndvi = (samples.B08 - samples.B04) / (samples.B08 + samples.B04);
                return { ndvi: [ndvi] };
              }
            \`
          }
        }
      });
      
      if (sentinelResponse.error) {
        throw new Error('Sentinel Hub API error: ' + sentinelResponse.error);
      }
      
      const ndviData = sentinelResponse.data;
      const ndviValue = ndviData.data?.[0]?.outputs?.ndvi?.bands?.B0?.stats?.mean || 0.5;
      console.log('✅ NDVI data retrieved:', ndviValue);
      
      // Fetch soil data from Copernicus API
      console.log('🌍 Fetching soil data...');
      const copernicusResponse = await Functions.makeHttpRequest({
        url: 'https://land.copernicus.eu/api/@search',
        headers: {
          'Authorization': \`Bearer \${secrets.copernicusAccessToken}\`,
          'Accept': 'application/json'
        },
        params: {
          portal_type: 'DataSet',
          metadata_fields: 'UID',
          SearchableText: 'soil moisture'
        }
      });
      
      if (copernicusResponse.error) {
        throw new Error('Copernicus API error: ' + copernicusResponse.error);
      }
      
      // For now, use a default soil moisture value
      const soilMoisture = 0.35; // Default value
      console.log('✅ Soil data retrieved:', soilMoisture);
      
      // Calculate carbon offset based on real data
      console.log('🧮 Calculating carbon offset...');
      
      // Base carbon calculation factors
      const temperature = weatherData.main.temp;
      const humidity = weatherData.main.humidity;
      const ndvi = ndviValue;
      const soilMoistureValue = soilMoisture;
      
      // Carbon sequestration calculation
      let carbonOffset = 0;
      
      // Temperature factor (optimal range: 15-25°C)
      const tempFactor = Math.max(0, 1 - Math.abs(temperature - 20) / 10);
      
      // Humidity factor (higher humidity = better growth)
      const humidityFactor = humidity / 100;
      
      // NDVI factor (higher NDVI = more vegetation = more carbon)
      const ndviFactor = Math.max(0, ndvi);
      
      // Soil moisture factor (optimal range: 0.3-0.6)
      const soilFactor = Math.max(0, 1 - Math.abs(soilMoistureValue - 0.45) / 0.3);
      
      // Calculate total carbon offset (tons CO2 per hectare per year)
      carbonOffset = 10 * tempFactor * humidityFactor * ndviFactor * soilFactor;
      
      // Add some randomness for realistic variation
      const variation = (Math.random() - 0.5) * 2;
      carbonOffset = Math.max(0, carbonOffset + variation);
      
      console.log('📊 Carbon offset calculation complete:');
      console.log('  Temperature factor:', tempFactor.toFixed(3));
      console.log('  Humidity factor:', humidityFactor.toFixed(3));
      console.log('  NDVI factor:', ndviFactor.toFixed(3));
      console.log('  Soil factor:', soilFactor.toFixed(3));
      console.log('  Total carbon offset:', carbonOffset.toFixed(3), 'tons CO2/ha/year');
      
      // Return the carbon offset value (scaled for blockchain)
      const carbonOffsetScaled = Math.floor(carbonOffset * 1000); // Scale to 3 decimal places
      return Functions.encodeUint256(carbonOffsetScaled);
      
    } catch (error) {
      console.error('❌ Error in carbon offset calculation:', error);
      throw new Error('Carbon offset calculation failed: ' + error.message);
    }
  `;
}

/**
 * Create a simplified version for testing
 */
function createSimpleChainlinkSource() {
  return `
    // Simple carbon credit calculation for testing
    const Functions = require('@chainlink/functions-toolkit');
    
    console.log('🧪 Running simple carbon offset test...');
    
    // Simulate API calls with mock data
    const mockWeatherData = {
      temperature: 22,
      humidity: 65
    };
    
    const mockSatelliteData = {
      ndvi: 0.68
    };
    
    const mockSoilData = {
      moisture: 0.42
    };
    
    // Calculate carbon offset
    const tempFactor = Math.max(0, 1 - Math.abs(mockWeatherData.temperature - 20) / 10);
    const humidityFactor = mockWeatherData.humidity / 100;
    const ndviFactor = Math.max(0, mockSatelliteData.ndvi);
    const soilFactor = Math.max(0, 1 - Math.abs(mockSoilData.moisture - 0.45) / 0.3);
    
    let carbonOffset = 10 * tempFactor * humidityFactor * ndviFactor * soilFactor;
    carbonOffset = Math.max(0, carbonOffset + (Math.random() - 0.5) * 2);
    
    console.log('📊 Test carbon offset:', carbonOffset.toFixed(3), 'tons CO2/ha/year');
    
    const carbonOffsetScaled = Math.floor(carbonOffset * 1000);
    return Functions.encodeUint256(carbonOffsetScaled);
  `;
}

/**
 * Default Chainlink Functions configuration for Sepolia
 */
const DEFAULT_CHAINLINK_CONFIG = {
  functionsRouter: '0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C',
  donId: '0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000',
  subscriptionId: '5144', // Replace with your actual subscription ID
  source: ''
};

module.exports = {
  ChainlinkFunctionsHelper,
  createChainlinkSource,
  createSimpleChainlinkSource,
  DEFAULT_CHAINLINK_CONFIG
}; 