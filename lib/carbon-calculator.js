/**
 * CarbonLink Carbon Calculator
 * Implements IoT-based carbon credit calculations using simplified equations
 */

// Carbon calculation constants
const CARBON_CONSTANTS = {
  // Biomass to carbon conversion factors
  BIOMASS_TO_CARBON: 0.47, // 47% of biomass is carbon
  CARBON_TO_CO2: 3.67, // CO2 molecular weight / C molecular weight
  
  // Soil carbon factors
  SOIL_CARBON_DENSITY: 1.4, // tC/m³
  SOIL_DEPTH: 0.3, // meters (30cm)
  
  // Climate factors
  TEMPERATURE_OPTIMUM: 25, // °C
  RAINFALL_OPTIMUM: 1500, // mm/year
  
  // Fire risk factors
  FIRE_CARBON_LOSS: 0.8, // 80% of biomass lost in fire
  
  // Uncertainty factors
  MEASUREMENT_UNCERTAINTY: 0.15, // 15%
  MODEL_UNCERTAINTY: 0.20, // 20%
};

class CarbonCalculator {
  // Carbon to CO2 conversion factor (44/12)
  static CARBON_TO_CO2_RATIO = 44 / 12;
  
  // Minimum uncertainty deduction (10% as per Verra methodology)
  static MIN_UNCERTAINTY = 0.10;
  
  // NDVI to Carbon regression model coefficients
  static NDVI_CARBON_COEFFICIENTS = {
    a: 2.5, // base coefficient
    b: 3.2  // exponential coefficient
  };

  /**
   * Main carbon calculation using CarbonLink's simplified equation
   * ΔCWP,t = (Carbon_API,t × Project_Area) × (44/12) × Confidence_Factor
   */
  static calculateCarbonCredits(data) {
    // Calculate carbon density from NDVI using regression model
    const carbonDensity = this.calculateCarbonDensityFromNDVI(data.ndvi);
    
    // Calculate confidence factor based on data quality
    const confidenceFactor = this.calculateConfidenceFactor(data);
    
    // Calculate uncertainty
    const uncertainty = this.calculateUncertainty(data);
    
    // Main carbon stock calculation
    const carbonStock = carbonDensity * data.projectArea * confidenceFactor;
    
    // Convert to CO2 equivalent
    const co2Equivalent = carbonStock * this.CARBON_TO_CO2_RATIO;
    
    // Calculate breakdown
    const breakdown = this.calculateBreakdown(data, carbonStock);
    
    return {
      carbonStock: Math.max(0, carbonStock),
      co2Equivalent: Math.max(0, co2Equivalent),
      uncertainty: Math.min(100, Math.max(this.MIN_UNCERTAINTY * 100, uncertainty)),
      confidenceFactor,
      breakdown
    };
  }

  /**
   * Calculate carbon density from NDVI using regression model
   * Carbon_Stock = a × e^(b×NDVI)
   */
  static calculateCarbonDensityFromNDVI(ndvi) {
    const { a, b } = this.NDVI_CARBON_COEFFICIENTS;
    return a * Math.exp(b * ndvi);
  }

  /**
   * Calculate confidence factor based on data quality
   */
  static calculateConfidenceFactor(data) {
    let confidence = 1.0;
    
    // Satellite data quality (cloud cover impact)
    if (data.satelliteData.cloudCover > 50) {
      confidence *= 0.8; // Reduce confidence with high cloud cover
    } else if (data.satelliteData.cloudCover > 20) {
      confidence *= 0.9;
    }
    
    // Forest health impact
    confidence *= data.satelliteData.forestHealth;
    
    // Weather data quality (extreme conditions reduce confidence)
    const temp = data.weatherData.temperature;
    if (temp < -10 || temp > 40) {
      confidence *= 0.85; // Extreme temperatures
    }
    
    // Soil moisture optimal range (0.6-0.8)
    const soilMoisture = data.soilData.moisture;
    if (soilMoisture >= 0.6 && soilMoisture <= 0.8) {
      confidence *= 1.05; // Optimal conditions
    } else if (soilMoisture < 0.4 || soilMoisture > 0.9) {
      confidence *= 0.9; // Poor conditions
    }
    
    return Math.max(0.5, Math.min(1.0, confidence)); // Clamp between 0.5 and 1.0
  }

