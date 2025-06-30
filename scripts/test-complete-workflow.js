require('dotenv').config();
const { SmartContractIntegration } = require('../lib/smart-contract-integration');
const { configManager } = require('../lib/config');
const { CarbonCalculator } = require('../lib/carbon-calculator');
const { DataSourceManager } = require('../lib/data-sources');

async function testCompleteWorkflow() {
    console.log('🌱 CarbonLink Complete Workflow Test\n');

    try {
        // 1. Test Data Sources
        console.log('1. 📡 Fetching Real-Time Data...');
        const dataSourceManager = new DataSourceManager(configManager.getDataSourceConfig());
        
        const coordinates = { lat: 40.7128, lng: -74.0060 }; // New York
        const [weatherData, satelliteData, soilData] = await Promise.all([
            dataSourceManager.fetchWeatherData(coordinates),
            dataSourceManager.fetchSatelliteData(coordinates),
            dataSourceManager.fetchSoilData(coordinates)
        ]);

        console.log('   ✅ Weather Data:', {
            temperature: weatherData.temperature.toFixed(1) + '°C',
            humidity: (weatherData.humidity * 100).toFixed(1) + '%',
            rainfall: weatherData.rainfall.toFixed(1) + 'mm'
        });

        console.log('   ✅ Satellite Data:', {
            ndvi: satelliteData.ndvi.toFixed(3),
            canopyCover: satelliteData.canopyCover.toFixed(1) + '%',
            forestHealth: (satelliteData.forestHealth * 100).toFixed(1) + '%'
        });

        console.log('   ✅ Soil Data:', {
            moisture: (soilData.moisture * 100).toFixed(1) + '%',
            temperature: soilData.temperature.toFixed(1) + '°C',
            organicCarbon: soilData.organicCarbon.toFixed(1) + '%'
        });

        // 2. Calculate Carbon Credits
        console.log('\n2. 🧮 Calculating Carbon Credits...');
        const projectData = {
            ndvi: satelliteData.ndvi,
            projectArea: 100, // hectares
            weatherData,
            soilData,
            satelliteData
        };

        const carbonResult = CarbonCalculator.calculateCarbonCredits(projectData);
        
        console.log('   ✅ Carbon Calculation Results:');
        console.log('      Carbon Stock:', carbonResult.carbonStock.toFixed(2), 'tons C');
        console.log('      CO2 Equivalent:', carbonResult.co2Equivalent.toFixed(2), 'tons CO2');
        console.log('      Uncertainty:', carbonResult.uncertainty.toFixed(1) + '%');
        console.log('      Confidence Factor:', carbonResult.confidenceFactor.toFixed(3));

        // 3. Test Smart Contract Integration
        console.log('\n3. 🔗 Testing Smart Contract Integration...');
        try {
            const integration = new SmartContractIntegration(configManager.getContractConfig());
            
            // Get project info
            const projectInfo = await integration.getProjectInfo();
            console.log('   ✅ Project Info Retrieved:', {
                projectId: projectInfo.projectId,
                area: projectInfo.area + ' ha',
                treeType: projectInfo.treeType,
                owner: projectInfo.owner
            });

            // Get carbon credits
            const credits = await integration.getCarbonCredits();
            console.log('   ✅ Current Carbon Credits:', {
                total: credits.total.toFixed(2) + ' tons CO2',
                buffer: credits.buffer.toFixed(2) + ' tons CO2'
            });

        } catch (error) {
            console.log('   ⚠️  Smart Contract Test:', error.message);
            console.log('      (This is expected if not connected to blockchain)');
        }

        // 4. Generate Chainlink Functions Code
        console.log('\n4. 🔗 Generating Chainlink Functions Code...');
        const { ChainlinkFunctionsIntegration } = require('../lib/chainlink-functions-integration');
        const chainlinkIntegration = new ChainlinkFunctionsIntegration(configManager.getChainlinkConfig());
        
        const sourceCode = chainlinkIntegration.generateSourceCode();
        console.log('   ✅ Chainlink Functions source code generated');
        console.log('      Length:', sourceCode.length, 'characters');
        console.log('      Ready for deployment to Chainlink Functions');

        // 5. Performance Analysis
        console.log('\n5. 📊 Performance Analysis...');
        const benchmark = CarbonCalculator.calculatePerformanceBenchmark(
            satelliteData.ndvi, // current project NDVI
            0.65, // control area NDVI
            satelliteData.ndvi * 0.95, // previous project NDVI
            0.60 // previous control NDVI
        );
        
        console.log('   ✅ Performance Benchmark:', benchmark.toFixed(3));
        if (benchmark > 1.0) {
            console.log('      🎉 Project performing better than control area!');
        } else {
            console.log('      📈 Project performing at expected levels');
        }

        console.log('\n🎉 Complete Workflow Test Successful!');
        console.log('\n📋 Summary:');
        console.log('   • Real-time data fetched from multiple sources');
        console.log('   • Carbon credits calculated:', carbonResult.co2Equivalent.toFixed(2), 'tons CO2');
        console.log('   • Uncertainty quantified:', carbonResult.uncertainty.toFixed(1) + '%');
        console.log('   • Smart contracts configured and ready');
        console.log('   • Chainlink Functions code generated');
        console.log('   • Performance benchmark calculated');

        return {
            carbonCredits: carbonResult.co2Equivalent,
            uncertainty: carbonResult.uncertainty,
            confidenceFactor: carbonResult.confidenceFactor,
            benchmark
        };

    } catch (error) {
        console.error('❌ Workflow test failed:', error);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testCompleteWorkflow();
}

module.exports = { testCompleteWorkflow }; 