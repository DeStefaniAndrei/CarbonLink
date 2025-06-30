require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Test locations
const testLocations = [
  {
    name: "amazon_rainforest",
    lat: -3.4653,
    lng: -58.3801,
    description: "Amazon Rainforest (Manaus, Brazil)"
  },
  {
    name: "sahara_desert", 
    lat: 25.7617,
    lng: -0.1918,
    description: "Sahara Desert (Algeria)"
  },
  {
    name: "boreal_forest",
    lat: 64.8255,
    lng: -147.6444,
    description: "Boreal Forest (Alaska)"
  }
];

async function getSentinelHubOAuthToken() {
  try {
    const clientId = process.env.SENTINEL_USER_ID;
    const clientSecret = process.env.SENTINEL_SECRET;
    
    const response = await axios.post('https://services.sentinel-hub.com/oauth/token', {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    throw new Error(`OAuth token error: ${error.message}`);
  }
}

async function captureSentinelHubResponse(location, accessToken) {
  try {
    // Use 0.001 degrees for approximately 0.01km² area
    const delta = 0.001; // This gives roughly 0.01km² at the equator
    const polygon = [
      [location.lat - delta, location.lng - delta],
      [location.lat + delta, location.lng - delta],
      [location.lat + delta, location.lng + delta],
      [location.lat - delta, location.lng + delta],
      [location.lat - delta, location.lng - delta]
    ];

    const requestBody = {
      input: {
        bounds: {
          bbox: [
            Math.min(...polygon.map(p => p[1])),
            Math.min(...polygon.map(p => p[0])),
            Math.max(...polygon.map(p => p[1])),
            Math.max(...polygon.map(p => p[0]))
          ],
          properties: {
            crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
          }
        },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: {
              mosaickingOrder: "leastCC"
            }
          }
        ]
      },
      aggregation: {
        timeRange: {
          from: "2024-06-01T00:00:00Z",
          to: "2024-06-30T23:59:59Z"
        },
        aggregationInterval: {
          of: "P1D"
        },
        resx: 10,
        resy: 10,
        evalscript: `
          //VERSION=3
          function setup() {
            return {
              input: [{ bands: ["B04", "B08", "dataMask"] }],
              output: [
                { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
                { id: "dataMask", bands: 1 }
              ]
            };
          }
          function evaluatePixel(samples) {
            let ndvi = (samples.B08 - samples.B04) / (samples.B08 + samples.B04);
            return {
              ndvi: [ndvi],
              dataMask: [samples.dataMask]
            };
          }
        `
      }
    };

    const response = await axios.post(
      'https://services.sentinel-hub.com/api/v1/statistics',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      status: response.status,
      headers: response.headers,
      data: response.data,
      request: {
        url: 'https://services.sentinel-hub.com/api/v1/statistics',
        method: 'POST',
        body: requestBody
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response?.data,
      request: {
        url: 'https://services.sentinel-hub.com/api/v1/statistics',
        method: 'POST'
      }
    };
  }
}

async function captureOpenWeatherResponse(location) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${apiKey}&units=metric`;
    
    const response = await axios.get(url);
    
    return {
      success: true,
      status: response.status,
      headers: response.headers,
      data: response.data,
      request: {
        url: url,
        method: 'GET'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response?.data,
      request: {
        url: `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=[REDACTED]&units=metric`,
        method: 'GET'
      }
    };
  }
}

async function captureCopernicusResponse(location) {
  try {
    // Load Copernicus credentials
    const credentialsPath = path.join(__dirname, '..', 'credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    // Use the correct CLMS API authentication method
    const tokenResponse = await axios.post('https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token', {
      grant_type: 'client_credentials',
      client_id: credentials.client_id,
      client_secret: credentials.client_secret
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    
    // Use the CLMS API to search for datasets
    const searchUrl = 'https://land.copernicus.eu/api/@search';
    const searchParams = {
      portal_type: 'DataSet',
      metadata_fields: 'UID',
      metadata_fields: 'dataset_full_format',
      metadata_fields: 'dataset_download_information',
      SearchableText: 'soil moisture'
    };
    
    const response = await axios.get(searchUrl, {
      params: searchParams,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return {
      success: true,
      status: response.status,
      headers: response.headers,
      data: response.data,
      request: {
        url: searchUrl,
        method: 'GET',
        params: searchParams
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response?.data,
      request: {
        url: 'Copernicus CLMS API search endpoint',
        method: 'GET'
      }
    };
  }
}

async function captureAllAPIResponses() {
  console.log('🔍 Capturing all API responses for manual inspection...\n');

  // Create output directory
  const outputDir = path.join(__dirname, 'api-responses');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Get Sentinel Hub OAuth token once
  console.log('1. Getting Sentinel Hub OAuth token...');
  const sentinelToken = await getSentinelHubOAuthToken();
  console.log('✅ OAuth token obtained\n');

  for (const location of testLocations) {
    console.log(`📍 Testing location: ${location.description}`);
    console.log(`   Coordinates: ${location.lat}, ${location.lng}\n`);

    const locationDir = path.join(outputDir, location.name);
    if (!fs.existsSync(locationDir)) {
      fs.mkdirSync(locationDir);
    }

    // 1. Capture OpenWeather response
    console.log('   📡 Capturing OpenWeather API response...');
    const openWeatherResponse = await captureOpenWeatherResponse(location);
    const openWeatherFile = path.join(locationDir, 'openweather-response.json');
    fs.writeFileSync(openWeatherFile, JSON.stringify(openWeatherResponse, null, 2));
    console.log(`   ${openWeatherResponse.success ? '✅' : '❌'} Saved to: ${openWeatherFile}`);

    // 2. Capture Sentinel Hub response
    console.log('   🛰️  Capturing Sentinel Hub API response...');
    const sentinelResponse = await captureSentinelHubResponse(location, sentinelToken);
    const sentinelFile = path.join(locationDir, 'sentinel-hub-response.json');
    fs.writeFileSync(sentinelFile, JSON.stringify(sentinelResponse, null, 2));
    console.log(`   ${sentinelResponse.success ? '✅' : '❌'} Saved to: ${sentinelFile}`);

    // 3. Capture Copernicus response
    console.log('   🌍 Capturing Copernicus API response...');
    const copernicusResponse = await captureCopernicusResponse(location);
    const copernicusFile = path.join(locationDir, 'copernicus-response.json');
    fs.writeFileSync(copernicusFile, JSON.stringify(copernicusResponse, null, 2));
    console.log(`   ${copernicusResponse.success ? '✅' : '❌'} Saved to: ${copernicusFile}`);

    console.log('\n   📊 Summary:');
    console.log(`      OpenWeather: ${openWeatherResponse.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`      Sentinel Hub: ${sentinelResponse.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`      Copernicus: ${copernicusResponse.success ? 'SUCCESS' : 'FAILED'}`);

    // Add delay between locations
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('\n' + '='.repeat(60) + '\n');
  }

  console.log('🎉 All API responses captured!');
  console.log(`📁 Check the '${outputDir}' directory for JSON files.`);
  console.log('\n📋 Files created:');
  console.log('   For each location:');
  console.log('   - openweather-response.json');
  console.log('   - sentinel-hub-response.json');
  console.log('   - copernicus-response.json');
  console.log('\n🔍 Inspect these files to identify data quality issues!');
}

captureAllAPIResponses().catch(console.error); 