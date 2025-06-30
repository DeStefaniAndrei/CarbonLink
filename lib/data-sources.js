/**
 * CarbonLink Data Sources
 * Fetches real-time data from various APIs for carbon credit calculations
 */

const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const path = require('path');
const { config } = require('./config');

// Mock data generators
function generateMockWeatherData(location) {
  return {
    temperature: 20 + Math.random() * 10, // 20-30°C
    humidity: 60 + Math.random() * 30, // 60-90%
    rainfall: Math.random() * 50, // 0-50mm
    windSpeed: Math.random() * 10, // 0-10 m/s
    solarRadiation: 400 + Math.random() * 600, // 400-1000 W/m²
    timestamp: new Date(),
  };
}

function generateMockSatelliteData(location) {
  return {
    ndvi: 0.3 + Math.random() * 0.4, // 0.3-0.7
    evi: 0.2 + Math.random() * 0.3, // 0.2-0.5
    lai: 1 + Math.random() * 3, // 1-4
    biomass: 5000 + Math.random() * 15000, // 5000-20000 kg/ha
    timestamp: new Date(),
  };
}

function generateMockSoilData(location) {
  return {
    moisture: 20 + Math.random() * 40, // 20-60%
    temperature: 15 + Math.random() * 10, // 15-25°C
    ph: 5.5 + Math.random() * 2, // 5.5-7.5
    organicMatter: 2 + Math.random() * 4, // 2-6%
    nitrogen: 50 + Math.random() * 100, // 50-150 mg/kg
    phosphorus: 10 + Math.random() * 30, // 10-40 mg/kg
    potassium: 100 + Math.random() * 200, // 100-300 mg/kg
    timestamp: new Date(),
  };
}

function generateMockFireData(location) {
  return {
    fireRisk: Math.random() * 0.3, // 0-0.3 (low risk for mock)
    activeFires: Math.floor(Math.random() * 2), // 0-1
    burnedArea: Math.random() * 10, // 0-10 hectares
    timestamp: new Date(),
  };
}

// OpenWeather API integration
async function fetchWeatherData(location) {
  if (!config.openweatherApiKey) {
    console.log('⚠️ OpenWeather API key not provided, using mock data');
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${config.openweatherApiKey}&units=metric`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain?.['1h'] || 0,
      windSpeed: data.wind.speed,
      solarRadiation: 0, // OpenWeather doesn't provide this directly
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

// Sentinel Hub API integration (simplified)
async function fetchSatelliteData(location) {
  if (!config.sentinelApiKey && !config.sentinelUserId) {
    console.log('⚠️ Sentinel Hub credentials not provided, using mock data');
    return null;
  }

  try {
    // This is a simplified implementation
    // In production, you'd use the full Sentinel Hub API with proper authentication
    const url = `https://services.sentinel-hub.com/ogc/wms/${config.sentinelUserId}?service=WMS&request=GetMap&layers=TRUE_COLOR&format=image/jpeg&width=512&height=512&srs=EPSG:4326&bbox=${location.longitude-0.01},${location.latitude-0.01},${location.longitude+0.01},${location.latitude+0.01}`;
    
    // For MVP, we'll use mock data
    console.log('📡 Sentinel Hub integration placeholder - using mock data');
    return null;
  } catch (error) {
    console.error('Error fetching satellite data:', error);
    return null;
  }
}

// NASA FIRMS API integration
async function fetchFireData(location) {
  if (!config.nasaFirmsApiKey) {
    console.log('⚠️ NASA FIRMS API key not provided, using mock data');
    return null;
  }

  try {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${config.nasaFirmsApiKey}/MODIS_NRT/${location.latitude}/${location.longitude}/1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NASA FIRMS API error: ${response.status}`);
    }
    
    const csvData = await response.text();
    const lines = csvData.split('\n').slice(1); // Skip header
    const activeFires = lines.filter(line => line.trim()).length;
    
    return {
      fireRisk: activeFires > 0 ? 0.8 : 0.1, // High risk if fires detected
      activeFires,
      burnedArea: activeFires * 0.5, // Estimate 0.5 ha per fire
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching fire data:', error);
    return null;
  }
}

// Main data fetcher class
class DataSourceManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getWeatherData(location) {
    const cacheKey = `weather_${location.latitude}_${location.longitude}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const realData = await fetchWeatherData(location);
    const data = realData || generateMockWeatherData(location);
    
    this.setCached(cacheKey, data);
    return data;
  }

  async getSatelliteData(location) {
    const cacheKey = `satellite_${location.latitude}_${location.longitude}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const realData = await fetchSatelliteData(location);
    const data = realData || generateMockSatelliteData(location);
    
    this.setCached(cacheKey, data);
    return data;
  }

  async getSoilData(location) {
    const cacheKey = `soil_${location.latitude}_${location.longitude}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    // For MVP, we'll use mock soil data
    // In production, you'd integrate with soil APIs or IoT sensors
    const data = generateMockSoilData(location);
    
    this.setCached(cacheKey, data);
    return data;
  }

  async getFireData(location) {
    const cacheKey = `fire_${location.latitude}_${location.longitude}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const realData = await fetchFireData(location);
    const data = realData || generateMockFireData(location);
    
    this.setCached(cacheKey, data);
    return data;
  }

  async getAllData(location) {
    const [weather, satellite, soil, fire] = await Promise.all([
      this.getWeatherData(location),
      this.getSatelliteData(location),
      this.getSoilData(location),
      this.getFireData(location),
    ]);

    return { weather, satellite, soil, fire };
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
const dataSourceManager = new DataSourceManager();

module.exports = {
  dataSourceManager,
  DataSourceManager
}; 