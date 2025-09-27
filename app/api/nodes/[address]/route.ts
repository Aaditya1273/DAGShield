import { NextRequest, NextResponse } from 'next/server'

type NodeStatus = 'active' | 'maintenance' | 'inactive' | 'error'

interface NodeMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkIn: number
  networkOut: number
  responseTime: number
}

interface NodeRecord {
  id: string
  name: string
  status: NodeStatus
  performance: number
  rewards: number
  location: string
  uptime: number
  threatsDetected: number
  lastSeen: string
  version: string
  metrics: NodeMetrics
  publicKey: string
  stakingAmount: number
  validatedTransactions: number
  earnings24h: number
  region: string
}

interface MockDatabase {
  nodes: Map<string, NodeRecord[]>
  initialized: boolean
}

// Mock database - In production, replace with real database
const mockDatabase: MockDatabase = {
  nodes: new Map<string, NodeRecord[]>(),
  initialized: false
}

// Initialize mock data
function initializeMockData() {
  if (mockDatabase.initialized) return;
  
  // Sample wallet addresses and their nodes
  const sampleAddresses = [
    '0x742d35Cc6634C0532925a3b8D8eA3C98E8b6b8A2',
    '0x8f3c4B2A1d9E6F7C8A5B3D2E1F4A9C7B6D8E5F2A',
    '0x1234567890abcdef1234567890abcdef12345678'
  ];

  sampleAddresses.forEach((address, index) => {
    const nodes: NodeRecord[] = [
      {
        id: `dagshield-node-${String(index * 3 + 1).padStart(3, '0')}`,
        name: `Primary Shield Node ${index + 1}`,
        status: "active",
        performance: 95 + Math.random() * 5,
        rewards: 1000 + Math.random() * 500,
        location: ["New York, US", "Frankfurt, DE", "Singapore, SG"][index],
        uptime: 95 + Math.random() * 5,
        threatsDetected: Math.floor(200 + Math.random() * 200),
        lastSeen: new Date(Date.now() - Math.random() * 300000).toISOString(),
        version: "v2.1.4",
        metrics: {
          cpuUsage: 30 + Math.random() * 40,
          memoryUsage: 50 + Math.random() * 30,
          diskUsage: 20 + Math.random() * 40,
          networkIn: 50 + Math.random() * 100,
          networkOut: 50 + Math.random() * 100,
          responseTime: 10 + Math.random() * 20
        },
        publicKey: address,
        stakingAmount: 40000 + Math.random() * 20000,
        validatedTransactions: Math.floor(10000 + Math.random() * 10000),
        earnings24h: 10 + Math.random() * 10,
        region: ["us-east-1", "eu-west-1", "ap-southeast-1"][index]
      },
      {
        id: `dagshield-node-${String(index * 3 + 2).padStart(3, '0')}`,
        name: `Secondary Shield Node ${index + 1}`,
        status: Math.random() > 0.8 ? "maintenance" : "active",
        performance: 90 + Math.random() * 10,
        rewards: 800 + Math.random() * 400,
        location: ["Los Angeles, US", "London, UK", "Tokyo, JP"][index],
        uptime: 90 + Math.random() * 10,
        threatsDetected: Math.floor(150 + Math.random() * 150),
        lastSeen: new Date(Date.now() - Math.random() * 600000).toISOString(),
        version: "v2.1.3",
        metrics: {
          cpuUsage: 25 + Math.random() * 35,
          memoryUsage: 45 + Math.random() * 35,
          diskUsage: 15 + Math.random() * 35,
          networkIn: 40 + Math.random() * 80,
          networkOut: 40 + Math.random() * 80,
          responseTime: 8 + Math.random() * 15
        },
        publicKey: address.replace(/.$/, Math.floor(Math.random() * 16).toString(16)),
        stakingAmount: 30000 + Math.random() * 15000,
        validatedTransactions: Math.floor(8000 + Math.random() * 8000),
        earnings24h: 8 + Math.random() * 8,
        region: ["us-west-1", "eu-west-2", "ap-northeast-1"][index]
      }
    ];
    
    mockDatabase.nodes.set(address.toLowerCase(), nodes);
  });
  
  mockDatabase.initialized = true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // Initialize mock data
    initializeMockData();
    
    const { address: rawAddress } = await params;
    const address = rawAddress.toLowerCase();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Get nodes for the address
    let nodes = mockDatabase.nodes.get(address);
    
    // If address not found, create some default nodes
    if (!nodes) {
      nodes = [
        {
          id: `dagshield-node-new-001`,
          name: `Shield Node`,
          status: "active",
          performance: 95 + Math.random() * 5,
          rewards: 500 + Math.random() * 300,
          location: "Global",
          uptime: 95 + Math.random() * 5,
          threatsDetected: Math.floor(100 + Math.random() * 100),
          lastSeen: new Date(Date.now() - Math.random() * 180000).toISOString(),
          version: "v2.1.4",
          metrics: {
            cpuUsage: 30 + Math.random() * 30,
            memoryUsage: 40 + Math.random() * 30,
            diskUsage: 20 + Math.random() * 30,
            networkIn: 50 + Math.random() * 50,
            networkOut: 50 + Math.random() * 50,
            responseTime: 10 + Math.random() * 15
          },
          publicKey: address,
          stakingAmount: 25000 + Math.random() * 15000,
          validatedTransactions: Math.floor(5000 + Math.random() * 5000),
          earnings24h: 5 + Math.random() * 5,
          region: "global"
        }
      ];
      
      // Store the new nodes
      mockDatabase.nodes.set(address, nodes);
    }
    
    // Update nodes with real-time data simulation
    nodes = nodes.map((node) => ({
      ...node,
      performance: Math.max(85, Math.min(100, node.performance + (Math.random() - 0.5) * 2)),
      metrics: {
        ...node.metrics,
        cpuUsage: Math.max(10, Math.min(90, node.metrics.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.max(20, Math.min(95, node.metrics.memoryUsage + (Math.random() - 0.5) * 3)),
        responseTime: Math.max(5, Math.min(50, node.metrics.responseTime + (Math.random() - 0.5) * 2))
      },
      lastSeen: new Date().toISOString(),
      threatsDetected: node.threatsDetected + Math.floor(Math.random() * 3)
    }));
    
    return NextResponse.json({ 
      nodes,
      timestamp: new Date().toISOString(),
      success: true 
    });
    
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch nodes',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}
