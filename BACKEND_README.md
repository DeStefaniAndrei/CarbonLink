# CarbonLink Backend

The CarbonLink backend is a comprehensive system for tokenizing carbon credits using IoT sensors, satellite data, and blockchain smart contracts integrated with Chainlink Functions.

## 🏗️ Architecture

The backend consists of several key components:

### 1. Configuration Management (`lib/config.ts`)
- Loads environment variables
- Validates required configuration
- Provides typed configuration interface

### 2. Data Sources (`lib/data-sources.ts`)
- Fetches weather data from OpenWeather API
- Retrieves satellite data from Sentinel Hub
- Collects soil data (mock for MVP)
- Monitors fire data from NASA FIRMS
- Implements caching for performance
- Falls back to mock data when APIs unavailable

### 3. Carbon Calculator (`lib/carbon-calculator.ts`)
- Implements IoT-based carbon offset equations
- Based on Verra VM0047 methodology
- Calculates biomass growth, soil carbon, emissions
- Provides confidence and uncertainty metrics
- Supports multiple project types and baseline scenarios

### 4. Chainlink Functions Integration (`lib/chainlink-functions-integration.ts`)
- Generates Chainlink Functions source code
- Submits carbon calculations to decentralized oracle network
- Handles request/response lifecycle
- Integrates with your existing Chainlink credentials

### 5. Smart Contract Integration (`lib/smart-contract-integration.ts`)
- Manages project creation and lifecycle
- Handles carbon balance updates
- Mints carbon tokens
- Validates project parameters
- Connects to deployed upgradeable contracts

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Fill in your configuration:

```env
# Required: Smart Contract Configuration
RPC_URL=https://sepolia.infura.io/v3/your-project-id
PROJECT_CONTRACT_ADDRESS=0x... # After deploying
MANAGER_CONTRACT_ADDRESS=0x... # After deploying

# Required: Chainlink Functions Configuration
CHAINLINK_FUNCTIONS_ROUTER=0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C
CHAINLINK_DON_ID=0x66756e2d657468657265756d2d7365706f6c69612d310000000000000000
CHAINLINK_SUBSCRIPTION_ID=your_subscription_id_here

# Recommended: API Keys
OPENWEATHER_API_KEY=your_openweather_api_key_here
SENTINEL_API_KEY=your_sentinel_api_key_here

# Optional: Private Key (for transactions)
PRIVATE_KEY=your_private_key_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Deploy Smart Contracts

```bash
npm run deploy:sepolia
```

### 4. Test the Backend

```bash
npm run test:backend
```

## 📊 Carbon Calculation Methodology

The carbon calculator implements the following equations:

### Biomass Growth
```
Carbon_Sequestration = Base_Growth_Rate × NDVI_Factor × EVI_Factor × 
                      Temperature_Factor × Rainfall_Factor × 
                      Moisture_Factor × Fertility_Factor × 
                      Biomass_to_Carbon × Carbon_to_CO2
```

### Soil Carbon Sequestration
```
Soil_Carbon = Base_Sequestration × Organic_Matter_Factor × 
              pH_Factor × Temperature_Factor × Moisture_Factor × 
              Carbon_to_CO2
```

### Net Carbon Balance
```
Net_Carbon = Total_Sequestration - (Baseline_Emissions + 
             Project_Emissions + Leakage)
```

## 🔗 API Integration

### Weather Data (OpenWeather)
- Temperature, humidity, rainfall, wind speed
- Free tier available
- Automatic fallback to mock data

### Satellite Data (Sentinel Hub)
- NDVI, EVI, LAI, biomass estimates
- Requires API credentials
- Mock data fallback

### Fire Data (NASA FIRMS)
- Fire risk assessment
- Active fire detection
- Free API access

## 🏗️ Smart Contract Integration

### Project Creation
```javascript
const projectParams = {
  name: 'Amazon Reforestation',
  description: 'Large-scale reforestation project',
  location: { latitude: -3.4653, longitude: -58.3804, elevation: 50 },
  projectArea: 1000, // hectares
  projectDuration: 20, // years
  baselineScenario: 'deforestation',
  projectType: 'reforestation',
  initialCarbonBalance: 15.5
};

const projectAddress = await smartContractIntegration.createProject(projectParams);
```

### Carbon Balance Update
```javascript
await smartContractIntegration.updateCarbonBalance(projectAddress, 18.2);
```

### Token Minting
```javascript
await smartContractIntegration.mintTokens(projectAddress, 18200);
```

## 🔗 Chainlink Functions Integration

### Generate Source Code
```javascript
const sourceCode = chainlinkFunctionsIntegration.generateCarbonCalculationSource();
```

### Submit Calculation
```javascript
const result = await chainlinkFunctionsIntegration.calculateCarbonOffsetOnChain(
  location,
  projectArea,
  projectDuration,
  baselineScenario,
  projectType
);
```

## 📈 Data Sources and Sensors

### IoT Sensors
- **Dendrometers**: Tree growth measurement
- **Soil sensors**: Moisture, temperature, pH
- **Weather stations**: Local climate data
- **GPS**: Precise location tracking

### Satellite Data
- **Sentinel-2**: NDVI, EVI, LAI
- **Planet Labs**: High-resolution imagery
- **Landsat**: Historical data analysis

### APIs
- **OpenWeather**: Current weather conditions
- **NASA FIRMS**: Fire monitoring
- **Copernicus**: Global land services

## 🧪 Testing

### Run All Tests
```bash
npm run test:backend
```

### Test Individual Components
```javascript
// Test data sources
const data = await dataSourceManager.getAllData(location);

// Test carbon calculations
const result = carbonCalculator.calculateCarbonOffset(input);

// Test smart contracts
const projects = await smartContractIntegration.getAllProjects();
```

## 🔧 Configuration Options

### Project Types
- `reforestation`: Planting trees on previously forested land
- `afforestation`: Planting trees on land not previously forested
- `forest-conservation`: Protecting existing forests
- `agroforestry`: Mixed agricultural-forest systems

### Baseline Scenarios
- `business-as-usual`: Current land use continues
- `deforestation`: Land would be cleared without project
- `degradation`: Forest quality would decline

### Confidence Factors
- Weather data quality: +10%
- Satellite data quality: +10%
- Soil data quality: +10%
- Fire data quality: +5%

## 🚨 Error Handling

The backend includes comprehensive error handling:

- **API failures**: Automatic fallback to mock data
- **Network issues**: Retry mechanisms with exponential backoff
- **Invalid inputs**: Validation with descriptive error messages
- **Contract errors**: Detailed transaction failure information

## 📊 Performance

- **Data caching**: 5-minute cache for API responses
- **Parallel processing**: Concurrent data fetching
- **Optimized calculations**: Efficient mathematical operations
- **Memory management**: Proper cleanup of large datasets

## 🔒 Security

- **Environment variables**: Sensitive data stored securely
- **Input validation**: All user inputs validated
- **Error sanitization**: No sensitive data in error messages
- **Rate limiting**: API call throttling

## 🚀 Production Deployment

### Prerequisites
1. Deploy smart contracts to mainnet
2. Set up Chainlink Functions subscription
3. Configure production API keys
4. Set up monitoring and logging

### Environment Variables
```env
NODE_ENV=production
LOG_LEVEL=info
LOG_FILE=true
```

### Monitoring
- Carbon calculation accuracy
- API response times
- Contract transaction success rates
- Error rates and types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the test files
- Open an issue on GitHub
- Contact the development team

---

**CarbonLink Backend** - Tokenizing carbon credits with IoT, satellite data, and blockchain technology. 