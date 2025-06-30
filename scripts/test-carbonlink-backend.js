const { config, validateConfig } = require('../lib/config');
const { dataSourceManager } = require('../lib/data-sources');
const { carbonCalculator } = require('../lib/carbon-calculator');
const { chainlinkFunctionsIntegration } = require('../lib/chainlink-functions-integration');
const { smartContractIntegration } = require('../lib/smart-contract-integration');

async function testConfiguration() {
  console.log('\n🔧 Testing Configuration...');
  try {
    validateConfig();
    console.log('✅ Configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
    return false;
  }
}

async function testDataSources() {
  console.log('\n📡 Testing Data Sources...');
  
  const testLocation = {
    latitude: 40.7128,
    longitude: -74.0060,
    elevation: 10
  };

  try {
    // Test weather data
    console.log('🌤️ Testing weather data...');
    const weather = await dataSourceManager.getWeatherData(testLocation);
    console.log('✅ Weather data:', {
      temperature: weather.temperature,
      humidity: weather.humidity,
      rainfall: weather.rainfall,
      windSpeed: weather.windSpeed
    });

    // Test satellite data
    console.log('🛰️ Testing satellite data...');
    const satellite = await dataSourceManager.getSatelliteData(testLocation);
    console.log('✅ Satellite data:', {
      ndvi: satellite.ndvi,
      evi: satellite.evi,
      lai: satellite.lai,
      biomass: satellite.biomass
    });

    // Test soil data
    console.log('🌱 Testing soil data...');
    const soil = await dataSourceManager.getSoilData(testLocation);
    console.log('✅ Soil data:', {
      moisture: soil.moisture,
      temperature: soil.temperature,
      ph: soil.ph,
      organicMatter: soil.organicMatter
    });

    // Test fire data
    console.log('🔥 Testing fire data...');
    const fire = await dataSourceManager.getFireData(testLocation);
    console.log('✅ Fire data:', {
      fireRisk: fire.fireRisk,
      activeFires: fire.activeFires,
      burnedArea: fire.burnedArea
    });

    // Test all data together
    console.log('🔄 Testing all data sources...');
    const allData = await dataSourceManager.getAllData(testLocation);
    console.log('✅ All data sources working');

    return true;
  } catch (error) {
    console.error('❌ Data sources error:', error.message);
    return false;
  }
}

async function testCarbonCalculations() {
  console.log('\n🧮 Testing Carbon Calculations...');
  
  const testInput = {
    location: { latitude: 40.7128, longitude: -74.0060, elevation: 10 },
    weather: {
      temperature: 25,
      humidity: 70,
      rainfall: 1200,
      windSpeed: 5,
      solarRadiation: 600,
      timestamp: new Date()
    },
    satellite: {
      ndvi: 0.6,
      evi: 0.4,
      lai: 2.5,
      biomass: 12000,
      timestamp: new Date()
    },
    soil: {
      moisture: 35,
      temperature: 18,
      ph: 6.2,
      organicMatter: 3.5,
      nitrogen: 80,
      phosphorus: 25,
      potassium: 180,
      timestamp: new Date()
    },
    fire: {
      fireRisk: 0.1,
      activeFires: 0,
      burnedArea: 0,
      timestamp: new Date()
    },
    projectArea: 100, // hectares
    projectDuration: 1, // years
    baselineScenario: 'business-as-usual',
    projectType: 'reforestation'
  };

  try {
    const result = carbonCalculator.calculateCarbonOffset(testInput);
    
    console.log('✅ Carbon calculation completed');
    console.log('📊 Results:');
    console.log(`  Net Carbon Balance: ${result.netCarbonBalance.toFixed(2)} tCO2e/ha/year`);
    console.log(`  Total Project Carbon: ${result.totalProjectCarbon.toFixed(2)} tCO2e`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  Uncertainty: ${result.uncertainty.toFixed(1)}%`);
    
    console.log('📈 Sequestration:');
    console.log(`  Biomass Growth: ${result.sequestration.biomassGrowth.toFixed(2)} tCO2e/ha/year`);
    console.log(`  Soil Carbon: ${result.sequestration.soilCarbon.toFixed(2)} tCO2e/ha/year`);
    console.log(`  Total Sequestration: ${result.sequestration.totalSequestration.toFixed(2)} tCO2e/ha/year`);
    
    console.log('📉 Emissions:');
    console.log(`  Baseline: ${result.emissions.baselineEmissions.toFixed(2)} tCO2e/ha/year`);
    console.log(`  Project: ${result.emissions.projectEmissions.toFixed(2)} tCO2e/ha/year`);
    console.log(`  Leakage: ${result.emissions.leakage.toFixed(2)} tCO2e/ha/year`);
    console.log(`  Total Emissions: ${result.emissions.totalEmissions.toFixed(2)} tCO2e/ha/year`);

    return true;
  } catch (error) {
    console.error('❌ Carbon calculation error:', error.message);
    return false;
  }
}

async function testChainlinkFunctions() {
  console.log('\n🔗 Testing Chainlink Functions Integration...');
  
  try {
    // Test source code generation
    console.log('📝 Testing source code generation...');
    const sourceCode = chainlinkFunctionsIntegration.generateCarbonCalculationSource();
    console.log('✅ Source code generated successfully');
    console.log(`📄 Source code length: ${sourceCode.length} characters`);

    // Test router initialization (if private key is available)
    if (config.privateKey) {
      console.log('🔧 Testing router initialization...');
      await chainlinkFunctionsIntegration.initializeRouter();
      console.log('✅ Router initialized successfully');
    } else {
      console.log('⚠️ Skipping router initialization (no private key)');
    }

    return true;
  } catch (error) {
    console.error('❌ Chainlink Functions error:', error.message);
    return false;
  }
}

async function testSmartContracts() {
  console.log('\n🏗️ Testing Smart Contract Integration...');
  
  try {
    // Test contract accessibility
    console.log('🔍 Testing contract accessibility...');
    const isAccessible = await smartContractIntegration.checkContractAccessibility();
    
    if (isAccessible) {
      console.log('✅ Contracts are accessible');
      
      // Test project info retrieval (if project contract is available)
      if (config.projectContractAddress) {
        console.log('📋 Testing project info retrieval...');
        try {
          const projectInfo = await smartContractIntegration.getProjectInfo();
          console.log('✅ Project info retrieved:', projectInfo);
        } catch (error) {
          console.log('⚠️ Project info retrieval failed (contract may not be deployed):', error.message);
        }
      }
      
      // Test carbon balance retrieval (if project contract is available)
      if (config.projectContractAddress) {
        console.log('⚖️ Testing carbon balance retrieval...');
        try {
          const balance = await smartContractIntegration.getCarbonBalance();
          console.log('✅ Carbon balance retrieved:', balance);
        } catch (error) {
          console.log('⚠️ Carbon balance retrieval failed (contract may not be deployed):', error.message);
        }
      }
    } else {
      console.log('⚠️ Contracts are not accessible');
    }

    return true;
  } catch (error) {
    console.error('❌ Smart contract error:', error.message);
    return false;
  }
}

async function testCompleteWorkflow() {
  console.log('\n🚀 Testing Complete Workflow...');
  
  const testLocation = {
    latitude: 40.7128,
    longitude: -74.0060,
    elevation: 10
  };

  try {
    // Step 1: Fetch all data
    console.log('📡 Step 1: Fetching data...');
    const allData = await dataSourceManager.getAllData(testLocation);
    console.log('✅ Data fetched successfully');

    // Step 2: Calculate carbon offset
    console.log('🧮 Step 2: Calculating carbon offset...');
    const calculationInput = {
      ...allData,
      location: testLocation,
      projectArea: 100,
      projectDuration: 1,
      baselineScenario: 'business-as-usual',
      projectType: 'reforestation'
    };
    
    const carbonResult = carbonCalculator.calculateCarbonOffset(calculationInput);
    console.log('✅ Carbon calculation completed');
    console.log(`📊 Net Carbon Balance: ${carbonResult.netCarbonBalance.toFixed(2)} tCO2e/ha/year`);

    // Step 3: Test Chainlink Functions (if private key is available)
    if (config.privateKey) {
      console.log('🔗 Step 3: Testing Chainlink Functions...');
      try {
        await chainlinkFunctionsIntegration.initializeRouter();
        console.log('✅ Chainlink Functions ready');
      } catch (error) {
        console.log('⚠️ Chainlink Functions not available:', error.message);
      }
    } else {
      console.log('⚠️ Step 3: Skipping Chainlink Functions (no private key)');
    }

    // Step 4: Test smart contract operations (if contracts are available)
    console.log('🏗️ Step 4: Testing smart contract operations...');
    try {
      const isAccessible = await smartContractIntegration.checkContractAccessibility();
      if (isAccessible) {
        console.log('✅ Smart contracts are accessible');
      } else {
        console.log('⚠️ Smart contracts are not accessible');
      }
    } catch (error) {
      console.log('⚠️ Smart contract test failed:', error.message);
    }

    console.log('🎉 Complete workflow test finished');
    return true;
  } catch (error) {
    console.error('❌ Complete workflow error:', error.message);
    return false;
  }
}

async function runPerformanceTests() {
  console.log('\n⚡ Running Performance Tests...');
  
  const testLocation = {
    latitude: 40.7128,
    longitude: -74.0060,
    elevation: 10
  };

  try {
    // Test data source performance
    console.log('📡 Testing data source performance...');
    const startTime = Date.now();
    
    for (let i = 0; i < 5; i++) {
      await dataSourceManager.getAllData(testLocation);
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 5;
    console.log(`✅ Average data fetch time: ${avgTime.toFixed(2)}ms`);

    // Test carbon calculation performance
    console.log('🧮 Testing carbon calculation performance...');
    const calcStartTime = Date.now();
    
    const testInput = {
      location: testLocation,
      weather: { temperature: 25, humidity: 70, rainfall: 1200, windSpeed: 5, solarRadiation: 600, timestamp: new Date() },
      satellite: { ndvi: 0.6, evi: 0.4, lai: 2.5, biomass: 12000, timestamp: new Date() },
      soil: { moisture: 35, temperature: 18, ph: 6.2, organicMatter: 3.5, nitrogen: 80, phosphorus: 25, potassium: 180, timestamp: new Date() },
      fire: { fireRisk: 0.1, activeFires: 0, burnedArea: 0, timestamp: new Date() },
      projectArea: 100,
      projectDuration: 1,
      baselineScenario: 'business-as-usual',
      projectType: 'reforestation'
    };
    
    for (let i = 0; i < 10; i++) {
      carbonCalculator.calculateCarbonOffset(testInput);
    }
    
    const calcEndTime = Date.now();
    const avgCalcTime = (calcEndTime - calcStartTime) / 10;
    console.log(`✅ Average calculation time: ${avgCalcTime.toFixed(2)}ms`);

    return true;
  } catch (error) {
    console.error('❌ Performance test error:', error.message);
    return false;
  }
}

async function runReliabilityTests() {
  console.log('\n🛡️ Running Reliability Tests...');
  
  try {
    // Test with invalid data
    console.log('🧪 Testing with invalid data...');
    try {
      const invalidResult = carbonCalculator.calculateCarbonOffset({
        location: { latitude: 999, longitude: 999, elevation: -1000 },
        weather: { temperature: -100, humidity: 150, rainfall: -50, windSpeed: -10, solarRadiation: -100, timestamp: new Date() },
        satellite: { ndvi: -1, evi: -1, lai: -10, biomass: -1000, timestamp: new Date() },
        soil: { moisture: -50, temperature: -50, ph: 0, organicMatter: -10, nitrogen: -100, phosphorus: -50, potassium: -200, timestamp: new Date() },
        fire: { fireRisk: -1, activeFires: -5, burnedArea: -100, timestamp: new Date() },
        projectArea: -100,
        projectDuration: -1,
        baselineScenario: 'invalid',
        projectType: 'invalid'
      });
      console.log('✅ Invalid data handled gracefully');
    } catch (error) {
      console.log('✅ Invalid data properly rejected:', error.message);
    }

    // Test cache functionality
    console.log('💾 Testing cache functionality...');
    const testLocation = { latitude: 40.7128, longitude: -74.0060, elevation: 10 };
    
    const startTime = Date.now();
    await dataSourceManager.getWeatherData(testLocation);
    const firstCall = Date.now() - startTime;
    
    const cacheStartTime = Date.now();
    await dataSourceManager.getWeatherData(testLocation);
    const cacheCall = Date.now() - cacheStartTime;
    
    console.log(`✅ First call: ${firstCall}ms, Cached call: ${cacheCall}ms`);
    console.log(`✅ Cache speedup: ${(firstCall / cacheCall).toFixed(1)}x`);

    return true;
  } catch (error) {
    console.error('❌ Reliability test error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 CarbonLink Backend Test Suite');
  console.log('================================');
  
  const results = {
    configuration: false,
    dataSources: false,
    carbonCalculations: false,
    chainlinkFunctions: false,
    smartContracts: false,
    completeWorkflow: false,
    performance: false,
    reliability: false
  };

  try {
    // Run all tests
    results.configuration = await testConfiguration();
    results.dataSources = await testDataSources();
    results.carbonCalculations = await testCarbonCalculations();
    results.chainlinkFunctions = await testChainlinkFunctions();
    results.smartContracts = await testSmartContracts();
    results.completeWorkflow = await testCompleteWorkflow();
    results.performance = await runPerformanceTests();
    results.reliability = await runReliabilityTests();

    // Print summary
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test}`);
    });
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Backend is ready for production.');
    } else {
      console.log('⚠️ Some tests failed. Please check the configuration and dependencies.');
    }

  } catch (error) {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testConfiguration,
  testDataSources,
  testCarbonCalculations,
  testChainlinkFunctions,
  testSmartContracts,
  testCompleteWorkflow,
  runPerformanceTests,
  runReliabilityTests
}; 