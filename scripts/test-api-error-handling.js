require('dotenv').config();
console.log('ENV OPENWEATHER_API_KEY:', JSON.stringify(process.env.OPENWEATHER_API_KEY));

const { DataSourceManager } = require('../lib/data-sources');
const { configManager } = require('../lib/config');

async function testApiErrorHandling() {
    console.log('🔍 Testing API Error Handling\n');

    const dataSourceManager = new DataSourceManager(configManager.getDataSourceConfig());
    const coordinates = { lat: 40.7128, lng: -74.0060 };

    console.log('1. Testing Sentinel API with invalid key...');
    try {
        // Test Sentinel API directly
        const response = await fetch(
            `https://scihub.copernicus.eu/dhus/odata/v1/Products?$filter=contains(Name,'S2A') and ContentDate/Start ge datetime'2024-01-01T00:00:00.000Z' and intersects(Footprint,geography'POINT(${coordinates.lng} ${coordinates.lat})')`,
            {
                headers: {
                    'Authorization': `Basic ${btoa(`username:${configManager.getDataSourceConfig().sentinelApiKey}`)}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.log(`   ❌ Sentinel API Error: ${response.status} - ${response.statusText}`);
            console.log(`   📝 This means your Sentinel API key is invalid or expired`);
        } else {
            console.log('   ✅ Sentinel API working correctly');
        }
    } catch (error) {
        console.log(`   ❌ Sentinel API Network Error: ${error.message}`);
    }

    console.log('\n2. Testing OpenWeather API...');
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${configManager.getDataSourceConfig().openWeatherApiKey}&units=metric`
        );

        if (!response.ok) {
            console.log(`   ❌ OpenWeather API Error: ${response.status} - ${response.statusText}`);
        } else {
            const data = await response.json();
            console.log(`   ✅ OpenWeather API working: ${data.main.temp}°C, ${data.main.humidity}% humidity`);
        }
    } catch (error) {
        console.log(`   ❌ OpenWeather API Network Error: ${error.message}`);
    }

    console.log('\n3. Testing Data Source Manager with error handling...');
    try {
        const satelliteData = await dataSourceManager.fetchSatelliteData(coordinates);
        console.log('   ✅ Satellite data fetched (may be mock data if API failed):', {
            ndvi: satelliteData.ndvi.toFixed(3),
            canopyCover: satelliteData.canopyCover.toFixed(1) + '%',
            forestHealth: (satelliteData.forestHealth * 100).toFixed(1) + '%'
        });
    } catch (error) {
        console.log(`   ❌ Satellite data fetch failed: ${error.message}`);
    }

    console.log('\n4. Testing Weather Data...');
    try {
        const weatherData = await dataSourceManager.fetchWeatherData(coordinates);
        console.log('   ✅ Weather data fetched:', {
            temperature: weatherData.temperature.toFixed(1) + '°C',
            humidity: (weatherData.humidity * 100).toFixed(1) + '%',
            rainfall: weatherData.rainfall.toFixed(1) + 'mm'
        });
    } catch (error) {
        console.log(`   ❌ Weather data fetch failed: ${error.message}`);
    }

    console.log('\n📋 Summary:');
    console.log('• If you see API errors above, those APIs are not working');
    console.log('• The system will fall back to mock data to continue functioning');
    console.log('• This is good error handling - the system doesn\'t crash');
}

// Run the test
if (require.main === module) {
    testApiErrorHandling();
}

module.exports = { testApiErrorHandling }; 