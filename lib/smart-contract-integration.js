/**
 * CarbonLink Smart Contract Integration
 * Connects carbon calculations to deployed smart contracts
 */

const { ethers } = require('ethers');
const { config } = require('./config');

class SmartContractIntegration {
  constructor() {
    // Initialize provider
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    
    // Initialize signer if private key is provided
    if (config.privateKey) {
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
    }
    
    // Contract instances
    this.mainManager = null;
    this.factory = null;
  }

  /**
   * Initialize smart contracts
   */
  async initializeContracts() {
    if (!this.signer) {
      throw new Error('Private key required for smart contract operations');
    }

    // MainManager ABI
    const mainManagerAbi = [
      'function createProject(string memory landDetails) external returns (address)',
      'function factory() external view returns (address)',
      'function beacon() external view returns (address)',
      'function donId() external view returns (bytes32)',
      'function subscriptionId() external view returns (uint64)',
      'function defaultSource() external view returns (string memory)',
      'event ProjectManagerInitialized(address factory, address beacon)',
      'event GlobalConfigUpdated(bytes32 donId, uint64 subscriptionId)'
    ];

    // Factory ABI
    const factoryAbi = [
      'function createProject(string memory _landDetails, uint256 _startDate) external returns (address)',
      'function getProject(uint256 projectId) external view returns (address)',
      'function projectCounter() external view returns (uint256)',
      'function projects(uint256) external view returns (address)',
      'event ProjectCreated(uint256 indexed projectId, address indexed projectContract, address indexed owner)'
    ];

    // Project Implementation ABI
    const projectAbi = [
      'function updateCarbonBalance(uint256 newBalance) external',
      'function mintTokens(address to, uint256 amount) external',
      'function getCarbonBalance() external view returns (uint256)',
      'function getProjectInfo() external view returns (uint256 projectId, address owner, string memory landDetails, uint256 startDate)',
      'function initialize(uint256 _projectId, address _owner, string memory _landDetails, uint256 _startDate) external'
    ];

    // Initialize MainManager contract
    if (config.managerContractAddress) {
      this.mainManager = new ethers.Contract(
        config.managerContractAddress,
        mainManagerAbi,
        this.signer
      );
      console.log('✅ MainManager contract initialized');
    }

    // Initialize Factory contract (get address from MainManager)
    if (this.mainManager) {
      try {
        const factoryAddress = await this.mainManager.factory();
        this.factory = new ethers.Contract(
          factoryAddress,
          factoryAbi,
          this.signer
        );
        console.log('✅ Factory contract initialized');
      } catch (error) {
        console.error('❌ Failed to get factory address:', error);
      }
    }
  }

