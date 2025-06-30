require('dotenv').config();
const { configManager } = require('../lib/config');
const { DataSourceManager } = require('../lib/data-sources');
const { CarbonCalculator } = require('../lib/carbon-calculator');

async function testCarbonOffset() {
  try {
    console.log('🌱 CarbonLink Carbon Offset Test\n');

    // Test project parameters
    const projectLocation = {
      lat: -3.4653, // Amazon Rainforest
      lng: -58.3801
    };

    const projectArea = 100; // hectares
    const projectStartDate = '2023-01-01T00:00:00Z'; // Project began on Jan 1, 2023
    const currentDate = '2024-06-01T00:00:00Z'; // Current assessment date

    console.log('📋 Project Parameters:');
    console.log(`   Location: ${projectLocation.lat}, ${projectLocation.lng} (Amazon Rainforest)`);
    console.log(`   Project Area: ${projectArea} hectares`);
    console.log(`   Project Start: ${projectStartDate}`);
    console.log(`   Assessment Date: ${currentDate}`);
    console.log(`   Time Period: ${Math.round((new Date(currentDate) - new Date(projectStartDate)) / (1000 * 60 * 60 * 24))} days\n`);

    // Initialize data sources
    const dataManager = new DataSourceManager(configManager.getDataSourceConfig());

    console.log('1. 📡 Fetching NDVI Data for Carbon Offset Calculation...');
    
    // Fetch satellite data for the date range
    const satelliteData = await dataManager.fetchSatelliteData(
      projectLocation, 
      projectStartDate, 
      currentDate
    );

    console.log('✅ Satellite data fetched successfully');
    console.log(`   NDVI at project start: ${satelliteData.ndviStart?.toFixed(4) || 'N/A'}`);
    console.log(`   NDVI at current date: ${satelliteData.ndviEnd?.toFixed(4) || 'N/A'}`);
    console.log(`   NDVI change: ${satelliteData.ndviEnd && satelliteData.ndviStart ? (satelliteData.ndviEnd - satelliteData.ndviStart).toFixed(4) : 'N/A'}`);
    console.log(`   Has carbon offset data: ${satelliteData.hasCarbonOffsetData}\n`);

    if (!satelliteData.hasCarbonOffsetData) {
      console.log('❌ Cannot calculate carbon offset - missing start or end NDVI data');
      return;
    }

    console.log('2. 🌱 Fetching Supporting Data...');
    
    // Fetch weather and soil data for confidence calculation
    const weatherData = await dataManager.fetchWeatherData(projectLocation);
    const soilData = await dataManager.fetchSoilData(projectLocation);

    console.log('✅ Supporting data fetched successfully');
    console.log(`   Weather: ${weatherData.temperature.toFixed(1)}°C, ${(weatherData.humidity * 100).toFixed(1)}% humidity`);
    console.log(`   Soil: ${(soilData.moisture * 100).toFixed(1)}% moisture, ${soilData.temperature.toFixed(1)}°C\n`);

    console.log('3. 🧮 Calculating Carbon Offset Credits...');

    // Prepare data for carbon calculation
    const carbonData = {
      ndvi: satelliteData.ndviEnd, // Current NDVI for backward compatibility
      ndviStart: satelliteData.ndviStart, // Baseline NDVI
      ndviEnd: satelliteData.ndviEnd, // Current NDVI
      projectArea: projectArea,
      weatherData: weatherData,
      satelliteData: {
        cloudCover: satelliteData.cloudCover,
        forestHealth: satelliteData.forestHealth
      },
      soilData: soilData,
      startDate: projectStartDate,
      endDate: currentDate
    };

    // Calculate carbon offset credits
    const carbonOffset = CarbonCalculator.calculateCarbonOffsetCredits(carbonData);

    console.log('✅ Carbon offset calculation completed\n');

    console.log('4. 📊 Carbon Offset Results:');
    console.log(`   Carbon Stock at Start: ${carbonOffset.carbonStockStart.toFixed(2)} tons C`);
    console.log(`   Carbon Stock at End: ${carbonOffset.carbonStockEnd.toFixed(2)} tons C`);
    console.log(`   Carbon Stock Change: ${carbonOffset.carbonStockChange.toFixed(2)} tons C`);
    console.log(`   CO2 Equivalent: ${carbonOffset.co2Equivalent.toFixed(2)} tons CO2`);
    console.log(`   Confidence Factor: ${carbonOffset.confidenceFactor.toFixed(3)}`);
    console.log(`   Uncertainty: ${carbonOffset.uncertainty.toFixed(1)}%\n`);

    console.log('5. 🔍 Detailed Breakdown:');
    console.log(`   Carbon Density at Start: ${carbonOffset.breakdown.carbonDensityStart.toFixed(2)} tons C/ha`);
    console.log(`   Carbon Density at End: ${carbonOffset.breakdown.carbonDensityEnd.toFixed(2)} tons C/ha`);
    console.log(`   NDVI Change: ${carbonOffset.breakdown.ndviChange.toFixed(4)}`);
    console.log(`   Project Area: ${carbonOffset.breakdown.projectArea} hectares`);
    console.log(`   CO2/Carbon Ratio: ${carbonOffset.breakdown.carbonToCO2Ratio.toFixed(2)}\n`);

    console.log('6. 💰 Carbon Credits Summary:');
    if (carbonOffset.co2Equivalent > 0) {
      console.log(`   ✅ Carbon credits can be minted: ${carbonOffset.co2Equivalent.toFixed(2)} tons CO2`);
      console.log(`   📈 This represents a ${((carbonOffset.carbonStockChange / carbonOffset.carbonStockStart) * 100).toFixed(1)}% increase in carbon stock`);
    } else {
      console.log(`   ❌ No carbon credits can be minted (negative or zero change)`);
      console.log(`   📉 Carbon stock ${carbonOffset.carbonStockChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(carbonOffset.carbonStockChange).toFixed(2)} tons C`);
    }

    console.log('\n🎉 Carbon Offset Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Carbon offset test failed:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
  }
}

testCarbonOffset(); 