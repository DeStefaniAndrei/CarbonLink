require('dotenv').config();
const { DataSourceManager } = require('../lib/data-sources');
const { configManager } = require('../lib/config');

// Reference data from scientific sources and public datasets
const referenceData = {
    "Amazon Rainforest (Brazil)": {
        coordinates: { lat: -3.4653, lng: -58.3801 },
        reference: {
            ndvi: { min: 0.7, max: 0.9, source: "NASA MODIS, 2023" },
            temperature: { min: 24, max: 30, source: "WorldClim, 2023" },
            soilMoisture: { min: 0.6, max: 0.9, source: "ESA CCI Soil Moisture, 2023" },
            canopyCover: { min: 80, max: 95, source: "Global Forest Watch, 2023" }
        },
        biome: "Tropical Rainforest",
        climate: "Af - Tropical rainforest climate"
    },
    "Sahara Desert (Algeria)": {
        coordinates: { lat: 26.8206, lng: 30.8025 },
        reference: {
            ndvi: { min: 0.1, max: 0.3, source: "NASA MODIS, 2023" },
            temperature: { min: 30, max: 40, source: "WorldClim, 2023" },
            soilMoisture: { min: 0.05, max: 0.2, source: "ESA CCI Soil Moisture, 2023" },
            canopyCover: { min: 0, max: 10, source: "Global Forest Watch, 2023" }
        },
        biome: "Desert",
        climate: "BWh - Hot desert climate"
    },
    "Boreal Forest (Canada)": {
        coordinates: { lat: 55.1300, lng: -105.2551 },
        reference: {
            ndvi: { min: 0.5, max: 0.7, source: "NASA MODIS, 2023" },
            temperature: { min: 8, max: 20, source: "WorldClim, 2023" },
            soilMoisture: { min: 0.4, max: 0.6, source: "ESA CCI Soil Moisture, 2023" },
            canopyCover: { min: 60, max: 80, source: "Global Forest Watch, 2023" }
        },
        biome: "Boreal Forest",
        climate: "Dfc - Subarctic climate"
    },
    "Tropical Savanna (Kenya)": {
        coordinates: { lat: -1.2921, lng: 36.8219 },
        reference: {
            ndvi: { min: 0.4, max: 0.6, source: "NASA MODIS, 2023" },
            temperature: { min: 22, max: 30, source: "WorldClim, 2023" },
            soilMoisture: { min: 0.3, max: 0.5, source: "ESA CCI Soil Moisture, 2023" },
            canopyCover: { min: 20, max: 50, source: "Global Forest Watch, 2023" }
        },
        biome: "Tropical Savanna",
        climate: "Aw - Tropical savanna climate"
    },
    "Temperate Forest (Germany)": {
        coordinates: { lat: 51.1657, lng: 10.4515 },
        reference: {
            ndvi: { min: 0.5, max: 0.7, source: "NASA MODIS, 2023" },
            temperature: { min: 12, max: 25, source: "WorldClim, 2023" },
            soilMoisture: { min: 0.4, max: 0.6, source: "ESA CCI Soil Moisture, 2023" },
            canopyCover: { min: 50, max: 70, source: "Global Forest Watch, 2023" }
        },
        biome: "Temperate Deciduous Forest",
        climate: "Cfb - Oceanic climate"
    }
};

