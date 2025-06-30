import { useState, useEffect, useCallback } from 'react';
import { frontendIntegration } from '../lib/frontend-integration';

// Hook for carbon offset calculations
export function useCarbonCalculation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const calculate = useCallback(async (location, projectArea, projectDuration, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendIntegration.calculateCarbonOffset(
        location,
        projectArea,
        projectDuration,
        options
      );
      
      const formattedResult = frontendIntegration.formatCarbonOffset(response.data);
      setResult(formattedResult);
      return formattedResult;
    } catch (err) {
      const errorResult = frontendIntegration.handleError(err, 'Carbon Calculation');
      setError(errorResult);
      throw errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    calculate,
    loading,
    error,
    result,
    reset: () => {
      setError(null);
      setResult(null);
    }
  };
}

// Hook for project management
export function useProjectManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createProject = useCallback(async (projectData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendIntegration.createProject(projectData);
      return frontendIntegration.handleSuccess(response.data, 'Project created successfully');
    } catch (err) {
      const errorResult = frontendIntegration.handleError(err, 'Project Creation');
      setError(errorResult);
      throw errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProjectDetails = useCallback(async (projectId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendIntegration.getProjectDetails(projectId);
      const formattedProject = frontendIntegration.formatProjectData(response.data.project);
      const formattedHistory = frontendIntegration.formatVerificationHistory(response.data.verificationHistory);
      
      return {
        project: formattedProject,
        carbonOffset: frontendIntegration.formatCarbonOffset(response.data.carbonOffset),
        verificationHistory: formattedHistory
      };
    } catch (err) {
      const errorResult = frontendIntegration.handleError(err, 'Project Details');
      setError(errorResult);
      throw errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCarbonOffset = useCallback(async (projectId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendIntegration.refreshCarbonOffset(projectId);
      const formattedResult = frontendIntegration.formatCarbonOffset(response.data.carbonOffset);
      return frontendIntegration.handleSuccess(formattedResult, 'Carbon offset refreshed successfully');
    } catch (err) {
      const errorResult = frontendIntegration.handleError(err, 'Carbon Refresh');
      setError(errorResult);
      throw errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  const mintTokens = useCallback(async (projectId, recipientAddress, amount) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendIntegration.mintTokens(projectId, recipientAddress, amount);
      return frontendIntegration.handleSuccess(response.data, 'Tokens minted successfully');
    } catch (err) {
      const errorResult = frontendIntegration.handleError(err, 'Token Minting');
      setError(errorResult);
      throw errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createProject,
    getProjectDetails,
    refreshCarbonOffset,
    mintTokens,
    loading,
    error,
    reset: () => setError(null)
  };
}

// Hook for Chainlink Functions
export function useChainlinkFunctions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(null);

  const submitToChainlink = useCallback(async (location, projectArea, projectDuration, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendIntegration.submitToChainlink(
        location,
        projectArea,
        projectDuration,
        options
      );
      
      setRequestId(response.data.requestId);
      return frontendIntegration.handleSuccess(response.data, 'Submitted to Chainlink Functions');
    } catch (err) {
      const errorResult = frontendIntegration.handleError(err, 'Chainlink Submission');
      setError(errorResult);
      throw errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  const getResult = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendIntegration.getChainlinkResult(requestId);
      return response.data;
    } catch (err) {
      const errorResult = frontendIntegration.handleError(err, 'Chainlink Result');
      setError(errorResult);
      throw errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    submitToChainlink,
    getResult,
    requestId,
    loading,
    error,
    reset: () => {
      setError(null);
      setRequestId(null);
    }
  };
}

// Hook for real-time carbon progress monitoring
export function useCarbonProgress(projectId, threshold = 1000) {
  const [progress, setProgress] = useState(0);
  const [currentCarbon, setCurrentCarbon] = useState(0);
  const [canMint, setCanMint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshProgress = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendIntegration.refreshCarbonOffset(projectId);
      const carbonAmount = response.data.carbonOffset.totalProjectCarbon;
      
      setCurrentCarbon(carbonAmount);
      setProgress(frontendIntegration.calculateProgress(carbonAmount, threshold));
      setCanMint(frontendIntegration.canMintTokens(carbonAmount, threshold));
      
      return response.data;
    } catch (err) {
      const errorResult = frontendIntegration.handleError(err, 'Progress Refresh');
      setError(errorResult);
      throw errorResult;
    } finally {
      setLoading(false);
    }
  }, [projectId, threshold]);

  // Auto-refresh progress every 30 seconds
  useEffect(() => {
    if (!projectId) return;
    
    refreshProgress();
    
    const interval = setInterval(refreshProgress, 30000);
    return () => clearInterval(interval);
  }, [projectId, refreshProgress]);

  return {
    progress,
    currentCarbon,
    canMint,
    threshold,
    loading,
    error,
    refreshProgress,
    reset: () => {
      setProgress(0);
      setCurrentCarbon(0);
      setCanMint(false);
      setError(null);
    }
  };
}

// Hook for project portfolio
export function useProjectPortfolio() {
  const [projects, setProjects] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For now, we'll simulate loading multiple projects
      // In a real implementation, you'd fetch from an API
      const mockProjects = [
        {
          id: '1',
          name: 'Amazon Reforestation Project',
          carbonBalance: 1200,
          status: 'Active'
        },
        {
          id: '2', 
          name: 'Boreal Forest Conservation',
          carbonBalance: 850,
          status: 'Active'
        }
      ];
      
      setProjects(mockProjects);
      setTotalCredits(mockProjects.reduce((sum, p) => sum + p.carbonBalance, 0));
      
      return mockProjects;
    } catch (err) {
      const errorResult = frontendIntegration.handleError(err, 'Portfolio Load');
      setError(errorResult);
      throw errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  return {
    projects,
    totalCredits,
    loading,
    error,
    refresh: loadPortfolio
  };
}

// Hook for health monitoring
export function useBackendHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendIntegration.checkHealth();
      setHealth(response);
      return response;
    } catch (err) {
      const errorResult = frontendIntegration.handleError(err, 'Health Check');
      setError(errorResult);
      throw errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Check health every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    health,
    loading,
    error,
    checkHealth
  };
} 