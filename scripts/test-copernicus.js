require('dotenv').config();
const { DataSourceManager } = require('../lib/data-sources');
const { configManager } = require('../lib/config');

async function testCopernicus() {
    console.log('🌱 Testing Copernicus Global Land Service Integration\n');

    try {
        const dataSourceManager = new DataSourceManager(configManager.getDataSourceConfig());
        
        // Test coordinates (New York)
        const coordinates = { lat: 40.7128, lng: -74.0060 };
        
        console.log('Testing soil data fetch...');
        const soilData = await dataSourceManager.fetchSoilData(coordinates);
        
        console.log('✅ Soil Data Result:', {
            moisture: (soilData.moisture * 100).toFixed(1) + '%',
            temperature: soilData.temperature.toFixed(1) + '°C',
            organicCarbon: soilData.organicCarbon.toFixed(1) + '%',
            ph: soilData.ph.toFixed(1),
            source: soilData.source || 'Mock Data'
        });

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
if (require.main === module) {
    testCopernicus();
}

module.exports = { testCopernicus }; 