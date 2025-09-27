import { NextRequest, NextResponse } from 'next/server'

// Required for static export
export const dynamic = 'force-static';
export const revalidate = false;

// Mock database for stats
const mockStatsDatabase = {
  stats: new Map(),
  initialized: false
}

// Initialize mock stats data
function initializeMockStats() {
  if (mockStatsDatabase.initialized) return;
  
  const sampleAddresses = [
    '0x742d35Cc6634C0532925a3b8D8eA3C98E8b6b8A2',
    '0x8f3c4B2A1d9E6F7C8A5B3D2E1F4A9C7B6D8E5F2A',
    '0x1234567890abcdef1234567890abcdef12345678'
  ];

  sampleAddresses.forEach((address, index) => {
    const baseStats = {
      totalNodes: 2 + index,
      activeNodes: 1 + index,
      avgPerformance: 92 + Math.random() * 8,
      totalRewards: 2000 + index * 1000 + Math.random() * 1000,
      totalStaked: 80000 + index * 20000 + Math.random() * 10000,
      totalThreats: 300 + index * 100 + Math.random() * 200,
      networkUptime: 95 + Math.random() * 5
    };
    
    mockStatsDatabase.stats.set(address.toLowerCase(), baseStats);
  });
  mockStatsDatabase.initialized = true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // Initialize mock data
    initializeMockStats();
    
    const { address: rawAddress } = await params;
    const address = rawAddress.toLowerCase();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    // Get stats for the address
    let stats = mockStatsDatabase.stats.get(address);
    
    // If address not found, create default stats
    if (!stats) {
      stats = {
        totalNodes: 1,
        activeNodes: 1,
        avgPerformance: 95 + Math.random() * 5,
        totalRewards: 500 + Math.random() * 500,
        totalStaked: 25000 + Math.random() * 15000,
        totalThreats: 50 + Math.random() * 100,
        networkUptime: 95 + Math.random() * 5
      };
      
      // Store the new stats
      mockStatsDatabase.stats.set(address, stats);
    }
    
    // Update stats with real-time simulation
    const updatedStats = {
      ...stats,
      avgPerformance: Math.max(85, Math.min(100, stats.avgPerformance + (Math.random() - 0.5) * 1)),
      totalRewards: stats.totalRewards + Math.random() * 10,
      totalThreats: stats.totalThreats + Math.floor(Math.random() * 5),
      networkUptime: Math.max(90, Math.min(100, stats.networkUptime + (Math.random() - 0.5) * 0.5))
    };
    
    // Calculate additional derived stats
    const enhancedStats = {
      ...updatedStats,
      // Add some calculated fields
      rewardsPerNode: updatedStats.totalRewards / updatedStats.totalNodes,
      threatsPerNode: updatedStats.totalThreats / updatedStats.totalNodes,
      stakingPerNode: updatedStats.totalStaked / updatedStats.totalNodes,
      activePercentage: (updatedStats.activeNodes / updatedStats.totalNodes) * 100,
      // Network-wide stats (simulated)
      globalNetworkNodes: 15000 + Math.floor(Math.random() * 1000),
      globalActiveNodes: 14500 + Math.floor(Math.random() * 500),
      globalThreatsPrevented: 50000 + Math.floor(Math.random() * 5000),
      globalUptime: 98.5 + Math.random() * 1.5
    };
    
    return NextResponse.json({
      ...enhancedStats,
      timestamp: new Date().toISOString(),
      success: true,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching node stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch node statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}
