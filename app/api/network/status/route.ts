import { NextRequest, NextResponse } from 'next/server'

// Global network status (not user-specific)
let globalNetworkStatus = {
  initialized: false,
  lastUpdate: new Date(),
  data: {
    totalNodes: 15847,
    activeNodes: 14923,
    networkHealth: 96.2,
    energyEfficiency: 92.5,
    avgLatency: 47,
    consensus: 99.8,
    uptime24h: 96.2,
    threatsPrevented24h: 2847,
    dataProcessed24h: 1.2, // TB
    transactionsValidated24h: 89234,
    carbonNeutral: true,
    regions: {
      'us-east-1': { nodes: 3245, status: 'healthy' },
      'us-west-1': { nodes: 2876, status: 'healthy' },
      'eu-west-1': { nodes: 3012, status: 'healthy' },
      'eu-central-1': { nodes: 2234, status: 'healthy' },
      'ap-southeast-1': { nodes: 2145, status: 'healthy' },
      'ap-northeast-1': { nodes: 2335, status: 'maintenance' }
    }
  }
}

function updateNetworkStatus() {
  const now = new Date();
  const timeSinceUpdate = now.getTime() - globalNetworkStatus.lastUpdate.getTime();
  
  // Update every 30 seconds
  if (timeSinceUpdate > 30000 || !globalNetworkStatus.initialized) {
    const data = globalNetworkStatus.data;
    
    // Simulate real-time changes
    data.activeNodes = Math.max(
      data.totalNodes - 1000,
      Math.min(
        data.totalNodes,
        data.activeNodes + Math.floor((Math.random() - 0.5) * 50)
      )
    );
    
    data.networkHealth = Math.max(90, Math.min(100, data.networkHealth + (Math.random() - 0.5) * 2));
    data.energyEfficiency = Math.max(85, Math.min(95, data.energyEfficiency + (Math.random() - 0.5) * 1));
    data.avgLatency = Math.max(30, Math.min(80, data.avgLatency + (Math.random() - 0.5) * 5));
    data.consensus = Math.max(98, Math.min(100, data.consensus + (Math.random() - 0.5) * 0.5));
    data.uptime24h = Math.max(90, Math.min(100, data.uptime24h + (Math.random() - 0.5) * 1));
    
    // Increment counters
    data.threatsPrevented24h += Math.floor(Math.random() * 10);
    data.transactionsValidated24h += Math.floor(Math.random() * 100);
    data.dataProcessed24h += Math.random() * 0.01;
    
    // Update regional status
    Object.keys(data.regions).forEach(region => {
      const regionData = data.regions[region];
      regionData.nodes += Math.floor((Math.random() - 0.5) * 10);
      
      // Occasionally change status
      if (Math.random() < 0.05) {
        regionData.status = Math.random() > 0.8 ? 'maintenance' : 'healthy';
      }
    });
    
    globalNetworkStatus.lastUpdate = now;
    globalNetworkStatus.initialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Update network status
    updateNetworkStatus();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));
    
    const data = globalNetworkStatus.data;
    
    // Calculate derived metrics
    const activePercentage = (data.activeNodes / data.totalNodes) * 100;
    const healthScore = (data.networkHealth + data.energyEfficiency + data.consensus + (100 - data.avgLatency)) / 4;
    
    const response = {
      ...data,
      // Add calculated fields
      activePercentage: Math.round(activePercentage * 100) / 100,
      healthScore: Math.round(healthScore * 100) / 100,
      status: healthScore > 95 ? 'excellent' : healthScore > 85 ? 'good' : 'fair',
      
      // Network statistics
      statistics: {
        nodesOnline: data.activeNodes,
        nodesOffline: data.totalNodes - data.activeNodes,
        avgBlockTime: 2.1 + Math.random() * 0.5,
        networkHashrate: '2.4 TH/s',
        memPoolSize: Math.floor(1000 + Math.random() * 500),
        difficulty: 15847293.45 + Math.random() * 1000000,
        blockHeight: 2847293 + Math.floor(Math.random() * 100)
      },
      
      // Performance metrics
      performance: {
        tps: Math.floor(8000 + Math.random() * 2000), // Transactions per second
        bandwidth: Math.round((50 + Math.random() * 30) * 100) / 100, // Mbps
        storageUsed: Math.round((data.totalNodes * 0.85 + Math.random() * 0.1) * 100) / 100, // TB
        cpuUtilization: Math.round((45 + Math.random() * 20) * 100) / 100, // %
        memoryUtilization: Math.round((60 + Math.random() * 15) * 100) / 100 // %
      },
      
      // Security metrics
      security: {
        threatLevel: Math.random() > 0.9 ? 'medium' : 'low',
        activeThreats: Math.floor(Math.random() * 5),
        blockedAttacks24h: data.threatsPrevented24h,
        securityScore: Math.round((90 + Math.random() * 10) * 100) / 100,
        lastSecurityUpdate: new Date(Date.now() - Math.random() * 86400000).toISOString()
      },
      
      timestamp: new Date().toISOString(),
      success: true,
      lastUpdated: globalNetworkStatus.lastUpdate.toISOString()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching network status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch network status',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}
