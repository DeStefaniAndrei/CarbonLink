require('dotenv').config();
const { DataSourceManager } = require('../lib/data-sources');
const { configManager } = require('../lib/config');

async function testSpecificDates() {
    console.log('📅 Testing API Data for Specific Dates (No Time Range Averaging)\n');

    const dataSourceManager = new DataSourceManager(configManager.getDataSourceConfig());
    
    // Test locations
    const testLocations = [
        { name: "Amazon Rainforest", lat: -3.4653, lng: -58.3801 },
        { name: "Sahara Desert", lat: 26.8206, lng: 30.8025 },
        { name: "Boreal Forest", lat: 55.1300, lng: -105.2551 }
    ];

    // Define specific dates
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    // Format dates for API requests
    const todayStr = today.toISOString().split('T')[0];
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
    
    console.log(`📅 Testing Dates:`);
    console.log(`   Recent: ${todayStr} (today)`);
    console.log(`   Historical: ${oneYearAgoStr} (exactly 1 year ago)\n`);

    for (const location of testLocations) {
        console.log(`📍 ${location.name} (${location.lat}, ${location.lng})`);
        console.log('='.repeat(60));

        // Test recent data
        console.log(`\n🕐 RECENT DATA (${todayStr}):`);
        try {
            const [weatherRecent, satelliteRecent, soilRecent] = await Promise.all([
                dataSourceManager.fetchWeatherData(location),
                dataSourceManager.fetchSatelliteData(location, todayStr),
                dataSourceManager.fetchSoilData(location, todayStr)
            ]);

            console.log(`   🌡️  Weather: ${weatherRecent.temperature.toFixed(1)}°C, ${(weatherRecent.humidity * 100).toFixed(1)}% humidity`);
            console.log(`   🛰️  Satellite: NDVI ${satelliteRecent.ndvi.toFixed(3)}, Canopy ${satelliteRecent.canopyCover.toFixed(1)}% (${satelliteRecent.source})`);
            console.log(`   🌱 Soil: ${(soilRecent.moisture * 100).toFixed(1)}% moisture, ${soilRecent.temperature.toFixed(1)}°C (${soilRecent.source})`);

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        // Test historical data
        console.log(`\n🕐 HISTORICAL DATA (${oneYearAgoStr}):`);
        try {
            const [weatherHistorical, satelliteHistorical, soilHistorical] = await Promise.all([
                dataSourceManager.fetchWeatherData(location),
                dataSourceManager.fetchSatelliteData(location, oneYearAgoStr),
                dataSourceManager.fetchSoilData(location, oneYearAgoStr)
            ]);

            console.log(`   🌡️  Weather: ${weatherHistorical.temperature.toFixed(1)}°C, ${(weatherHistorical.humidity * 100).toFixed(1)}% humidity`);
            console.log(`   🛰️  Satellite: NDVI ${satelliteHistorical.ndvi.toFixed(3)}, Canopy ${satelliteHistorical.canopyCover.toFixed(1)}% (${satelliteHistorical.source})`);
            console.log(`   🌱 Soil: ${(soilHistorical.moisture * 100).toFixed(1)}% moisture, ${soilHistorical.temperature.toFixed(1)}°C (${soilHistorical.source})`);

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log('\n' + '─'.repeat(60));
    }

    // Now let's test with modified Sentinel Hub request (no time range averaging)
    console.log('\n🔧 TESTING MODIFIED SENTINEL HUB REQUESTS');
    console.log('='.repeat(60));

    const testLocation = testLocations[0]; // Amazon Rainforest
    
    console.log(`\n📍 Testing ${testLocation.name} with specific date requests:`);
    
    // Test with single date instead of time range
    const singleDateRequests = [
        { date: todayStr, label: "Today" },
        { date: oneYearAgoStr, label: "One Year Ago" },
        { date: "2024-06-15", label: "Mid-June 2024" },
        { date: "2023-06-15", label: "Mid-June 2023" }
    ];

    for (const request of singleDateRequests) {
        console.log(`\n📅 ${request.label} (${request.date}):`);
        try {
            const satelliteData = await dataSourceManager.fetchSatelliteData(testLocation, request.date);
            console.log(`   🛰️  NDVI: ${satelliteData.ndvi.toFixed(3)}`);
            console.log(`   🛰️  Canopy: ${satelliteData.canopyCover.toFixed(1)}%`);
            console.log(`   🛰️  Source: ${satelliteData.source}`);
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }

    // Test with different polygon sizes
    console.log('\n🔧 TESTING DIFFERENT POLYGON SIZES');
    console.log('='.repeat(60));

    const polygonSizes = [
        { delta: 0.0001, label: "Very Small (0.0001°)" },
        { delta: 0.001, label: "Small (0.001°)" },
        { delta: 0.01, label: "Medium (0.01°)" },
        { delta: 0.1, label: "Large (0.1°)" }
    ];

    for (const size of polygonSizes) {
        console.log(`\n📐 ${size.label}:`);
        try {
            // We'll need to modify the data source to accept polygon size
            // For now, let's just show what we would test
            console.log(`   Would test with polygon delta: ${size.delta} degrees`);
            console.log(`   This creates a ~${(size.delta * 111000).toFixed(0)}m x ${(size.delta * 111000).toFixed(0)}m area`);
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 ANALYSIS');
    console.log('='.repeat(60));
    console.log('1. If NDVI values are still uniform across dates, the issue is likely:');
    console.log('   • Evalscript configuration');
    console.log('   • Polygon size too small');
    console.log('   • Sentinel Hub API limitations');
    console.log('');
    console.log('2. If NDVI values vary by date, the issue was time range averaging');
    console.log('');
    console.log('3. If soil moisture is still uniform, Copernicus data is regional averages');
    console.log('');
    console.log('4. Weather data should be consistent (real-time)');
}

// Run the test
if (require.main === module) {
    testSpecificDates();
}

module.exports = { testSpecificDates }; 