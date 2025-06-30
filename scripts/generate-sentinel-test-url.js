require('dotenv').config();

// Test location (Amazon Rainforest)
const testLocation = {
  name: "Amazon Rainforest",
  lat: -3.4653,
  lng: -58.3801,
  polygonSize: 0.01 // 0.01 degrees = ~1.1km
};

// Generate polygon coordinates
const generatePolygon = (lat, lng, size) => {
  const halfSize = size / 2;
  return [
    [lat - halfSize, lng - halfSize],
    [lat - halfSize, lng + halfSize],
    [lat + halfSize, lng + halfSize],
    [lat + halfSize, lng - halfSize],
    [lat - halfSize, lng - halfSize] // Close the polygon
  ];
};

// Generate Statistics API request
const generateStatisticsRequest = () => {
  const polygon = generatePolygon(testLocation.lat, testLocation.lng, testLocation.polygonSize);
  
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
        from: "2024-01-15T00:00:00Z",
        to: "2024-01-15T23:59:59Z"
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
            input: [{
              bands: ["B04", "B08"],
              units: "REFLECTANCE"
            }],
            output: {
              id: "default",
              bands: 1,
              sampleType: "FLOAT32"
            }
          };
        }
        
        function evaluatePixel(sample) {
          const nir = sample.B08;
          const red = sample.B04;
          const ndvi = (nir - red) / (nir + red);
          return [ndvi];
        }
      `
    }
  };
  
  return {
    url: 'https://services.sentinel-hub.com/api/v1/statistics',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN_HERE',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody, null, 2)
  };
};

// Main execution
async function main() {
  try {
    console.log('=== Sentinel Hub API Test URLs ===\n');
    
    console.log('1. OAuth Token Request:');
    console.log('URL: https://services.sentinel-hub.com/oauth/token');
    console.log('Method: POST');
    console.log('Headers:');
    console.log('  Content-Type: application/x-www-form-urlencoded');
    console.log('Body (URL encoded):');
    console.log('  grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=YOUR_JWT_TOKEN\n');
    
    // Generate Statistics request
    const statsRequest = generateStatisticsRequest();
    console.log('2. Statistics API Request:');
    console.log(`URL: ${statsRequest.url}`);
    console.log('Method: POST');
    console.log('Headers:');
    console.log('  Authorization: Bearer YOUR_ACCESS_TOKEN_HERE');
    console.log('  Content-Type: application/json');
    console.log('Body (JSON):');
    console.log(statsRequest.body);
    
    console.log('\n=== Instructions ===');
    console.log('1. First make the OAuth request to get an access token');
    console.log('2. Replace "YOUR_ACCESS_TOKEN_HERE" with the actual token');
    console.log('3. Make the Statistics request to get NDVI data');
    console.log('4. You can use tools like Postman, curl, or browser dev tools');
    console.log('\n=== Alternative: Use our test script ===');
    console.log('Run: node scripts/test-sentinel-detailed.js');
    console.log('This will make the actual API calls and show you the responses.');
    
  } catch (error) {
    console.error('Error generating test URLs:', error.message);
  }
}

main(); 