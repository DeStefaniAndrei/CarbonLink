const axios = require('axios');

// NASA Earthdata API endpoints for additional validation
const NASA_ENDPOINTS = {
    MODIS_NDVI: 'https://cmr.earthdata.nasa.gov/search/granules.json',
    SMAP_SOIL: 'https://cmr.earthdata.nasa.gov/search/granules.json',
    AIRS_TEMP: 'https://cmr.earthdata.nasa.gov/search/granules.json'
};

async function fetchPublicReferenceData() {
    console.log('🌍 Fetching Public Reference Data from NASA and Other Sources\n');
    
    const testLocations = [
        { name: "Amazon Rainforest", lat: -3.4653, lng: -58.3801 },
        { name: "Sahara Desert", lat: 26.8206, lng: 30.8025 },
        { name: "Boreal Forest", lat: 55.1300, lng: -105.2551 }
    ];

    for (const location of testLocations) {
        console.log(`\n📍 ${location.name} (${location.lat}, ${location.lng})`);
        
        try {
            // Try to fetch MODIS NDVI data
            console.log('   🔍 Searching for MODIS NDVI data...');
            const modisResponse = await axios.get(NASA_ENDPOINTS.MODIS_NDVI, {
                params: {
                    collection_concept_id: 'C1940468264-LPCLOUD', // MODIS Terra
                    bounding_box: `${location.lng-0.1},${location.lat-0.1},${location.lng+0.1},${location.lat+0.1}`,
                    temporal: '2024-01-01T00:00:00Z,2024-12-31T23:59:59Z',
                    limit: 1
                },
                timeout: 10000
            });
            
            if (modisResponse.data.feed && modisResponse.data.feed.entry) {
                console.log('   ✅ MODIS data available');
                console.log(`      Granules found: ${modisResponse.data.feed.entry.length}`);
            } else {
                console.log('   ⚠️  No MODIS granules found for this location');
            }
            
        } catch (error) {
            console.log(`   ❌ MODIS API error: ${error.message}`);
        }

        try {
            // Try to fetch SMAP soil moisture data
            console.log('   🔍 Searching for SMAP soil moisture data...');
            const smapResponse = await axios.get(NASA_ENDPOINTS.SMAP_SOIL, {
                params: {
                    collection_concept_id: 'C1940468264-LPCLOUD', // SMAP
                    bounding_box: `${location.lng-0.1},${location.lat-0.1},${location.lng+0.1},${location.lat+0.1}`,
                    temporal: '2024-01-01T00:00:00Z,2024-12-31T23:59:59Z',
                    limit: 1
                },
                timeout: 10000
            });
            
            if (smapResponse.data.feed && smapResponse.data.feed.entry) {
                console.log('   ✅ SMAP data available');
                console.log(`      Granules found: ${smapResponse.data.feed.entry.length}`);
            } else {
                console.log('   ⚠️  No SMAP granules found for this location');
            }
            
        } catch (error) {
            console.log(`   ❌ SMAP API error: ${error.message}`);
        }
    }

    // Additional public data sources
    console.log('\n📚 Additional Public Data Sources:');
    console.log('   • WorldClim (https://www.worldclim.org/) - Global climate data');
    console.log('   • ESA CCI Soil Moisture (https://www.esa-soilmoisture-cci.org/) - Soil moisture');
    console.log('   • Global Forest Watch (https://www.globalforestwatch.org/) - Forest cover');
    console.log('   • NASA Earthdata (https://earthdata.nasa.gov/) - Various satellite data');
    console.log('   • Copernicus Climate Data Store (https://cds.climate.copernicus.eu/) - Climate data');
    
    console.log('\n🔍 Manual Validation Sources:');
    console.log('   • Google Earth Engine - NDVI time series');
    console.log('   • Sentinel Hub EO Browser - Real-time satellite imagery');
    console.log('   • Weather Underground - Historical weather data');
    console.log('   • SoilGrids - Global soil information');
}

// Run the script
if (require.main === module) {
    fetchPublicReferenceData();
}

module.exports = { fetchPublicReferenceData }; 