  /**
   * Create a new carbon project
   */
  async createProject(name, location, area) {
    if (!this.mainManager) {
      await this.initializeContracts();
    }

    if (!this.mainManager) {
      throw new Error('MainManager contract not initialized');
    }

    try {
      console.log('🏗️ Creating new carbon project...');
      console.log(`📝 Name: ${name}`);
      console.log(`📍 Location: ${location}`);
      console.log(`📏 Area: ${area} hectares`);

      // Create land details string
      const landDetails = JSON.stringify({
        name: name,
        location: location,
        area: area.toString(),
        projectType: 'reforestation',
        createdAt: new Date().toISOString()
      });

      // Debug log: print the address being used for createProject
      console.log('Calling createProject on:', this.mainManager.address);

      // Create the project through MainManager
      const tx = await this.mainManager.createProject(landDetails);
      
      console.log('📡 Transaction submitted');
      console.log(`🔗 Transaction hash: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Project creation confirmed');

      // Extract project address from Factory's ProjectCreated event
      let projectAddress = null;
      
      // Look for ProjectCreated event in the receipt logs
      for (const log of receipt.logs) {
        try {
          // Try to parse as ProjectCreated event
          const iface = new ethers.utils.Interface([
            'event ProjectCreated(uint256 indexed projectId, address indexed projectContract, address indexed owner)'
          ]);
          const parsed = iface.parseLog(log);
          if (parsed.name === 'ProjectCreated') {
            projectAddress = parsed.args.projectContract;
            console.log(`🏗️ New project address: ${projectAddress}`);
            break;
          }
        } catch (e) {
          // Not a ProjectCreated event, continue
        }
      }

      if (!projectAddress) {
        console.warn('⚠️ Could not extract project address from event, using transaction hash as fallback');
        projectAddress = tx.hash; // Fallback
      }

      return {
        success: true,
        transactionHash: tx.hash,
        projectAddress: projectAddress,
        message: 'Project created successfully'
      };

    } catch (error) {
      console.error('❌ Error creating project:', error);
      throw error;
    }
  }

  /**
   * Get project information
   */
  async getProjectInfo(projectAddress) {
    if (!projectAddress) {
      throw new Error('Project address required');
    }

    try {
      const projectContract = new ethers.Contract(
        projectAddress,
        [
          'function getProjectInfo() external view returns (uint256 projectId, address owner, string memory landDetails, uint256 startDate)',
          'function getCarbonBalance() external view returns (uint256)'
        ],
        this.provider
      );

      const [projectInfo, carbonBalance] = await Promise.all([
        projectContract.getProjectInfo(),
        projectContract.getCarbonBalance()
      ]);

      const landDetails = JSON.parse(projectInfo.landDetails);

      return {
        projectId: projectInfo.projectId.toString(),
        owner: projectInfo.owner,
        name: landDetails.name,
        location: landDetails.location,
        area: landDetails.area,
        projectType: landDetails.projectType || 'reforestation',
        startDate: new Date(projectInfo.startDate * 1000).toISOString(),
        carbonBalance: ethers.utils.formatUnits(carbonBalance, 18)
      };

    } catch (error) {
      console.error('❌ Error getting project info:', error);
      throw error;
    }
  }

  /**
   * Update carbon balance for a project
   */
  async updateCarbonBalance(projectAddress, newBalance) {
    if (!this.signer) {
      throw new Error('Private key required for smart contract operations');
    }

    if (!projectAddress) {
      throw new Error('Project address required');
    }

    try {
      console.log('📊 Updating carbon balance...');
      console.log(`🏗️ Project: ${projectAddress}`);
      console.log(`⚖️ New Balance: ${newBalance} tCO2e`);

      const projectContract = new ethers.Contract(
        projectAddress,
        ['function updateCarbonBalance(uint256 newBalance) external'],
        this.signer
      );

      // Convert to wei (assuming 18 decimals)
      const balanceInWei = ethers.utils.parseUnits(newBalance.toString(), 18);

      // Update the carbon balance
      const tx = await projectContract.updateCarbonBalance(balanceInWei);
      
      console.log('📡 Transaction submitted');
      console.log(`🔗 Transaction hash: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Carbon balance update confirmed');

      return {
        success: true,
        transactionHash: tx.hash,
        newBalance: newBalance,
        message: 'Carbon balance updated successfully'
      };

    } catch (error) {
      console.error('❌ Error updating carbon balance:', error);
      throw error;
    }
  }

  /**
   * Mint carbon tokens
   */
  async mintTokens(projectAddress, toAddress, amount) {
    if (!this.signer) {
      throw new Error('Private key required for smart contract operations');
    }

    if (!projectAddress) {
      throw new Error('Project address required');
    }

    try {
      console.log('🪙 Minting carbon tokens...');
      console.log(`🏗️ Project: ${projectAddress}`);
      console.log(`👤 To: ${toAddress}`);
      console.log(`💰 Amount: ${amount} tokens`);

      const projectContract = new ethers.Contract(
        projectAddress,
        ['function mintTokens(address to, uint256 amount) external'],
        this.signer
      );

      // Convert to wei (assuming 18 decimals)
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);

      // Mint tokens
      const tx = await projectContract.mintTokens(toAddress, amountInWei);
      
      console.log('📡 Transaction submitted');
      console.log(`🔗 Transaction hash: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Token minting confirmed');

      return {
        success: true,
        transactionHash: tx.hash,
        toAddress: toAddress,
        amount: amount,
        message: 'Tokens minted successfully'
      };

    } catch (error) {
      console.error('❌ Error minting tokens:', error);
      throw error;
    }
  }

  /**
   * Get all projects for a user
   */
  async getAllProjects() {
    if (!this.factory) {
      await this.initializeContracts();
    }

    if (!this.factory) {
      throw new Error('Factory contract not initialized');
    }

    try {
      const projectCounter = await this.factory.projectCounter();
      const projects = [];

      for (let i = 1; i <= projectCounter; i++) {
        const projectAddress = await this.factory.projects(i);
        if (projectAddress !== ethers.constants.AddressZero) {
          try {
            const projectInfo = await this.getProjectInfo(projectAddress);
            projects.push({
              id: i.toString(),
              address: projectAddress,
              ...projectInfo
            });
          } catch (error) {
            console.warn(`⚠️ Could not get info for project ${i}:`, error.message);
          }
        }
      }

      return projects;

    } catch (error) {
      console.error('❌ Error getting all projects:', error);
      throw error;
    }
  }

  /**
   * Check if contracts are accessible
   */
  async checkContractAccessibility() {
    try {
      await this.initializeContracts();
      
      if (this.mainManager) {
        const factoryAddress = await this.mainManager.factory();
        const beaconAddress = await this.mainManager.beacon();
        
        console.log('✅ Contract accessibility check passed');
        console.log(`🏭 Factory: ${factoryAddress}`);
        console.log(`🔮 Beacon: ${beaconAddress}`);
        
        return {
          success: true,
          factory: factoryAddress,
          beacon: beaconAddress
        };
      }
      
      return { success: false, error: 'MainManager not initialized' };
      
    } catch (error) {
      console.error('❌ Contract accessibility check failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const smartContractIntegration = new SmartContractIntegration();
module.exports = { smartContractIntegration }; 