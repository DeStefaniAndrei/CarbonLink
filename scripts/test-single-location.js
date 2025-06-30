require('dotenv').config();
const { configManager } = require('../lib/config');
const { DataSourceManager } = require('../lib/data-sources');

async function testSingleLocation() {
  try {
    console.log('🔍 Testing Single Location NDVI\n');

    const location = {
      lat: -3.4653,
      lng: -58.3801
    };

    const testDate = '2024-06-01T00:00:00Z';
    
    console.log(`📍 Location: ${location.lat}, ${location.lng} (Amazon Rainforest)`);
    console.log(`📅 Date: ${testDate}\n`);

    const dataManager = new DataSourceManager(configManager.getDataSourceConfig());

    console.log('1. Fetching satellite data...');
    const satelliteData = await dataManager.fetchSatelliteData(location, testDate, testDate);
    
    console.log('2. Raw satellite data response:');
    console.log(JSON.stringify(satelliteData, null, 2));

    if (satelliteData) {
      console.log('\n3. Extracted values:');
      console.log(`   ndvi: ${satelliteData.ndvi}`);
      console.log(`   ndviStart: ${satelliteData.ndviStart}`);
      console.log(`   ndviEnd: ${satelliteData.ndviEnd}`);
      console.log(`   hasCarbonOffsetData: ${satelliteData.hasCarbonOffsetData}`);
      console.log(`   source: ${satelliteData.source}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
  }
}

testSingleLocation(); 