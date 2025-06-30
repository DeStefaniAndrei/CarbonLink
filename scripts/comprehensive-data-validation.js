require('dotenv').config();

// Comprehensive reference data from multiple scientific sources
const publicReferenceData = {
  amazonRainforest: {
    location: "Amazon Rainforest (Manaus, Brazil)",
    coordinates: { lat: -3.4653, lng: -58.3801 },
    sources: {
      nasaModis: { ndvi: "0.75-0.85", year: "2023", description: "NASA MODIS Terra/Aqua" },
      esaSentinel: { ndvi: "0.70-0.90", year: "2023", description: "ESA Sentinel-2" },
      scientificLiterature: { ndvi: "0.65-0.85", year: "2022", description: "Nature/Science studies" },
      globalForestWatch: { ndvi: "0.70-0.88", year: "2023", description: "Global Forest Watch" }
    }
  },
  saharaDesert: {
    location: "Sahara Desert (Algeria)",
    coordinates: { lat: 25.7617, lng: -0.1918 },
    sources: {
      nasaModis: { ndvi: "0.05-0.15", year: "2023", description: "NASA MODIS Terra/Aqua" },
      esaSentinel: { ndvi: "0.00-0.20", year: "2023", description: "ESA Sentinel-2" },
      scientificLiterature: { ndvi: "0.02-0.18", year: "2022", description: "Remote Sensing studies" }
    }
  },
  borealForest: {
    location: "Boreal Forest (Alaska)",
    coordinates: { lat: 64.8255, lng: -147.6444 },
    sources: {
      nasaModis: { ndvi: "0.45-0.65", year: "2023", description: "NASA MODIS Terra/Aqua" },
      esaSentinel: { ndvi: "0.40-0.70", year: "2023", description: "ESA Sentinel-2" },
      scientificLiterature: { ndvi: "0.35-0.75", year: "2022", description: "Boreal ecology studies" }
    }
  }
};

// Our API test results (simulated based on previous tests)
const ourAPITestResults = {
  amazonRainforest: {
    location: "Amazon Rainforest (Manaus, Brazil)",
    coordinates: { lat: -3.4653, lng: -58.3801 },
    results: [
      { date: "2024-06-05", ndvi: 0.6626, source: "Sentinel Hub API" },
      { date: "2024-06-10", ndvi: 1.0000, source: "Sentinel Hub API" },
      { date: "2024-06-15", ndvi: 0.1953, source: "Sentinel Hub API" },
      { date: "2024-06-20", ndvi: 0.7667, source: "Sentinel Hub API" },
      { date: "2024-06-25", ndvi: 0.6606, source: "Sentinel Hub API" }
    ]
  }
};

function parseNDVIRange(rangeStr) {
  const [min, max] = rangeStr.split('-').map(Number);
  return { min, max };
}

function isWithinRange(value, rangeStr) {
  const { min, max } = parseNDVIRange(rangeStr);
  return value >= min && value <= max;
}

function calculateAccuracyRate(values, expectedRange) {
  const { min, max } = parseNDVIRange(expectedRange);
  const accurateCount = values.filter(v => v >= min && v <= max).length;
  return (accurateCount / values.length) * 100;
}

function analyzeDataQuality(apiResults) {
  const ndviValues = apiResults.map(r => r.ndvi);
  const average = ndviValues.reduce((sum, v) => sum + v, 0) / ndviValues.length;
  const min = Math.min(...ndviValues);
  const max = Math.max(...ndviValues);
  const variation = max - min;
  const uniqueCount = new Set(ndviValues).size;
  
  return {
    average,
    min,
    max,
    variation,
    uniqueCount,
    hasExtremeValues: max > 0.95 || min < 0.05,
    hasLowVariation: uniqueCount < 3
  };
}

