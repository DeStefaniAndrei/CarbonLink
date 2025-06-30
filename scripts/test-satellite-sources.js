/**
 * Test Satellite Data Sources
 * Tests all satellite data sources including Planet Labs, Copernicus, and Sentinel Hub
 */

require('dotenv').config();
const { configManager } = require('../lib/config.js');
const { DataSourceManager } = require('../lib/data-sources.js');

async function testSatelliteSources() {
  console.log('🛰️ Testing Satellite Data Sources\n');
  
  const config = configManager.getConfig();
  const dataManager = new DataSourceManager(config);
  
  // Test coordinates (Amazon rainforest area)
  const testCoordinates = {
    lat: -3.4653,
    lng: -58.3801
  };
  
  console.log(`📍 Test Location: ${testCoordinates.lat}, ${testCoordinates.lng} (Amazon Rainforest)\n`);
  
  // Test each satellite source individually
  console.log('='.repeat(60));
  console.log('🛰️ TESTING SENTINEL HUB API (OAuth2)');
  console.log('='.repeat(60));
  
  if (config.dataSources.sentinelUserId && config.dataSources.sentinelSecret) {
    try {
      console.log('✅ Sentinel Hub credentials found');
      const sentinelData = await dataManager.fetchSentinelHubData(testCoordinates);
      console.log('📊 Sentinel Hub Data:', JSON.stringify(sentinelData, null, 2));
    } catch (error) {
      console.log('❌ Sentinel Hub API error:', error.message);
    }
  } else {
    console.log('⚠️  Sentinel Hub credentials not found');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🛰️ TESTING COPERNICUS OPEN ACCESS HUB');
  console.log('='.repeat(60));
  
  if (config.dataSources.copernicusUserId && config.dataSources.copernicusSecret) {
    try {
      console.log('✅ Copernicus credentials found');
      const copernicusData = await dataManager.fetchCopernicusData(testCoordinates);
      console.log('📊 Copernicus Data:', JSON.stringify(copernicusData, null, 2));
    } catch (error) {
      console.log('❌ Copernicus API error:', error.message);
    }
  } else {
    console.log('⚠️  Copernicus credentials not found');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🛰️ TESTING LEGACY SENTINEL API');
  console.log('='.repeat(60));
  
  if (config.dataSources.sentinelApiKey) {
    try {
      console.log('✅ Legacy Sentinel API key found');
      const legacyData = await dataManager.fetchSentinelData(testCoordinates);
      console.log('📊 Legacy Sentinel Data:', JSON.stringify(legacyData, null, 2));
    } catch (error) {
      console.log('❌ Legacy Sentinel API error:', error.message);
    }
  } else {
    console.log('⚠️  Legacy Sentinel API key not found');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🛰️ TESTING FALLBACK SATELLITE SOURCES');
  console.log('='.repeat(60));
  
  try {
    const fallbackData = await dataManager.fetchFallbackSatelliteData(testCoordinates);
    console.log('📊 Fallback Data:', JSON.stringify(fallbackData, null, 2));
  } catch (error) {
    console.log('❌ Fallback satellite data error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🛰️ TESTING COMPLETE SATELLITE DATA FETCHING');
  console.log('='.repeat(60));
  
  try {
    const satelliteData = await dataManager.fetchSatelliteData(testCoordinates);
    console.log('📊 Final Satellite Data (best available source):', JSON.stringify(satelliteData, null, 2));
  } catch (error) {
    console.log('❌ Complete satellite data fetching error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  
  console.log('Available API Keys:');
  console.log(`  🛰️ Sentinel Hub: ${config.dataSources.sentinelUserId && config.dataSources.sentinelSecret ? '✅' : '❌'}`);
  console.log(`  🛰️ Copernicus: ${config.dataSources.copernicusUserId && config.dataSources.copernicusSecret ? '✅' : '❌'}`);
  console.log(`  🛰️ Legacy Sentinel: ${config.dataSources.sentinelApiKey ? '✅' : '❌'}`);
  console.log(`  🌤️ OpenWeather: ${config.dataSources.openWeatherApiKey ? '✅' : '❌'}`);
  
  console.log('\n🎯 Recommendation:');
  if (config.dataSources.sentinelUserId && config.dataSources.sentinelSecret) {
    console.log('  Sentinel Hub API is available - this will be used as the primary source');
  } else if (config.dataSources.copernicusUserId && config.dataSources.copernicusSecret) {
    console.log('  Copernicus Open Access Hub is available - this will be used as the primary source');
  } else if (config.dataSources.sentinelApiKey) {
    console.log('  Legacy Sentinel API is available - this will be used as the primary source');
  } else {
    console.log('  No premium satellite APIs available - using fallback sources');
  }
}

// Run the test
testSatelliteSources().catch(console.error); 