  /**
   * Calculate uncertainty using automated approach
   * UNC_automated,t = Data_Quality_Score × API_Confidence × Sensor_Reliability
   */
  static calculateUncertainty(data) {
    let uncertainty = 0.0;
    
    // Data quality score (based on cloud cover and sensor reliability)
    const dataQualityScore = 1 - (data.satelliteData.cloudCover / 100);
    
    // API confidence (simplified - in real implementation would come from API providers)
    const apiConfidence = 0.85; // Assume 85% confidence from satellite APIs
    
    // Sensor reliability (based on data consistency)
    const sensorReliability = this.calculateSensorReliability(data);
    
    // Calculate total uncertainty
    uncertainty = (1 - dataQualityScore * apiConfidence * sensorReliability) * 100;
    
    // Apply minimum deduction
    uncertainty = Math.max(uncertainty, this.MIN_UNCERTAINTY * 100);
    
    return uncertainty;
  }

  /**
   * Calculate sensor reliability based on data consistency
   */
  static calculateSensorReliability(data) {
    let reliability = 1.0;
    
    // Check for extreme values that might indicate sensor issues
    if (data.soilData.moisture < 0 || data.soilData.moisture > 1) {
      reliability *= 0.7; // Invalid soil moisture
    }
    
    if (data.weatherData.temperature < -50 || data.weatherData.temperature > 60) {
      reliability *= 0.8; // Extreme temperature readings
    }
    
    if (data.ndvi < 0 || data.ndvi > 1) {
      reliability *= 0.6; // Invalid NDVI
    }
    
    return Math.max(0.5, reliability);
  }

  /**
   * Calculate breakdown of carbon stock components
   */
  static calculateBreakdown(data, totalCarbon) {
    // Biomass component (above-ground)
    const biomassRatio = 0.76; // 76% of total carbon is typically above-ground
    const biomass = totalCarbon * biomassRatio;
    
    // Soil component (below-ground)
    const soilRatio = 0.24; // 24% is typically below-ground
    const soil = totalCarbon * soilRatio;
    
    // Environmental adjustments
    const environmental = totalCarbon * (1 - biomassRatio - soilRatio);
    
    return {
      biomass: Math.max(0, biomass),
      soil: Math.max(0, soil),
      environmental: Math.max(0, environmental)
    };
  }

  /**
   * Calculate performance benchmark
   * Automated_Benchmark = Control_Area_NDVI_Change / Project_Area_NDVI_Change
   */
  static calculatePerformanceBenchmark(
    projectNDVI,
    controlNDVI,
    projectNDVIPrevious,
    controlNDVIPrevious
  ) {
    const projectChange = projectNDVI - projectNDVIPrevious;
    const controlChange = controlNDVI - controlNDVIPrevious;
    
    if (controlChange === 0) return 1.0; // Avoid division by zero
    
    return projectChange / controlChange;
  }