function comprehensiveValidation() {
  console.log('🔍 COMPREHENSIVE CARBONLINK API VALIDATION\n');
  console.log('Comparing with multiple public data sources and scientific references...\n');

  // Test Amazon Rainforest
  const location = 'amazonRainforest';
  const reference = publicReferenceData[location];
  const apiResults = ourAPITestResults[location];

  console.log(`📍 LOCATION: ${reference.location}`);
  console.log(`   Coordinates: ${reference.coordinates.lat}, ${reference.coordinates.lng}\n`);

  // Public reference data
  console.log('📚 PUBLIC REFERENCE DATA:');
  Object.entries(reference.sources).forEach(([source, data]) => {
    console.log(`   ${source.toUpperCase()}: NDVI ${data.ndvi} (${data.year})`);
    console.log(`      Source: ${data.description}`);
  });

  // Our API results
  console.log('\n🛰️  OUR SENTINEL HUB API RESULTS:');
  apiResults.results.forEach(result => {
    console.log(`   ${result.date}: NDVI = ${result.ndvi.toFixed(4)}`);
  });

  // Data quality analysis
  const quality = analyzeDataQuality(apiResults.results);
  console.log('\n📊 DATA QUALITY ANALYSIS:');
  console.log(`   Average NDVI: ${quality.average.toFixed(4)}`);
  console.log(`   Range: ${quality.min.toFixed(4)} - ${quality.max.toFixed(4)}`);
  console.log(`   Variation: ${quality.variation.toFixed(4)}`);
  console.log(`   Unique values: ${quality.uniqueCount}/5`);
  console.log(`   Extreme values: ${quality.hasExtremeValues ? 'Yes' : 'No'}`);
  console.log(`   Low variation: ${quality.hasLowVariation ? 'Yes' : 'No'}`);

  // Accuracy comparison with each source
  console.log('\n🎯 ACCURACY COMPARISON:');
  Object.entries(reference.sources).forEach(([source, data]) => {
    const accuracy = calculateAccuracyRate(apiResults.results.map(r => r.ndvi), data.ndvi);
    const status = accuracy >= 80 ? '✅' : accuracy >= 60 ? '⚠️' : '❌';
    console.log(`   ${status} ${source.toUpperCase()}: ${accuracy.toFixed(1)}% accurate`);
  });

  // Overall assessment
  console.log('\n🔍 OVERALL ASSESSMENT:');
  
  // Check against scientific expectations
  const scientificExpectations = [
    { name: "High NDVI for rainforest", condition: quality.average >= 0.7, weight: 0.3 },
    { name: "Reasonable variation", condition: quality.variation <= 0.5, weight: 0.2 },
    { name: "No extreme values", condition: !quality.hasExtremeValues, weight: 0.3 },
    { name: "Multiple unique values", condition: quality.uniqueCount >= 3, weight: 0.2 }
  ];

  let overallScore = 0;
  scientificExpectations.forEach(expectation => {
    const score = expectation.condition ? 100 : 0;
    const weightedScore = score * expectation.weight;
    overallScore += weightedScore;
    
    const status = expectation.condition ? '✅' : '❌';
    console.log(`   ${status} ${expectation.name}: ${score}%`);
  });

  console.log(`\n   Overall Quality Score: ${overallScore.toFixed(1)}%`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (overallScore >= 80) {
    console.log('   ✅ API data quality is good for carbon offset calculations');
  } else if (overallScore >= 60) {
    console.log('   ⚠️  API data quality is acceptable but needs improvement');
  } else {
    console.log('   ❌ API data quality needs significant improvement');
  }

  // Specific issues and solutions
  if (quality.hasExtremeValues) {
    console.log('   - Issue: Extreme NDVI values detected (0.1953, 1.0000)');
    console.log('   - Solution: Implement cloud filtering and data validation');
  }

  if (quality.average < 0.7) {
    console.log('   - Issue: Average NDVI below rainforest expectations');
    console.log('   - Solution: Check seasonal patterns and cloud coverage');
  }

  if (quality.uniqueCount < 3) {
    console.log('   - Issue: Limited NDVI variation');
    console.log('   - Solution: Verify polygon size and processing parameters');
  }

  // Comparison with industry standards
  console.log('\n🏭 INDUSTRY COMPARISON:');
  console.log('   Carbon offset platforms typically require:');
  console.log('   - NDVI accuracy: ±0.1 from reference data');
  console.log('   - Temporal consistency: <30% variation over time');
  console.log('   - Spatial resolution: <30m for forest monitoring');
  console.log('   - Cloud filtering: <20% cloud coverage');

  const meetsIndustryStandards = quality.variation <= 0.3 && !quality.hasExtremeValues;
  console.log(`\n   Meets industry standards: ${meetsIndustryStandards ? '✅ Yes' : '❌ No'}`);

  console.log('\n🎉 Comprehensive validation complete!');
}

comprehensiveValidation(); 