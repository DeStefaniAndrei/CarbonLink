require('dotenv').config();
const { configManager } = require('../lib/config');
const { DataSourceManager } = require('../lib/data-sources');

// Test locations with known environmental characteristics
const testLocations = [
  {
    name: "Amazon Rainforest (Dense Forest)",
    lat: -3.4653,
    lng: -58.3801,
    expectedNDVI: "0.7-0.9", // High NDVI for dense tropical forest
    description: "Dense tropical rainforest, should have very high NDVI"
  },
  {
    name: "Sahara Desert (Arid)",
    lat: 25.7617,
    lng: -0.1918,
    expectedNDVI: "0.0-0.2", // Very low NDVI for desert
    description: "Arid desert, should have very low NDVI"
  },
  {
    name: "Boreal Forest (Taiga)",
    lat: 64.8255,
    lng: -147.6444,
    expectedNDVI: "0.4-0.7", // Moderate NDVI for boreal forest
    description: "Boreal forest in Alaska, should have moderate NDVI"
  },
  {
    name: "Tropical Savanna",
    lat: -1.2921,
    lng: 36.8219,
    expectedNDVI: "0.3-0.6", // Moderate NDVI for savanna
    description: "Tropical savanna in Kenya, should have moderate NDVI"
  },
  {
    name: "Temperate Forest",
    lat: 40.7128,
    lng: -74.0060,
    expectedNDVI: "0.5-0.8", // High NDVI for temperate forest
    description: "Temperate forest near NYC, should have high NDVI"
  }
];

async function validateAPIAccuracy() {
  try {
    console.log('🔍 CarbonLink API Accuracy Validation\n');
    console.log('Comparing Sentinel Hub API results with known environmental characteristics...\n');

    const dataManager = new DataSourceManager(configManager.getDataSourceConfig());
    const startDate = '2024-06-01T00:00:00Z';
    const endDate = '2024-06-30T00:00:00Z'; // Use a broader date range

    let totalTests = 0;
    let accurateTests = 0;
    let results = [];

    for (const location of testLocations) {
      console.log(`📍 Testing: ${location.name}`);
      console.log(`   Location: ${location.lat}, ${location.lng}`);
      console.log(`   Expected NDVI: ${location.expectedNDVI}`);
      console.log(`   Description: ${location.description}`);

      try {
        // Fetch NDVI data for this location with date range
        const satelliteData = await dataManager.fetchSatelliteData(location, startDate, endDate);
        
        if (satelliteData && satelliteData.ndviEnd !== null) {
          const actualNDVI = satelliteData.ndviEnd;
          const [minExpected, maxExpected] = location.expectedNDVI.split('-').map(Number);
          
          // Check if NDVI is within expected range
          const isAccurate = actualNDVI >= minExpected && actualNDVI <= maxExpected;
          const accuracy = isAccurate ? '✅ ACCURATE' : '❌ INACCURATE';
          
          console.log(`   Actual NDVI: ${actualNDVI.toFixed(4)}`);
          console.log(`   Result: ${accuracy}`);
          console.log(`   Source: ${satelliteData.source}\n`);

          results.push({
            location: location.name,
            expected: location.expectedNDVI,
            actual: actualNDVI.toFixed(4),
            accurate: isAccurate,
            description: location.description
          });

          totalTests++;
          if (isAccurate) accurateTests++;
        } else {
          console.log(`   ❌ No NDVI data available\n`);
          results.push({
            location: location.name,
            expected: location.expectedNDVI,
            actual: 'No data',
            accurate: false,
            description: location.description
          });
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        results.push({
          location: location.name,
          expected: location.expectedNDVI,
          actual: 'Error',
          accurate: false,
          description: location.description
        });
      }

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Summary
    console.log('📊 API Accuracy Summary:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Accurate Results: ${accurateTests}`);
    console.log(`   Accuracy Rate: ${totalTests > 0 ? ((accurateTests / totalTests) * 100).toFixed(1) : 0}%\n`);

    console.log('📋 Detailed Results:');
    results.forEach(result => {
      const status = result.accurate ? '✅' : '❌';
      console.log(`   ${status} ${result.location}: Expected ${result.expected}, Got ${result.actual}`);
    });

    // Analysis
    console.log('\n🔍 Analysis:');
    if (accurateTests / totalTests >= 0.8) {
      console.log('   ✅ API shows good accuracy compared to environmental expectations');
    } else if (accurateTests / totalTests >= 0.6) {
      console.log('   ⚠️  API shows moderate accuracy - some results may need investigation');
    } else {
      console.log('   ❌ API shows poor accuracy - may indicate data quality issues');
    }

    // Check for patterns
    const uniformValues = results.filter(r => r.actual !== 'No data' && r.actual !== 'Error');
    const uniqueValues = [...new Set(uniformValues.map(r => r.actual))];
    
    if (uniqueValues.length <= 2) {
      console.log('   ⚠️  Warning: Very few unique NDVI values detected - may indicate data averaging or processing issues');
    }

    console.log('\n🎉 Validation Complete!');

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

validateAPIAccuracy(); 