  /**
   * Validate input data
   */
  static validateData(data) {
    const errors = [];
    
    if (data.ndvi < 0 || data.ndvi > 1) {
      errors.push("NDVI must be between 0 and 1");
    }
    
    if (data.projectArea <= 0) {
      errors.push("Project area must be greater than 0");
    }
    
    if (data.soilData.moisture < 0 || data.soilData.moisture > 1) {
      errors.push("Soil moisture must be between 0 and 1");
    }
    
    if (data.satelliteData.cloudCover < 0 || data.satelliteData.cloudCover > 100) {
      errors.push("Cloud cover must be between 0 and 100");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate carbon credits based on NDVI change over time (carbon offset)
   * ΔCWP,t = (Carbon_Stock_End - Carbon_Stock_Start) × Project_Area × (44/12) × Confidence_Factor
   */
  static calculateCarbonOffsetCredits(data) {
    if (!data.ndviStart || !data.ndviEnd) {
      throw new Error("Both start and end NDVI values are required for carbon offset calculation");
    }

    // Calculate carbon density from NDVI using regression model for both dates
    const carbonDensityStart = this.calculateCarbonDensityFromNDVI(data.ndviStart);
    const carbonDensityEnd = this.calculateCarbonDensityFromNDVI(data.ndviEnd);
    
    // Calculate carbon stock change
    const carbonStockStart = carbonDensityStart * data.projectArea;
    const carbonStockEnd = carbonDensityEnd * data.projectArea;
    const carbonStockChange = carbonStockEnd - carbonStockStart;
    
    // Calculate confidence factor based on data quality
    const confidenceFactor = this.calculateConfidenceFactor(data);
    
    // Calculate uncertainty for the change
    const uncertainty = this.calculateUncertainty(data);
    
    // Apply confidence factor to the carbon stock change
    const adjustedCarbonStockChange = carbonStockChange * confidenceFactor;
    
    // Convert to CO2 equivalent
    const co2Equivalent = adjustedCarbonStockChange * this.CARBON_TO_CO2_RATIO;
    
    // Calculate breakdown
    const breakdown = {
      carbonStockStart: Math.max(0, carbonStockStart),
      carbonStockEnd: Math.max(0, carbonStockEnd),
      carbonStockChange: carbonStockChange,
      carbonDensityStart: carbonDensityStart,
      carbonDensityEnd: carbonDensityEnd,
      ndviStart: data.ndviStart,
      ndviEnd: data.ndviEnd,
      ndviChange: data.ndviEnd - data.ndviStart,
      projectArea: data.projectArea,
      confidenceFactor: confidenceFactor,
      carbonToCO2Ratio: this.CARBON_TO_CO2_RATIO
    };
    
    return {
      carbonStockStart: Math.max(0, carbonStockStart),
      carbonStockEnd: Math.max(0, carbonStockEnd),
      carbonStockChange: carbonStockChange,
      co2Equivalent: Math.max(0, co2Equivalent),
      uncertainty: Math.min(100, Math.max(this.MIN_UNCERTAINTY * 100, uncertainty)),
      confidenceFactor,
      breakdown,
      calculationType: 'carbon_offset',
      startDate: data.startDate,
      endDate: data.endDate
    };
  }

  /**
   * Calculate carbon sequestration from biomass growth
   * Based on VM0047 methodology with IoT enhancements
   */
  calculateBiomassGrowth(satellite, weather, soil, projectType) {
    // Base biomass growth rate (t/ha/year)
    let baseGrowthRate = 0;
    
    switch (projectType) {
      case 'reforestation':
        baseGrowthRate = 8.5; // Mature forest growth
        break;
      case 'afforestation':
        baseGrowthRate = 12.0; // Fast-growing species
        break;
      case 'forest-conservation':
        baseGrowthRate = 6.0; // Existing forest maintenance
        break;
      case 'agroforestry':
        baseGrowthRate = 4.5; // Mixed agricultural-forest system
        break;
      default:
        baseGrowthRate = 8.0;
    }
    
    // NDVI factor (vegetation health)
    const ndviFactor = Math.max(0.1, Math.min(2.0, satellite.ndvi / 0.5));
    
    // EVI factor (enhanced vegetation index)
    const eviFactor = Math.max(0.1, Math.min(2.0, satellite.evi / 0.3));
    
    // Temperature factor (optimal growth at 25°C)
    const tempFactor = this.calculateTemperatureFactor(weather.temperature);
    
    // Rainfall factor (optimal at 1500mm/year)
    const rainfallFactor = this.calculateRainfallFactor(weather.rainfall);
    
    // Soil moisture factor
    const moistureFactor = Math.max(0.1, Math.min(1.5, soil.moisture / 40));
    
    // Soil fertility factor (based on N, P, K)
    const fertilityFactor = this.calculateSoilFertilityFactor(soil);
    
    // Calculate adjusted growth rate
    const adjustedGrowthRate = baseGrowthRate * 
      ndviFactor * 
      eviFactor * 
      tempFactor * 
      rainfallFactor * 
      moistureFactor * 
      fertilityFactor;
    
    // Convert to carbon (tC/ha/year)
    const carbonGrowth = adjustedGrowthRate * CARBON_CONSTANTS.BIOMASS_TO_CARBON;
    
    // Convert to CO2 equivalent (tCO2e/ha/year)
    return carbonGrowth * CARBON_CONSTANTS.CARBON_TO_CO2;
  }
  
  /**
   * Calculate soil carbon sequestration
   */
  calculateSoilCarbonSequestration(soil, weather, projectType) {
    // Base soil carbon sequestration rate (tC/ha/year)
    let baseSequestration = 0.5; // Conservative estimate
    
    // Organic matter factor
    const organicMatterFactor = Math.max(0.5, Math.min(2.0, soil.organicMatter / 3));
    
    // pH factor (optimal at 6.5)
    const phFactor = this.calculatePHFactor(soil.ph);
    
    // Temperature factor (soil carbon decomposition)
    const soilTempFactor = this.calculateSoilTemperatureFactor(soil.temperature);
    
    // Moisture factor (optimal at 40%)
    const soilMoistureFactor = Math.max(0.1, Math.min(1.5, soil.moisture / 40));
    
    // Calculate adjusted sequestration
    const adjustedSequestration = baseSequestration * 
      organicMatterFactor * 
      phFactor * 
      soilTempFactor * 
      soilMoistureFactor;
    
    // Convert to CO2 equivalent
    return adjustedSequestration * CARBON_CONSTANTS.CARBON_TO_CO2;
  }
  
  /**
   * Calculate baseline emissions (what would happen without the project)
   */
  calculateBaselineEmissions(baselineScenario, satellite, fire) {
    let baselineRate = 0;
    
    switch (baselineScenario) {
      case 'business-as-usual':
        baselineRate = 2.0; // tCO2e/ha/year
        break;
      case 'deforestation':
        baselineRate = 15.0; // High emissions from deforestation
        break;
      case 'degradation':
        baselineRate = 8.0; // Moderate emissions from degradation
        break;
      default:
        baselineRate = 5.0;
    }
    
    // Fire risk factor
    const fireRiskFactor = 1 + (fire.fireRisk * 2); // Double emissions if high fire risk
    
    // Biomass factor (more biomass = more potential emissions)
    const biomassFactor = Math.max(0.5, Math.min(2.0, satellite.biomass / 10000));
    
    return baselineRate * fireRiskFactor * biomassFactor;
  }
  
  /**
   * Calculate project emissions (emissions from project activities)
   */
  calculateProjectEmissions(projectType, weather) {
    let projectRate = 0;
    
    switch (projectType) {
      case 'reforestation':
        projectRate = 1.5; // Low emissions from planting
        break;
      case 'afforestation':
        projectRate = 2.0; // Moderate emissions from land preparation
        break;
      case 'forest-conservation':
        projectRate = 0.5; // Very low emissions
        break;
      case 'agroforestry':
        projectRate = 3.0; // Higher emissions from agricultural activities
        break;
      default:
        projectRate = 1.0;
    }
    
    // Weather factor (more emissions in extreme weather)
    const weatherFactor = this.calculateWeatherEmissionFactor(weather);
    
    return projectRate * weatherFactor;
  }
  
  /**
   * Calculate leakage (emissions displaced to other areas)
   */
  calculateLeakage(projectType, baselineScenario) {
    let leakageRate = 0;
    
    // Leakage is higher for conservation projects
    if (projectType === 'forest-conservation') {
      leakageRate = 0.3; // 30% of avoided emissions
    } else {
      leakageRate = 0.1; // 10% for other project types
    }
    
    // Higher leakage for deforestation baseline
    if (baselineScenario === 'deforestation') {
      leakageRate *= 1.5;
    }
    
    return leakageRate;
  }
  
  /**
   * Calculate confidence level based on data quality
   */
  calculateConfidence(weather, satellite, soil, fire) {
    let confidence = 0.7; // Base confidence
    
    // Weather data quality
    if (weather.temperature > 0 && weather.humidity > 0) {
      confidence += 0.1;
    }
    
    // Satellite data quality
    if (satellite.ndvi > 0 && satellite.evi > 0) {
      confidence += 0.1;
    }
    
    // Soil data quality
    if (soil.moisture > 0 && soil.ph > 0) {
      confidence += 0.1;
    }
    
    // Fire data quality
    if (fire.fireRisk >= 0) {
      confidence += 0.05;
    }
    
    return Math.min(0.95, confidence);
  }
  
  /**
   * Calculate uncertainty range
   */
  calculateUncertainty(confidence) {
    return (1 - confidence) * 100; // Convert to percentage
  }
  
  // Helper functions for environmental factors
  calculateTemperatureFactor(temperature) {
    const tempDiff = Math.abs(temperature - CARBON_CONSTANTS.TEMPERATURE_OPTIMUM);
    return Math.max(0.1, 1 - (tempDiff / 20));
  }
  
  calculateRainfallFactor(rainfall) {
    const rainfallDiff = Math.abs(rainfall - CARBON_CONSTANTS.RAINFALL_OPTIMUM);
    return Math.max(0.1, 1 - (rainfallDiff / 2000));
  }
  
  calculateSoilFertilityFactor(soil) {
    const nitrogenFactor = Math.min(1.5, soil.nitrogen / 100);
    const phosphorusFactor = Math.min(1.5, soil.phosphorus / 20);
    const potassiumFactor = Math.min(1.5, soil.potassium / 150);
    
    return (nitrogenFactor + phosphorusFactor + potassiumFactor) / 3;
  }
  
  calculatePHFactor(ph) {
    const optimalPH = 6.5;
    const phDiff = Math.abs(ph - optimalPH);
    return Math.max(0.1, 1 - (phDiff / 3));
  }
  
  calculateSoilTemperatureFactor(temperature) {
    // Lower temperatures reduce decomposition
    return Math.max(0.1, Math.min(1.5, temperature / 20));
  }
  
  calculateWeatherEmissionFactor(weather) {
    let factor = 1.0;
    
    // High temperatures increase emissions
    if (weather.temperature > 30) {
      factor += 0.2;
    }
    
    // High wind speeds can increase emissions
    if (weather.windSpeed > 8) {
      factor += 0.1;
    }
    
    return factor;
  }
  
  /**
   * Main calculation method
   */
  calculateCarbonOffset(input) {
    // Calculate sequestration components
    const biomassGrowth = this.calculateBiomassGrowth(
      input.satellite,
      input.weather,
      input.soil,
      input.projectType
    );
    
    const soilCarbon = this.calculateSoilCarbonSequestration(
      input.soil,
      input.weather,
      input.projectType
    );
    
    const totalSequestration = biomassGrowth + soilCarbon;
    
    // Calculate emission components
    const baselineEmissions = this.calculateBaselineEmissions(
      input.baselineScenario,
      input.satellite,
      input.fire
    );
    
    const projectEmissions = this.calculateProjectEmissions(
      input.projectType,
      input.weather
    );
    
    const leakage = this.calculateLeakage(
      input.projectType,
      input.baselineScenario
    ) * baselineEmissions;
    
    const totalEmissions = baselineEmissions + projectEmissions + leakage;
    
    // Calculate net balance
    const netCarbonBalance = totalSequestration - totalEmissions;
    const totalProjectCarbon = netCarbonBalance * input.projectArea * input.projectDuration;
    
    // Calculate confidence and uncertainty
    const confidence = this.calculateConfidence(
      input.weather,
      input.satellite,
      input.soil,
      input.fire
    );
    
    const uncertainty = this.calculateUncertainty(confidence);
    
    return {
      sequestration: {
        biomassGrowth,
        soilCarbon,
        totalSequestration,
      },
      emissions: {
        baselineEmissions,
        projectEmissions,
        leakage,
        totalEmissions,
      },
      netCarbonBalance,
      totalProjectCarbon,
      confidence,
      uncertainty,
      timestamp: new Date(),
    };
  }
  
  /**
   * Calculate carbon offset for a specific location and time period
   */
  async calculateOffsetForLocation(location, projectArea, projectDuration, baselineScenario = 'business-as-usual', projectType = 'reforestation') {
    // This would integrate with the DataSourceManager
    // For now, we'll use mock data
    const mockWeather = {
      temperature: 25,
      humidity: 70,
      rainfall: 1200,
      windSpeed: 5,
      solarRadiation: 600,
      timestamp: new Date(),
    };
    
    const mockSatellite = {
      ndvi: 0.6,
      evi: 0.4,
      lai: 2.5,
      biomass: 12000,
      timestamp: new Date(),
    };
    
    const mockSoil = {
      moisture: 35,
      temperature: 18,
      ph: 6.2,
      organicMatter: 3.5,
      nitrogen: 80,
      phosphorus: 25,
      potassium: 180,
      timestamp: new Date(),
    };
    
    const mockFire = {
      fireRisk: 0.1,
      activeFires: 0,
      burnedArea: 0,
      timestamp: new Date(),
    };
    
    const input = {
      location,
      weather: mockWeather,
      satellite: mockSatellite,
      soil: mockSoil,
      fire: mockFire,
      projectArea,
      projectDuration,
      baselineScenario,
      projectType,
    };
    
    return this.calculateCarbonOffset(input);
  }
}

// Export singleton instance
const carbonCalculator = new CarbonCalculator();

module.exports = {
  carbonCalculator,
  CarbonCalculator
}; 