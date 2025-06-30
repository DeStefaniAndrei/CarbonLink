require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function captureSentinelResponse() {
  try {
    console.log('🔍 Capturing complete Sentinel Hub API response...\n');

    // Test location (Amazon Rainforest)
    const coordinates = {
      lat: -3.4653,
      lng: -58.3801
    };

    // Generate polygon coordinates (larger area)
    const polygonSize = 0.01; // 0.01 degrees = ~1.1km
    const halfSize = polygonSize / 2;
    const polygon = [
      [coordinates.lat - halfSize, coordinates.lng - halfSize],
      [coordinates.lat - halfSize, coordinates.lng + halfSize],
      [coordinates.lat + halfSize, coordinates.lng + halfSize],
      [coordinates.lat + halfSize, coordinates.lng - halfSize],
      [coordinates.lat - halfSize, coordinates.lng - halfSize] // Close the polygon
    ];

    // Step 1: Get OAuth token
    console.log('1. Getting OAuth token...');
    const oauthResponse = await axios.post('https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token', 
      new URLSearchParams({
        client_id: process.env.SENTINEL_USER_ID,
        client_secret: process.env.SENTINEL_SECRET,
        grant_type: 'client_credentials'
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = oauthResponse.data.access_token;
    console.log('✅ OAuth token obtained');

    // Step 2: Make Statistics API request
    console.log('2. Making Statistics API request...');
    
    const requestBody = {
      input: {
        bounds: {
          bbox: [
            Math.min(...polygon.map(p => p[1])), // min lng
            Math.min(...polygon.map(p => p[0])), // min lat
            Math.max(...polygon.map(p => p[1])), // max lng
            Math.max(...polygon.map(p => p[0]))  // max lat
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

    console.log('Request URL:', 'https://services.sentinel-hub.com/api/v1/statistics');
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    const statisticsResponse = await axios.post(
      'https://services.sentinel-hub.com/api/v1/statistics',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Statistics API response received');
    console.log('Response Status:', statisticsResponse.status);
    console.log('Response Headers:', JSON.stringify(statisticsResponse.headers, null, 2));

    // Save complete response to file
    const responseData = {
      timestamp: new Date().toISOString(),
      request: {
        url: 'https://services.sentinel-hub.com/api/v1/statistics',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer [REDACTED]',
          'Content-Type': 'application/json'
        },
        body: requestBody
      },
      response: {
        status: statisticsResponse.status,
        statusText: statisticsResponse.statusText,
        headers: statisticsResponse.headers,
        data: statisticsResponse.data
      }
    };

    const outputPath = path.join(__dirname, 'sentinel-hub-response.json');
    fs.writeFileSync(outputPath, JSON.stringify(responseData, null, 2));

    console.log('\n📄 Complete response saved to:', outputPath);
    console.log('\n=== COMPLETE JSON RESPONSE ===');
    console.log(JSON.stringify(statisticsResponse.data, null, 2));

    // Additional analysis
    console.log('\n=== RESPONSE ANALYSIS ===');
    if (statisticsResponse.data.data && statisticsResponse.data.data.length > 0) {
      console.log(`✅ Found ${statisticsResponse.data.data.length} data intervals`);
      statisticsResponse.data.data.forEach((interval, index) => {
        console.log(`   Interval ${index + 1}: ${interval.interval.from} to ${interval.interval.to}`);
        if (interval.outputs && interval.outputs.ndvi) {
          const ndviValue = interval.outputs.ndvi.bands.B0.stats.mean;
          console.log(`   NDVI: ${ndviValue}`);
        }
      });
    } else {
      console.log('❌ No data intervals found in response');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      
      // Save error response to file
      const errorData = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        }
      };
      
      const errorPath = path.join(__dirname, 'sentinel-hub-error.json');
      fs.writeFileSync(errorPath, JSON.stringify(errorData, null, 2));
      console.log('\n📄 Error response saved to:', errorPath);
    }
  }
}

captureSentinelResponse(); 