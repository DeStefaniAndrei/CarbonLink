import { ethers } from 'ethers';

export interface ChainlinkConfig {
  functionsRouter: string;
  donId: string;
  subscriptionId: string;
  source: string;
}

export interface ProjectData {
  projectId: number;
  landDetails: string;
  startDate: number;
  projectOwner: string;
  totalCreditsIssued: number;
  bufferCredits: number;
  carbonCredits: number;
}

export class ChainlinkFunctionsHelper {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private projectContract: ethers.Contract;
  private managerContract: ethers.Contract;

  constructor(
    provider: ethers.Provider,
    signer: ethers.Signer,
    projectAddress: string,
    managerAddress: string
  ) {
    this.provider = provider;
    this.signer = signer;
    
    // Project Implementation ABI (simplified for frontend)
    const projectABI = [
      "function requestCarbonData() external",
      "function totalCreditsIssued() external view returns (uint256)",
      "function bufferCredits() external view returns (uint256)",
      "function carbonCredits() external view returns (uint256)",
      "function projectId() external view returns (uint256)",
      "function landDetails() external view returns (string)",
      "function startDate() external view returns (uint256)",
      "function projectOwner() external view returns (address)",
      "function setChainlinkConfig(bytes32,uint64,string) external",
      "event CarbonDataRequested(bytes32 indexed requestId)",
      "event CreditsIssued(uint256 tradableAmount, uint256 bufferAmount)"
    ];

    // Manager ABI (simplified for frontend)
    const managerABI = [
      "function createProject(string) external returns (address)",
      "function setGlobalChainlinkConfig(bytes32,uint64,string) external"
    ];

    this.projectContract = new ethers.Contract(projectAddress, projectABI, signer);
    this.managerContract = new ethers.Contract(managerAddress, managerABI, signer);
  }

  /**
   * Request carbon data from Chainlink Functions
   */
  async requestCarbonData(): Promise<string> {
    try {
      const tx = await this.projectContract.requestCarbonData();
      const receipt = await tx.wait();
      
      // Find the CarbonDataRequested event
      const event = receipt?.logs?.find((log: any) => {
        try {
          const parsed = this.projectContract.interface.parseLog(log);
          return parsed?.name === 'CarbonDataRequested';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = this.projectContract.interface.parseLog(event);
        return parsed?.args?.[0] || '';
      }
      
      throw new Error('CarbonDataRequested event not found');
    } catch (error) {
      console.error('Error requesting carbon data:', error);
      throw error;
    }
  }

  /**
   * Get project data
   */
  async getProjectData(): Promise<ProjectData> {
    try {
      const [
        projectId,
        landDetails,
        startDate,
        projectOwner,
        totalCreditsIssued,
        bufferCredits,
        carbonCredits
      ] = await Promise.all([
        this.projectContract.projectId(),
        this.projectContract.landDetails(),
        this.projectContract.startDate(),
        this.projectContract.projectOwner(),
        this.projectContract.totalCreditsIssued(),
        this.projectContract.bufferCredits(),
        this.projectContract.carbonCredits()
      ]);

      return {
        projectId: Number(projectId),
        landDetails,
        startDate: Number(startDate),
        projectOwner,
        totalCreditsIssued: Number(totalCreditsIssued),
        bufferCredits: Number(bufferCredits),
        carbonCredits: Number(carbonCredits)
      };
    } catch (error) {
      console.error('Error getting project data:', error);
      throw error;
    }
  }

  /**
   * Create a new project
   */
  async createProject(landDetails: string): Promise<string> {
    try {
      const tx = await this.managerContract.createProject(landDetails);
      const receipt = await tx.wait();
      
      // The factory should emit an event with the project address
      // For now, we'll return the transaction hash
      return receipt?.hash || '';
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Set Chainlink configuration for a project
   */
  async setChainlinkConfig(
    donId: string,
    subscriptionId: string,
    source: string
  ): Promise<void> {
    try {
      const tx = await this.projectContract.setChainlinkConfig(
        donId,
        subscriptionId,
        source
      );
      await tx.wait();
    } catch (error) {
      console.error('Error setting Chainlink config:', error);
      throw error;
    }
  }

  /**
   * Listen for carbon data requests
   */
  onCarbonDataRequested(callback: (requestId: string) => void): void {
    this.projectContract.on('CarbonDataRequested', (requestId: string) => {
      callback(requestId);
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.projectContract.removeAllListeners('CarbonDataRequested');
  }
}

/**
 * Utility function to create a Chainlink Functions source code
 */
export function createChainlinkSource(landDetails: string): string {
  return `
    // Simple carbon credit calculation for testing
    const landDetails = args[0];
    
    // Parse land details
    const areaMatch = landDetails.match(/(\\d+)\\s*acres/);
    const treeTypeMatch = landDetails.match(/(pine|oak|maple)\\s*trees/);
    
    const area = areaMatch ? parseInt(areaMatch[1]) : 100;
    const treeType = treeTypeMatch ? treeTypeMatch[1] : 'pine';
    
    // Calculate carbon credits based on area and tree type
    let carbonValue = area * 10; // Base calculation
    
    // Adjust for tree type
    switch(treeType) {
      case 'pine':
        carbonValue *= 0.8;
        break;
      case 'oak':
        carbonValue *= 1.2;
        break;
      case 'maple':
        carbonValue *= 1.0;
        break;
    }
    
    // Add some randomness
    const variation = Math.floor(Math.random() * 200) - 100;
    carbonValue = Math.max(0, carbonValue + variation);
    
    return Functions.encodeUint256(carbonValue);
  `;
}

/**
 * Default Chainlink Functions configuration for Sepolia
 */
export const DEFAULT_CHAINLINK_CONFIG: ChainlinkConfig = {
  functionsRouter: '0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C',
  donId: '0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000',
  subscriptionId: '5144', // Replace with your actual subscription ID
  source: ''
}; 