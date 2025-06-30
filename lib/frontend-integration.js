// Frontend integration module for CarbonLink
// This provides easy-to-use functions for React/Next.js components

const API_BASE_URL = 'http://localhost:3001/api';

class FrontendIntegration {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async apiCall(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API call failed for ${endpoint}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    return this.apiCall('/health');
  }

  // Carbon offset calculation
  async calculateCarbonOffset(location, projectArea, projectDuration, options = {}) {
    const payload = {
      location,
      projectArea,
      projectDuration,
      ...options
    };

    const response = await this.apiCall('/calculate-carbon', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response;
  }

  // Create new project
  async createProject(projectData) {
    const response = await this.apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });

    return response;
  }

  // Get project details
  async getProjectDetails(projectId) {
    const response = await this.apiCall(`/projects/${projectId}`);
    return response;
  }

  // Refresh carbon offset
  async refreshCarbonOffset(projectId) {
    const response = await this.apiCall(`/projects/${projectId}/refresh`, {
      method: 'POST'
    });

    return response;
  }

  // Mint tokens
  async mintTokens(projectId, recipientAddress, amount) {
    const payload = {
      projectId,
      recipientAddress,
      amount
    };

    const response = await this.apiCall('/mint-tokens', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response;
  }

  // Submit to Chainlink Functions
  async submitToChainlink(location, projectArea, projectDuration, options = {}) {
    const payload = {
      location,
      projectArea,
      projectDuration,
      ...options
    };

    const response = await this.apiCall('/chainlink/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response;
  }

  // Get Chainlink result
  async getChainlinkResult(requestId) {
    const response = await this.apiCall(`/chainlink/result/${requestId}`);
    return response;
  }

  // Format carbon offset data for display
  formatCarbonOffset(data) {
    if (!data) return null;
    
    return {
      netBalance: data.netCarbonBalance || 0,
      totalProject: data.totalProjectCarbon || 0,
      confidence: data.confidence || 0,
      uncertainty: data.uncertainty || 0,
      sequestration: data.sequestration || {},
      emissions: data.emissions || {}
    };
  }

  // Format project data for display
  formatProjectData(project) {
    if (!project) return null;
    
    return {
      id: project.id || '1',
      name: project.name || 'Unknown Project',
      location: {
        lat: parseFloat(project.location?.split(',')[0]) || 0,
        lng: parseFloat(project.location?.split(',')[1]) || 0
      },
      area: project.area || 0,
      projectType: project.projectType || 'reforestation',
      status: project.status || 'Active',
      startDate: project.createdAt || new Date().toISOString().split('T')[0],
      ownerAddress: project.ownerAddress || ''
    };
  }

  // Format verification history
  formatVerificationHistory(history) {
    if (!Array.isArray(history)) return [];
    
    return history.map(record => ({
      date: record.date || new Date().toISOString().split('T')[0],
      ndvi: record.ndvi || 0,
      carbon: record.carbon || 0,
      credits: record.credits || 0,
      buffer: record.buffer || 0,
      status: record.status || 'Verified'
    }));
  }

  // Calculate progress percentage
  calculateProgress(currentCarbon, threshold) {
    if (!threshold || threshold <= 0) return 0;
    return Math.min((currentCarbon / threshold) * 100, 100);
  }

  // Check if tokens can be minted
  canMintTokens(currentCarbon, threshold) {
    return currentCarbon >= threshold;
  }

  // Handle success responses
  handleSuccess(data, message) {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  // Handle errors
  handleError(error, context) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      context,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
const frontendIntegration = new FrontendIntegration();
module.exports = { frontendIntegration }; 