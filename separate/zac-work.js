//Dependancies
//npm install @sentinel-hub/sentinelhub-js axios


//Uses Sentianl hub:
//56b4d278-ca68-4c0d-bbb0-a354a0e6ab66 (user id)
//i4rVWAndZkEhClon6KLTcQUATvwoAbFD (secret)

const axios = require('axios');

// bounding box of longditued and latitude
const bbox = [10.0, 50.0, 11, 51];

//
async function getNDVI() {

    const response = await axios.post(
        'https://services.sentinel-hub.com/api/v1/statistics',
        {
            "collection": "sentinel-2-l2a",
            "bbox": bbox,
            "timeRange": {
                "from": "2023-06-01T00:00:00Z",
                "to": "2023-06-30T23:59:59Z"
            },
            "aggregation": {
                "timeRange": "P1M", // P1M means monthly avg
                "evalscript": `
          //VERSION=3
          function setup() {
            return {
              input: ["NDVI"], 
              output: { bands: 1 }
            };
          }
          function evaluatePixel(sample) {
            return [sample.NDVI];
          }
        `
            }
        },
        {
            headers: {
                'Authorization': 'Bearer 56b4d278-ca68-4c0d-bbb0-a354a0e6ab66', // Our token
                'Content-Type': 'application/json'
            }
        }
    );

    // Extract the average NDVI value
    const avgNdvi = response.data.data[0].outputs[0].stats.mean;
    console.log("test");
    console.log({ avgNdvi }); // Outputs: { "avgNdvi": 0.72 }
}


getNDVI();