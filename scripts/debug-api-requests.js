require('dotenv').config();
const { DataSourceManager } = require('../lib/data-sources');
const { configManager } = require('../lib/config');

async function debugAPIRequests() {
    console.log('🔍 DEBUGGING API REQUESTS - Full URLs and Parameters\n');
    console.log('📋 Copy these URLs to test in your browser or API client\n');

    const dataSourceManager = new DataSourceManager(configManager.getDataSourceConfig());
    
    // Test with one location to show all API requests
    const testLocation = { lat: -3.4653, lng: -58.3801 }; // Amazon Rainforest
    
    console.log(`📍 Testing Location: Amazon Rainforest (${testLocation.lat}, ${testLocation.lng})\n`);

    // 1. OpenWeather API Request
    console.log('🌡️  OPENWEATHER API REQUEST:');
    const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${testLocation.lat}&lon=${testLocation.lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
    console.log(`   URL: ${openWeatherUrl}`);
    console.log(`   Method: GET`);
    console.log(`   Headers: Content-Type: application/json`);
    console.log(`   Parameters:`);
    console.log(`     - lat: ${testLocation.lat}`);
    console.log(`     - lon: ${testLocation.lng}`);
    console.log(`     - appid: ${process.env.OPENWEATHER_API_KEY}`);
    console.log(`     - units: metric`);
    console.log('');

    // 2. Sentinel Hub OAuth Request
    console.log('🔐 SENTINEL HUB OAUTH REQUEST:');
    const sentinelOAuthUrl = 'https://services.sentinel-hub.com/oauth/token';
    console.log(`   URL: ${sentinelOAuthUrl}`);
    console.log(`   Method: POST`);
    console.log(`   Headers:`);
    console.log(`     - Content-Type: application/x-www-form-urlencoded`);
    console.log(`     - User-Agent: CarbonLink/1.0`);
    console.log(`   Body Parameters:`);
    console.log(`     - grant_type: client_credentials`);
    console.log(`     - client_id: ${process.env.SENTINEL_USER_ID}`);
    console.log(`     - client_secret: ${process.env.SENTINEL_SECRET}`);
    console.log('');

    // 3. Sentinel Hub Statistics API Request
    console.log('🛰️  SENTINEL HUB STATISTICS API REQUEST:');
    const sentinelStatsUrl = 'https://services.sentinel-hub.com/api/v1/statistics';
    console.log(`   URL: ${sentinelStatsUrl}`);
    console.log(`   Method: POST`);
    console.log(`   Headers:`);
    console.log(`     - Content-Type: application/json`);
    console.log(`     - Authorization: Bearer [TOKEN_FROM_OAUTH]`);
    console.log(`     - User-Agent: CarbonLink/1.0`);
    
    // Calculate the polygon coordinates
    const delta = 0.001; // Very small area
    const polygon = [
        [testLocation.lng - delta, testLocation.lat - delta],
        [testLocation.lng + delta, testLocation.lat - delta],
        [testLocation.lng + delta, testLocation.lat + delta],
        [testLocation.lng - delta, testLocation.lat + delta],
        [testLocation.lng - delta, testLocation.lat - delta]
    ];
    
    const evalscript = `//VERSION=3
function setup() {
  return {
    input: [{
        bands: ["B04","B08","SCL","dataMask"]
      }],
    output: [
      { id: "data", bands: 1 },
      { id: "dataMask", bands: 1 }
    ]
  }
}
function evaluatePixel(samples) {
    let ndvi = (samples.B08 - samples.B04)/(samples.B08 + samples.B04)
    var validNDVIMask = 1
    if (samples.B08 + samples.B04 == 0 ){
        validNDVIMask = 0
    }
    var noWaterMask = 1
    if (samples.SCL == 6 ){
        noWaterMask = 0
    }
    return {
        data: [ndvi],
        dataMask: [samples.dataMask * validNDVIMask * noWaterMask]
    }
}`;

    const sentinelRequestBody = {
        input: {
            bounds: {
                geometry: {
                    type: "Polygon",
                    coordinates: [polygon]
                },
                properties: {
                    crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
                }
            },
            data: [{
                type: "sentinel-2-l2a",
                dataFilter: {
                    mosaickingOrder: "leastCC"
                }
            }]
        },
        aggregation: {
            timeRange: {
                from: "2024-01-01T00:00:00Z",
                to: "2024-12-31T23:59:59Z"
            },
            aggregationInterval: {
                of: "P30D"
            },
            evalscript: evalscript,
            resx: 10,
            resy: 10
        }
    };
    
    console.log(`   Request Body:`);
    console.log(`     ${JSON.stringify(sentinelRequestBody, null, 6)}`);
    console.log('');

    // 4. Copernicus OAuth Request
    console.log('🌱 COPERNICUS OAUTH REQUEST:');
    const copernicusOAuthUrl = 'https://land.copernicus.eu/@@oauth2-token';
    console.log(`   URL: ${copernicusOAuthUrl}`);
    console.log(`   Method: POST`);
    console.log(`   Headers:`);
    console.log(`     - Content-Type: application/x-www-form-urlencoded`);
    console.log(`     - User-Agent: CarbonLink/1.0`);
    console.log(`   Body Parameters:`);
    console.log(`     - grant_type: urn:ietf:params:oauth:grant-type:jwt-bearer`);
    console.log(`     - assertion: [JWT_TOKEN]`);
    console.log(`   Note: JWT token is generated using credentials from credentials.json`);
    console.log('');

    // 5. Copernicus Soil Data Request
    console.log('🌱 COPERNICUS SOIL DATA REQUEST:');
    const copernicusSoilUrl = 'https://land.copernicus.eu/api/land-monitoring/v1/soil-moisture';
    console.log(`   URL: ${copernicusSoilUrl}`);
    console.log(`   Method: GET`);
    console.log(`   Headers:`);
    console.log(`     - Authorization: Bearer [TOKEN_FROM_OAUTH]`);
    console.log(`     - User-Agent: CarbonLink/1.0`);
    console.log(`   Query Parameters:`);
    console.log(`     - lat: ${testLocation.lat}`);
    console.log(`     - lon: ${testLocation.lng}`);
    console.log(`     - date: [CURRENT_DATE]`);
    console.log('');

    // 6. Fallback NASA Earthdata Request
    console.log('🛰️  NASA EARTHDATA FALLBACK REQUEST:');
    const nasaUrl = `https://cmr.earthdata.nasa.gov/search/collections.json?bounding_box=${testLocation.lng-0.1},${testLocation.lat-0.1},${testLocation.lng+0.1},${testLocation.lat+0.1}&temporal=2024-01-01T00:00:00Z,2024-12-31T23:59:59Z&collection_concept_id=C1940468264-LPCLOUD`;
    console.log(`   URL: ${nasaUrl}`);
    console.log(`   Method: GET`);
    console.log(`   Headers:`);
    console.log(`     - Accept: application/json`);
    console.log(`     - User-Agent: CarbonLink/1.0`);
    console.log(`   Query Parameters:`);
    console.log(`     - bounding_box: ${testLocation.lng-0.1},${testLocation.lat-0.1},${testLocation.lng+0.1},${testLocation.lat+0.1}`);
    console.log(`     - temporal: 2024-01-01T00:00:00Z,2024-12-31T23:59:59Z`);
    console.log(`     - collection_concept_id: C1940468264-LPCLOUD`);
    console.log('');

    // Now let's actually make the requests and show the responses
    console.log('='.repeat(80));
    console.log('📊 ACTUAL API RESPONSES');
    console.log('='.repeat(80));

    try {
        console.log('\n🌡️  Testing OpenWeather API...');
        const weatherData = await dataSourceManager.fetchWeatherData(testLocation);
        console.log(`   ✅ Response: ${JSON.stringify(weatherData, null, 2)}`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    try {
        console.log('\n🛰️  Testing Sentinel Hub API...');
        const satelliteData = await dataSourceManager.fetchSatelliteData(testLocation);
        console.log(`   ✅ Response: ${JSON.stringify(satelliteData, null, 2)}`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    try {
        console.log('\n🌱 Testing Copernicus Soil API...');
        const soilData = await dataSourceManager.fetchSoilData(testLocation);
        console.log(`   ✅ Response: ${JSON.stringify(soilData, null, 2)}`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔧 DEBUGGING TIPS');
    console.log('='.repeat(80));
    console.log('1. Test OpenWeather URL in browser to verify API key');
    console.log('2. Use Postman/curl to test Sentinel Hub OAuth flow');
    console.log('3. Check Sentinel Hub evalscript syntax in their documentation');
    console.log('4. Verify Copernicus credentials format and JWT generation');
    console.log('5. Test with different time ranges and polygon sizes');
    console.log('6. Check if APIs require registration or additional headers');
    console.log('');
    console.log('📚 Useful Documentation:');
    console.log('   • Sentinel Hub: https://docs.sentinel-hub.com/api/');
    console.log('   • Copernicus: https://land.copernicus.eu/technical-information/');
    console.log('   • OpenWeather: https://openweathermap.org/api');
    console.log('   • NASA Earthdata: https://earthdata.nasa.gov/');
}

// Run the debug script
if (require.main === module) {
    debugAPIRequests();
}

module.exports = { debugAPIRequests }; 