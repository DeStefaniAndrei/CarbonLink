require('dotenv').config();
const { DataSourceManager } = require('../lib/data-sources');
const { configManager } = require('../lib/config');

async function testDataAccuracy() {
    console.log('🌍 Testing Data Accuracy Across Different Geographic Locations\n');

    const dataSourceManager = new DataSourceManager(configManager.getDataSourceConfig());
    
    // Test locations with distinct environmental characteristics
    const testLocations = [
        {
            name: "Amazon Rainforest (Brazil)",
            coordinates: { lat: -3.4653, lng: -58.3801 },
            expected: {
                ndvi: "Very high (0.7-0.9)",
                canopyCover: "Very high (80-95%)",
                soilMoisture: "High (0.7-0.9)",
                temperature: "Warm (25-30°C)"
            },
            reason: "Dense tropical rainforest with high biodiversity and moisture"
        },
        {
            name: "Sahara Desert (Algeria)",
            coordinates: { lat: 26.8206, lng: 30.8025 },
            expected: {
                ndvi: "Very low (0.1-0.3)",
                canopyCover: "Very low (0-10%)",
                soilMoisture: "Very low (0.1-0.3)",
                temperature: "Hot (30-40°C)"
            },
            reason: "Arid desert with minimal vegetation and extreme heat"
        },
        {
            name: "Boreal Forest (Canada)",
            coordinates: { lat: 55.1300, lng: -105.2551 },
            expected: {
                ndvi: "Medium-high (0.5-0.7)",
                canopyCover: "High (60-80%)",
                soilMoisture: "Medium (0.4-0.6)",
                temperature: "Cool (10-20°C)"
            },
            reason: "Northern coniferous forest with cold climate"
        },
        {
            name: "Tropical Savanna (Kenya)",
            coordinates: { lat: -1.2921, lng: 36.8219 },
            expected: {
                ndvi: "Medium (0.4-0.6)",
                canopyCover: "Medium (30-50%)",
                soilMoisture: "Medium-low (0.3-0.5)",
                temperature: "Warm (25-30°C)"
            },
            reason: "Grassland with scattered trees, seasonal rainfall"
        },
        {
            name: "Temperate Forest (Germany)",
            coordinates: { lat: 51.1657, lng: 10.4515 },
            expected: {
                ndvi: "Medium-high (0.5-0.7)",
                canopyCover: "High (50-70%)",
                soilMoisture: "Medium (0.4-0.6)",
                temperature: "Moderate (15-25°C)"
            },
            reason: "Deciduous forest with moderate climate"
        }
    ];

    const results = [];

    for (const location of testLocations) {
        console.log(`\n📍 Testing: ${location.name}`);
        console.log(`   Expected: ${location.reason}`);
        console.log(`   Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}`);
        
        try {
            // Fetch all data types
            const [weatherData, satelliteData, soilData] = await Promise.all([
                dataSourceManager.fetchWeatherData(location.coordinates),
                dataSourceManager.fetchSatelliteData(location.coordinates),
                dataSourceManager.fetchSoilData(location.coordinates)
            ]);

            const result = {
                location: location.name,
                coordinates: location.coordinates,
                expected: location.expected,
                actual: {
                    weather: {
                        temperature: weatherData.temperature.toFixed(1) + '°C',
                        humidity: (weatherData.humidity * 100).toFixed(1) + '%',
                        rainfall: weatherData.rainfall.toFixed(1) + 'mm'
                    },
                    satellite: {
                        ndvi: satelliteData.ndvi.toFixed(3),
                        canopyCover: satelliteData.canopyCover.toFixed(1) + '%',
                        forestHealth: (satelliteData.forestHealth * 100).toFixed(1) + '%',
                        source: satelliteData.source
                    },
                    soil: {
                        moisture: (soilData.moisture * 100).toFixed(1) + '%',
                        temperature: soilData.temperature.toFixed(1) + '°C',
                        organicCarbon: soilData.organicCarbon.toFixed(1) + '%',
                        source: soilData.source
                    }
                }
            };

            results.push(result);

            // Display results
            console.log(`   ✅ Weather: ${result.actual.weather.temperature}, ${result.actual.weather.humidity} humidity`);
            console.log(`   ✅ Satellite: NDVI ${result.actual.satellite.ndvi}, Canopy ${result.actual.satellite.canopyCover} (${result.actual.satellite.source})`);
            console.log(`   ✅ Soil: ${result.actual.soil.moisture} moisture, ${result.actual.soil.temperature} (${result.actual.soil.source})`);

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            results.push({
                location: location.name,
                error: error.message
            });
        }
    }

    // Analysis
    console.log('\n' + '='.repeat(80));
    console.log('📊 ACCURACY ANALYSIS');
    console.log('='.repeat(80));

    for (const result of results) {
        if (result.error) {
            console.log(`\n❌ ${result.location}: ${result.error}`);
            continue;
        }

        console.log(`\n📍 ${result.location}:`);
        
        // Analyze NDVI accuracy
        const ndvi = parseFloat(result.actual.satellite.ndvi);
        const expectedNDVI = result.expected.ndvi;
        let ndviAccuracy = '❓';
        
        if (expectedNDVI.includes('Very high') && ndvi > 0.7) ndviAccuracy = '✅';
        else if (expectedNDVI.includes('high') && ndvi > 0.5) ndviAccuracy = '✅';
        else if (expectedNDVI.includes('Medium') && ndvi > 0.3 && ndvi < 0.7) ndviAccuracy = '✅';
        else if (expectedNDVI.includes('low') && ndvi < 0.5) ndviAccuracy = '✅';
        else if (expectedNDVI.includes('Very low') && ndvi < 0.3) ndviAccuracy = '✅';
        else ndviAccuracy = '❌';

        // Analyze temperature accuracy
        const temp = parseFloat(result.actual.weather.temperature);
        const expectedTemp = result.expected.temperature;
        let tempAccuracy = '❓';
        
        if (expectedTemp.includes('Hot') && temp > 30) tempAccuracy = '✅';
        else if (expectedTemp.includes('Warm') && temp > 20 && temp < 35) tempAccuracy = '✅';
        else if (expectedTemp.includes('Moderate') && temp > 10 && temp < 25) tempAccuracy = '✅';
        else if (expectedTemp.includes('Cool') && temp < 20) tempAccuracy = '✅';
        else tempAccuracy = '❌';

        // Analyze soil moisture accuracy
        const moisture = parseFloat(result.actual.soil.moisture) / 100;
        const expectedMoisture = result.expected.soilMoisture;
        let moistureAccuracy = '❓';
        
        if (expectedMoisture.includes('High') && moisture > 0.6) moistureAccuracy = '✅';
        else if (expectedMoisture.includes('Medium') && moisture > 0.3 && moisture < 0.7) moistureAccuracy = '✅';
        else if (expectedMoisture.includes('low') && moisture < 0.5) moistureAccuracy = '✅';
        else if (expectedMoisture.includes('Very low') && moisture < 0.3) moistureAccuracy = '✅';
        else moistureAccuracy = '❌';

        console.log(`   NDVI: ${result.actual.satellite.ndvi} (expected: ${expectedNDVI}) ${ndviAccuracy}`);
        console.log(`   Temperature: ${result.actual.weather.temperature} (expected: ${expectedTemp}) ${tempAccuracy}`);
        console.log(`   Soil Moisture: ${result.actual.soil.moisture} (expected: ${expectedMoisture}) ${moistureAccuracy}`);
        console.log(`   Data Sources: ${result.actual.satellite.source}, ${result.actual.soil.source}`);
    }

    // Overall assessment
    console.log('\n' + '='.repeat(80));
    console.log('🎯 OVERALL ASSESSMENT');
    console.log('='.repeat(80));
    
    const successfulTests = results.filter(r => !r.error).length;
    console.log(`✅ Successful API calls: ${successfulTests}/${testLocations.length}`);
    console.log(`🌍 Geographic diversity: High (5 different biomes tested)`);
    console.log(`📊 Data source variety: Sentinel Hub + Copernicus + OpenWeather`);
    
    if (successfulTests === testLocations.length) {
        console.log(`🎉 All APIs working across different geographic regions!`);
    } else {
        console.log(`⚠️  Some APIs failed in certain regions - may need fallback handling`);
    }
}

// Run the test
if (require.main === module) {
    testDataAccuracy();
}

module.exports = { testDataAccuracy }; 