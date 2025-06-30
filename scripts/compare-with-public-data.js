require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Reference data from scientific sources
const referenceData = {
  amazonRainforest: {
    location: "Amazon Rainforest (Manaus, Brazil)",
    coordinates: { lat: -3.4653, lng: -58.3801 },
    scientificReferences: {
      ndvi: {
        range: "0.7-0.9",
        source: "NASA MODIS, ESA Sentinel-2 studies",
        description: "Dense tropical rainforest typically shows very high NDVI values"
      },
      canopyCover: {
        range: "85-95%",
        source: "Global Forest Watch, FAO",
        description: "Tropical rainforests have very high canopy density"
      },
      carbonSequestration: {
        range: "200-400 tons CO2/ha/year",
        source: "IPCC, Nature studies",
        description: "Tropical forests are among the highest carbon sequestering ecosystems"
      }
    }
  }
};

// Our API results from the capture script
const ourAPIData = {
  location: "Amazon Rainforest (Manaus, Brazil)",
  coordinates: { lat: -3.4653, lng: -58.3801 },
  apiResults: [
    { date: "2024-06-05", ndvi: 0.6626, source: "Sentinel Hub API" },
    { date: "2024-06-10", ndvi: 1.0000, source: "Sentinel Hub API" },
    { date: "2024-06-15", ndvi: 0.1953, source: "Sentinel Hub API" },
    { date: "2024-06-20", ndvi: 0.7667, source: "Sentinel Hub API" },
    { date: "2024-06-25", ndvi: 0.6606, source: "Sentinel Hub API" }
  ]
};

function analyzeAccuracy() {
  console.log('🔍 CarbonLink API vs Public Reference Data Comparison\n');
  console.log('📍 Location: Amazon Rainforest (Manaus, Brazil)');
  console.log('   Coordinates: -3.4653, -58.3801\n');

  // Reference expectations
  console.log('📚 SCIENTIFIC REFERENCE DATA:');
  console.log(`   Expected NDVI Range: ${referenceData.amazonRainforest.scientificReferences.ndvi.range}`);
  console.log(`   Source: ${referenceData.amazonRainforest.scientificReferences.ndvi.source}`);
  console.log(`   Description: ${referenceData.amazonRainforest.scientificReferences.ndvi.description}\n`);

  // Our API results
  console.log('🛰️  OUR SENTINEL HUB API RESULTS:');
  ourAPIData.apiResults.forEach(result => {
    console.log(`   ${result.date}: NDVI = ${result.ndvi.toFixed(4)}`);
  });

  // Analysis
  console.log('\n📊 ACCURACY ANALYSIS:');
  
  const [minExpected, maxExpected] = referenceData.amazonRainforest.scientificReferences.ndvi.range.split('-').map(Number);
  let accurateCount = 0;
  let totalCount = 0;

  ourAPIData.apiResults.forEach(result => {
    const isAccurate = result.ndvi >= minExpected && result.ndvi <= maxExpected;
    const status = isAccurate ? '✅' : '❌';
    console.log(`   ${status} ${result.date}: ${result.ndvi.toFixed(4)} (Expected: ${minExpected}-${maxExpected})`);
    
    if (isAccurate) accurateCount++;
    totalCount++;
  });

  const accuracyRate = (accurateCount / totalCount) * 100;
  console.log(`\n   Overall Accuracy: ${accuracyRate.toFixed(1)}% (${accurateCount}/${totalCount} accurate)`);

  // Detailed analysis
  console.log('\n🔍 DETAILED ANALYSIS:');
  
  // Check for data quality issues
  const uniqueValues = [...new Set(ourAPIData.apiResults.map(r => r.ndvi))];
  console.log(`   Unique NDVI values: ${uniqueValues.length}`);
  
  if (uniqueValues.length < 3) {
    console.log('   ⚠️  Warning: Limited NDVI variation - may indicate data processing issues');
  }

  // Check for extreme values
  const extremeValues = ourAPIData.apiResults.filter(r => r.ndvi < 0.1 || r.ndvi > 0.95);
  if (extremeValues.length > 0) {
    console.log('   ⚠️  Warning: Extreme NDVI values detected:');
    extremeValues.forEach(v => {
      console.log(`      ${v.date}: ${v.ndvi.toFixed(4)} (${v.ndvi < 0.1 ? 'Very low' : 'Very high'})`);
    });
  }

  // Compare with known patterns
  console.log('\n🌍 COMPARISON WITH KNOWN PATTERNS:');
  
  // Amazon rainforest should have consistently high NDVI
  const averageNDVI = ourAPIData.apiResults.reduce((sum, r) => sum + r.ndvi, 0) / ourAPIData.apiResults.length;
  console.log(`   Average NDVI: ${averageNDVI.toFixed(4)}`);
  
  if (averageNDVI >= 0.7) {
    console.log('   ✅ Average NDVI matches tropical rainforest expectations');
  } else if (averageNDVI >= 0.5) {
    console.log('   ⚠️  Average NDVI is moderate - may indicate seasonal variation or data issues');
  } else {
    console.log('   ❌ Average NDVI is too low for tropical rainforest');
  }

  // Seasonal variation analysis
  const sortedResults = [...ourAPIData.apiResults].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstNDVI = sortedResults[0].ndvi;
  const lastNDVI = sortedResults[sortedResults.length - 1].ndvi;
  const variation = Math.abs(lastNDVI - firstNDVI);
  
  console.log(`   NDVI variation over time: ${variation.toFixed(4)}`);
  if (variation > 0.3) {
    console.log('   ⚠️  High NDVI variation - may indicate cloud cover, seasonal changes, or data quality issues');
  } else {
    console.log('   ✅ Stable NDVI values - consistent with dense forest');
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (accuracyRate >= 80) {
    console.log('   ✅ API data shows good agreement with scientific references');
  } else if (accuracyRate >= 60) {
    console.log('   ⚠️  API data shows moderate agreement - investigate data quality');
  } else {
    console.log('   ❌ API data shows poor agreement - significant data quality issues detected');
  }

  console.log('\n   Potential improvements:');
  console.log('   - Investigate cloud filtering in Sentinel Hub processing');
  console.log('   - Check for seasonal variations in the Amazon region');
  console.log('   - Verify polygon size and resolution settings');
  console.log('   - Compare with multiple satellite sources for validation');

  console.log('\n🎉 Analysis Complete!');
}

analyzeAccuracy(); 