async function validateWithPublicData() {
    console.log('🔬 Validating API Data Against Public Reference Data\n');
    console.log('📚 Reference Sources:');
    console.log('   • NASA MODIS NDVI (2023)');
    console.log('   • WorldClim Temperature Data (2023)');
    console.log('   • ESA CCI Soil Moisture (2023)');
    console.log('   • Global Forest Watch Canopy Cover (2023)\n');

    const dataSourceManager = new DataSourceManager(configManager.getDataSourceConfig());
    const results = [];

    for (const [locationName, locationData] of Object.entries(referenceData)) {
        console.log(`📍 Testing: ${locationName}`);
        console.log(`   Biome: ${locationData.biome} (${locationData.climate})`);
        console.log(`   Coordinates: ${locationData.coordinates.lat}, ${locationData.coordinates.lng}`);
        
        try {
            // Fetch API data
            const [weatherData, satelliteData, soilData] = await Promise.all([
                dataSourceManager.fetchWeatherData(locationData.coordinates),
                dataSourceManager.fetchSatelliteData(locationData.coordinates),
                dataSourceManager.fetchSoilData(locationData.coordinates)
            ]);

            const apiResult = {
                location: locationName,
                coordinates: locationData.coordinates,
                reference: locationData.reference,
                api: {
                    ndvi: satelliteData.ndvi,
                    temperature: weatherData.temperature,
                    soilMoisture: soilData.moisture,
                    canopyCover: satelliteData.canopyCover,
                    sources: {
                        satellite: satelliteData.source,
                        weather: 'OpenWeather API',
                        soil: soilData.source
                    }
                }
            };

            results.push(apiResult);

            // Display comparison
            console.log(`   📊 API Results vs Reference:`);
            console.log(`      NDVI: ${apiResult.api.ndvi.toFixed(3)} (ref: ${locationData.reference.ndvi.min}-${locationData.reference.ndvi.max})`);
            console.log(`      Temperature: ${apiResult.api.temperature.toFixed(1)}°C (ref: ${locationData.reference.temperature.min}-${locationData.reference.temperature.max}°C)`);
            console.log(`      Soil Moisture: ${(apiResult.api.soilMoisture * 100).toFixed(1)}% (ref: ${(locationData.reference.soilMoisture.min * 100).toFixed(0)}-${(locationData.reference.soilMoisture.max * 100).toFixed(0)}%)`);
            console.log(`      Canopy Cover: ${apiResult.api.canopyCover.toFixed(1)}% (ref: ${locationData.reference.canopyCover.min}-${locationData.reference.canopyCover.max}%)`);
            console.log(`      Data Sources: ${apiResult.api.sources.satellite}, ${apiResult.api.sources.soil}\n`);

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
            results.push({
                location: locationName,
                error: error.message
            });
        }
    }

    // Detailed analysis
    console.log('='.repeat(100));
    console.log('🔍 DETAILED ACCURACY ANALYSIS');
    console.log('='.repeat(100));

    let totalTests = 0;
    let passedTests = 0;
    const accuracyScores = [];

    for (const result of results) {
        if (result.error) {
            console.log(`\n❌ ${result.location}: ${result.error}`);
            continue;
        }

        console.log(`\n📍 ${result.location} (${result.reference.biome})`);
        console.log(`   Climate: ${result.reference.climate}`);
        
        let locationScore = 0;
        let locationTests = 0;

        // NDVI Validation
        const ndvi = result.api.ndvi;
        const ndviRef = result.reference.ndvi;
        const ndviInRange = ndvi >= ndviRef.min && ndvi <= ndviRef.max;
        const ndviAccuracy = ndviInRange ? '✅' : '❌';
        const ndviDeviation = Math.abs(ndvi - (ndviRef.min + ndviRef.max) / 2) / ((ndviRef.max - ndviRef.min) / 2);
        
        console.log(`   NDVI: ${ndvi.toFixed(3)} (ref: ${ndviRef.min}-${ndviRef.max}) ${ndviAccuracy}`);
        console.log(`      Deviation: ${(ndviDeviation * 100).toFixed(1)}% from expected range`);
        console.log(`      Source: ${result.reference.ndvi.source}`);
        
        if (ndviInRange) {
            locationScore++;
            passedTests++;
        }
        locationTests++;
        totalTests++;

        // Temperature Validation
        const temp = result.api.temperature;
        const tempRef = result.reference.temperature;
        const tempInRange = temp >= tempRef.min && temp <= tempRef.max;
        const tempAccuracy = tempInRange ? '✅' : '❌';
        const tempDeviation = Math.abs(temp - (tempRef.min + tempRef.max) / 2) / ((tempRef.max - tempRef.min) / 2);
        
        console.log(`   Temperature: ${temp.toFixed(1)}°C (ref: ${tempRef.min}-${tempRef.max}°C) ${tempAccuracy}`);
        console.log(`      Deviation: ${(tempDeviation * 100).toFixed(1)}% from expected range`);
        console.log(`      Source: ${result.reference.temperature.source}`);
        
        if (tempInRange) {
            locationScore++;
            passedTests++;
        }
        locationTests++;
        totalTests++;

        // Soil Moisture Validation
        const moisture = result.api.soilMoisture;
        const moistureRef = result.reference.soilMoisture;
        const moistureInRange = moisture >= moistureRef.min && moisture <= moistureRef.max;
        const moistureAccuracy = moistureInRange ? '✅' : '❌';
        const moistureDeviation = Math.abs(moisture - (moistureRef.min + moistureRef.max) / 2) / ((moistureRef.max - moistureRef.min) / 2);
        
        console.log(`   Soil Moisture: ${(moisture * 100).toFixed(1)}% (ref: ${(moistureRef.min * 100).toFixed(0)}-${(moistureRef.max * 100).toFixed(0)}%) ${moistureAccuracy}`);
        console.log(`      Deviation: ${(moistureDeviation * 100).toFixed(1)}% from expected range`);
        console.log(`      Source: ${result.reference.soilMoisture.source}`);
        
        if (moistureInRange) {
            locationScore++;
            passedTests++;
        }
        locationTests++;
        totalTests++;

        // Canopy Cover Validation
        const canopy = result.api.canopyCover;
        const canopyRef = result.reference.canopyCover;
        const canopyInRange = canopy >= canopyRef.min && canopy <= canopyRef.max;
        const canopyAccuracy = canopyInRange ? '✅' : '❌';
        const canopyDeviation = Math.abs(canopy - (canopyRef.min + canopyRef.max) / 2) / ((canopyRef.max - canopyRef.min) / 2);
        
        console.log(`   Canopy Cover: ${canopy.toFixed(1)}% (ref: ${canopyRef.min}-${canopyRef.max}%) ${canopyAccuracy}`);
        console.log(`      Deviation: ${(canopyDeviation * 100).toFixed(1)}% from expected range`);
        console.log(`      Source: ${result.reference.canopyCover.source}`);
        
        if (canopyInRange) {
            locationScore++;
            passedTests++;
        }
        locationTests++;
        totalTests++;

        const locationAccuracy = (locationScore / locationTests) * 100;
        accuracyScores.push({ location: result.location, accuracy: locationAccuracy });
        
        console.log(`   📈 Location Accuracy: ${locationAccuracy.toFixed(1)}% (${locationScore}/${locationTests} tests passed)`);
        console.log(`   🔗 API Sources: ${result.api.sources.satellite}, ${result.api.sources.soil}`);
    }

    // Overall assessment
    console.log('\n' + '='.repeat(100));
    console.log('🎯 OVERALL VALIDATION RESULTS');
    console.log('='.repeat(100));
    
    const overallAccuracy = (passedTests / totalTests) * 100;
    console.log(`📊 Overall Accuracy: ${overallAccuracy.toFixed(1)}% (${passedTests}/${totalTests} tests passed)`);
    
    console.log('\n📍 Location-by-Location Accuracy:');
    accuracyScores.sort((a, b) => b.accuracy - a.accuracy);
    accuracyScores.forEach(score => {
        const status = score.accuracy >= 75 ? '🟢' : score.accuracy >= 50 ? '🟡' : '🔴';
        console.log(`   ${status} ${score.location}: ${score.accuracy.toFixed(1)}%`);
    });

    // Data quality assessment
    console.log('\n🔍 DATA QUALITY ASSESSMENT:');
    
    const weatherAccuracy = results.filter(r => !r.error).filter(r => {
        const temp = r.api.temperature;
        const tempRef = r.reference.temperature;
        return temp >= tempRef.min && temp <= tempRef.max;
    }).length / results.filter(r => !r.error).length * 100;
    
    const satelliteAccuracy = results.filter(r => !r.error).filter(r => {
        const ndvi = r.api.ndvi;
        const ndviRef = r.reference.ndvi;
        return ndvi >= ndviRef.min && ndvi <= ndviRef.max;
    }).length / results.filter(r => !r.error).length * 100;
    
    const soilAccuracy = results.filter(r => !r.error).filter(r => {
        const moisture = r.api.soilMoisture;
        const moistureRef = r.reference.soilMoisture;
        return moisture >= moistureRef.min && moisture <= moistureRef.max;
    }).length / results.filter(r => !r.error).length * 100;

    console.log(`   🌡️  Weather API: ${weatherAccuracy.toFixed(1)}% accurate`);
    console.log(`   🛰️  Satellite API: ${satelliteAccuracy.toFixed(1)}% accurate`);
    console.log(`   🌱 Soil API: ${soilAccuracy.toFixed(1)}% accurate`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (overallAccuracy < 75) {
        console.log('   ⚠️  Overall accuracy below 75% - significant improvements needed');
    }
    if (satelliteAccuracy < 60) {
        console.log('   🛰️  Satellite data accuracy low - investigate data sources and fallback mechanisms');
    }
    if (soilAccuracy < 60) {
        console.log('   🌱 Soil data accuracy low - consider alternative soil moisture sources');
    }
    if (weatherAccuracy >= 90) {
        console.log('   ✅ Weather API performing excellently - consider using as primary reference');
    }
}

// Run the validation
if (require.main === module) {
    validateWithPublicData();
}

module.exports = { validateWithPublicData, referenceData }; 