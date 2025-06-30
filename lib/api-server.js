const express = require('express');
const cors = require('cors');
const { config, validateConfig } = require('./config');
const { dataSourceManager } = require('./data-sources');
const { carbonCalculator } = require('./carbon-calculator');
const { chainlinkFunctionsIntegration } = require('./chainlink-functions-integration');
const { smartContractIntegration } = require('./smart-contract-integration');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize backend components
let isInitialized = false;

async function initializeBackend() {
  if (isInitialized) return;
  
  try {
    console.log('🚀 Initializing CarbonLink Backend API...');
    validateConfig();
    
    // Initialize smart contracts
    await smartContractIntegration.initializeContracts();
    
    // Initialize Chainlink Functions
    if (config.privateKey) {
      await chainlinkFunctionsIntegration.initializeRouter();
    }
    
    isInitialized = true;
    console.log('✅ Backend API initialized successfully');
  } catch (error) {
    console.error('❌ Backend initialization failed:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await initializeBackend();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        dataSources: true,
        carbonCalculator: true,
        smartContracts: isInitialized,
        chainlinkFunctions: config.privateKey ? true : false
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get carbon offset calculation
app.post('/api/calculate-carbon', async (req, res) => {
  try {
    await initializeBackend();
    
    const { location, projectArea, projectDuration, baselineScenario, projectType } = req.body;
    
    if (!location || !projectArea || !projectDuration) {
      return res.status(400).json({
        error: 'Missing required fields: location, projectArea, projectDuration'
      });
    }

    console.log('🧮 Calculating carbon offset for:', { location, projectArea, projectDuration, projectType });

    // Fetch all data
    const allData = await dataSourceManager.getAllData(location);
    
    // Calculate carbon offset
    const calculationInput = {
      ...allData,
      location,
      projectArea: parseFloat(projectArea),
      projectDuration: parseFloat(projectDuration),
      baselineScenario: baselineScenario || 'business-as-usual',
      projectType: projectType || 'reforestation'
    };
    
    const result = carbonCalculator.calculateCarbonOffset(calculationInput);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Carbon calculation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create new project
app.post('/api/projects', async (req, res) => {
  try {
    await initializeBackend();
    
    const { name, location, area, projectType, ownerAddress } = req.body;
    
    if (!name || !location || !area || !ownerAddress) {
      return res.status(400).json({
        error: 'Missing required fields: name, location, area, ownerAddress'
      });
    }

    console.log('🏗️ Creating project:', { name, location, area, projectType, ownerAddress });

    // Create project on blockchain
    const createResult = await smartContractIntegration.createProject(name, location, area);
    
    // Calculate initial carbon offset
    const allData = await dataSourceManager.getAllData(location);
    const calculationInput = {
      ...allData,
      location,
      projectArea: parseFloat(area),
      projectDuration: 1,
      baselineScenario: 'business-as-usual',
      projectType: projectType || 'reforestation'
    };
    
    const carbonResult = carbonCalculator.calculateCarbonOffset(calculationInput);
    
    res.json({
      success: true,
      data: {
        project: {
          name,
          location,
          area: parseFloat(area),
          projectType,
          ownerAddress,
          transactionHash: createResult.transactionHash,
          createdAt: new Date().toISOString()
        },
        carbonOffset: carbonResult,
        projectAddress: createResult.projectAddress
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Project creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get project details
app.get('/api/projects/:projectId', async (req, res) => {
  try {
    await initializeBackend();
    
    const { projectId } = req.params;
    
    console.log('📋 Getting project details for:', projectId);

    // For now, we'll use the projectId as the address or get it from a mapping
    // In a real implementation, you'd have a mapping of projectId to projectAddress
    const projectAddress = projectId; // Assuming projectId is the address for now

    // Get project info from blockchain
    const projectInfo = await smartContractIntegration.getProjectInfo(projectAddress);
    
    // Calculate current carbon offset
    const location = {
      latitude: parseFloat(projectInfo.location.split(',')[0]),
      longitude: parseFloat(projectInfo.location.split(',')[1]),
      elevation: 10 // Default elevation
    };
    
    const allData = await dataSourceManager.getAllData(location);
    const calculationInput = {
      ...allData,
      location,
      projectArea: parseFloat(projectInfo.area),
      projectDuration: 1,
      baselineScenario: 'business-as-usual',
      projectType: projectInfo.projectType || 'reforestation'
    };
    
    const carbonResult = carbonCalculator.calculateCarbonOffset(calculationInput);
    
    res.json({
      success: true,
      data: {
        project: {
          id: projectId,
          name: projectInfo.name,
          location: {
            lat: location.latitude,
            lng: location.longitude
          },
          area: parseFloat(projectInfo.area),
          startDate: projectInfo.startDate,
          status: 'Verified',
          carbonBalance: parseFloat(projectInfo.carbonBalance)
        },
        carbonOffset: carbonResult,
        verificationHistory: [
          {
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ndvi: allData.satellite.ndvi,
            carbon: carbonResult.totalProjectCarbon,
            credits: Math.floor(carbonResult.totalProjectCarbon * 0.85), // 85% available, 15% buffer
            buffer: Math.floor(carbonResult.totalProjectCarbon * 0.15),
            status: 'Pending'
          }
        ]
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Project details error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Refresh carbon offset progress
app.post('/api/projects/:projectId/refresh', async (req, res) => {
  try {
    await initializeBackend();
    
    const { projectId } = req.params;
    
    console.log('🔄 Refreshing carbon offset for project:', projectId);

    // For now, we'll use the projectId as the address
    const projectAddress = projectId;

    // Get project info
    const projectInfo = await smartContractIntegration.getProjectInfo(projectAddress);
    
    // Get fresh data
    const location = {
      latitude: parseFloat(projectInfo.location.split(',')[0]),
      longitude: parseFloat(projectInfo.location.split(',')[1]),
      elevation: 10
    };
    
    const allData = await dataSourceManager.getAllData(location);
    const calculationInput = {
      ...allData,
      location,
      projectArea: parseFloat(projectInfo.area),
      projectDuration: 1,
      baselineScenario: 'business-as-usual',
      projectType: projectInfo.projectType || 'reforestation'
    };
    
    const carbonResult = carbonCalculator.calculateCarbonOffset(calculationInput);
    
    // Update carbon balance on blockchain
    await smartContractIntegration.updateCarbonBalance(
      projectAddress,
      carbonResult.totalProjectCarbon
    );
    
    res.json({
      success: true,
      data: {
        carbonOffset: carbonResult,
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Carbon refresh error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mint carbon tokens
app.post('/api/projects/:projectId/mint', async (req, res) => {
  try {
    await initializeBackend();
    
    const { projectId } = req.params;
    const { recipientAddress, amount } = req.body;
    
    if (!recipientAddress || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: recipientAddress, amount'
      });
    }

    console.log('🪙 Minting tokens for project:', { projectId, recipientAddress, amount });

    // Mint tokens on blockchain
    const mintResult = await smartContractIntegration.mintTokens(recipientAddress, amount);
    
    // Update carbon balance (reduce by minted amount)
    const currentBalance = await smartContractIntegration.getCarbonBalance();
    const newBalance = Math.max(0, parseFloat(currentBalance) - parseFloat(amount));
    await smartContractIntegration.updateCarbonBalance(config.projectContractAddress, newBalance);
    
    res.json({
      success: true,
      data: {
        transactionHash: mintResult.transactionHash,
        recipientAddress,
        amount: parseFloat(amount),
        newBalance,
        mintedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Token minting error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Submit to Chainlink Functions
app.post('/api/chainlink/submit', async (req, res) => {
  try {
    await initializeBackend();
    
    const { location, projectArea, projectDuration, baselineScenario, projectType } = req.body;
    
    if (!location || !projectArea || !projectDuration) {
      return res.status(400).json({
        error: 'Missing required fields: location, projectArea, projectDuration'
      });
    }

    console.log('🔗 Submitting to Chainlink Functions:', { location, projectArea, projectDuration });

    // Submit to Chainlink Functions
    const requestId = await chainlinkFunctionsIntegration.submitCarbonCalculation(
      location,
      projectArea,
      projectDuration,
      baselineScenario || 'business-as-usual',
      projectType || 'reforestation'
    );
    
    res.json({
      success: true,
      data: {
        requestId,
        submittedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Chainlink submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get Chainlink Functions result
app.get('/api/chainlink/result/:requestId', async (req, res) => {
  try {
    await initializeBackend();
    
    const { requestId } = req.params;
    
    console.log('📊 Getting Chainlink result for:', requestId);

    const result = await chainlinkFunctionsIntegration.getRequestResult(requestId);
    
    if (!result) {
      return res.json({
        success: true,
        data: {
          status: 'pending',
          requestId
        },
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: {
        status: 'completed',
        result,
        requestId
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Chainlink result error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 CarbonLink API Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app; 