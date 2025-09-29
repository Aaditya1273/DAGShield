'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useProtectedPage } from '@/hooks/useProtectedPage'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Server, 
  Play, 
  Pause, 
  Settings, 
  TrendingUp, 
  Plus, 
  MapPin, 
  Activity, 
  Zap,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Database,
  Network,
  Cpu,
  HardDrive,
  Wifi,
  DollarSign,
  AlertCircle
} from "lucide-react"

// Types
interface NodeMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  responseTime: number;
}

interface NodeData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  performance: number;
  rewards: number;
  location: string;
  uptime: number;
  threatsDetected: number;
  lastSeen: string;
  version: string;
  metrics: NodeMetrics;
  publicKey: string;
  stakingAmount: number;
  validatedTransactions: number;
  earnings24h: number;
  region: string;
}

interface NodeStats {
  totalNodes: number;
  activeNodes: number;
  avgPerformance: number;
  totalRewards: number;
  totalStaked: number;
  totalThreats: number;
  networkUptime: number;
}

// LocalStorage key for nodes data
const NODES_STORAGE_KEY = 'dagshield_nodes';

// Helper functions for localStorage
const saveNodesToStorage = (nodes: NodeData[]) => {
  try {
    console.log('Saving nodes to localStorage:', nodes);
    localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes));
    console.log('Successfully saved to localStorage');
  } catch (error) {
    console.error('Failed to save nodes to localStorage:', error);
  }
};

const loadNodesFromStorage = (): NodeData[] | null => {
  try {
    const stored = localStorage.getItem(NODES_STORAGE_KEY);
    console.log('Loading from localStorage:', stored);
    if (stored === null) {
      console.log('No data in localStorage');
      return null;
    }
    const parsed = JSON.parse(stored);
    console.log('Parsed nodes from localStorage:', parsed);
    return parsed;
  } catch (error) {
    console.error('Failed to load nodes from localStorage:', error);
    return null;
  }
};

// Custom hooks
const useNodeData = () => {
  const [nodes, setNodesState] = useState<NodeData[]>([]);
  const [stats, setStats] = useState<NodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  
  // Enhanced setNodes function that also saves to localStorage
  const setNodes = useCallback((newNodesOrUpdater: NodeData[] | ((prev: NodeData[]) => NodeData[])) => {
    setNodesState(prevNodes => {
      const newNodes = typeof newNodesOrUpdater === 'function' ? newNodesOrUpdater(prevNodes) : newNodesOrUpdater;
      saveNodesToStorage(newNodes);
      return newNodes;
    });
  }, []);

  const fetchNodes = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch real data from SQLite API
      const response = await fetch(`/api/gamification/${address}`);
      if (!response.ok) {
        console.error(`API request failed with status: ${response.status}`);
        // No user data, show empty state
        setNodesState([]);
        setStats({
          totalNodes: 0,
          activeNodes: 0,
          totalRewards: 0,
          totalStaked: 0,
          avgPerformance: 0,
          totalThreats: 0,
          networkUptime: 0
        });
        setLoading(false);
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', contentType);
        throw new Error('API returned invalid response format');
      }

      const data = await response.json();
      if (data.success && data.userStats && data.userStats.totalNodes > 0) {
        // Generate nodes based on user stats for display
        const mockNodes: NodeData[] = [];
        for (let i = 0; i < data.userStats.totalNodes; i++) {
          mockNodes.push({
            id: `node-${i + 1}`,
            name: `Node ${i + 1}`,
            status: i % 3 === 0 ? 'active' : (i % 3 === 1 ? 'maintenance' : 'active'),
            performance: 85 + Math.floor(Math.random() * 15),
            rewards: Math.floor(data.userStats.totalRewards / data.userStats.totalNodes),
            location: ['New York, US', 'London, UK', 'Tokyo, JP', 'Singapore, SG', 'Frankfurt, DE'][i % 5],
            uptime: 96 + Math.floor(Math.random() * 4),
            threatsDetected: Math.floor(data.userStats.threatsDetected / data.userStats.totalNodes),
            lastSeen: '2 minutes ago',
            version: '1.2.3',
            metrics: {
              cpuUsage: 45 + Math.floor(Math.random() * 30),
              memoryUsage: 60 + Math.floor(Math.random() * 25),
              diskUsage: 30 + Math.floor(Math.random() * 40),
              networkIn: 150 + Math.floor(Math.random() * 100),
              networkOut: 80 + Math.floor(Math.random() * 60),
              responseTime: 10 + Math.floor(Math.random() * 20)
            },
            publicKey: `0x${Math.random().toString(16).substr(2, 40)}`,
            stakingAmount: Math.floor(data.userStats.totalStaked / data.userStats.totalNodes),
            validatedTransactions: 1250 + Math.floor(Math.random() * 500),
            earnings24h: Math.floor(data.userStats.totalRewards * 0.05),
            region: ['us-east-1', 'eu-west-1', 'ap-northeast-1', 'ap-southeast-1', 'eu-central-1'][i % 5]
          });
        }
        console.log('Generated nodes from user stats:', mockNodes);
        setNodesState(mockNodes);
        
        // Set stats based on real data
        setStats({
          totalNodes: data.userStats.totalNodes,
          activeNodes: Math.floor(data.userStats.totalNodes * 0.8),
          totalRewards: data.userStats.totalRewards,
          totalStaked: data.userStats.totalStaked,
          avgPerformance: 90,
          totalThreats: data.userStats.threatsDetected,
          networkUptime: 96.5
        });
      } else {
        // No user data, show empty state
        setNodesState([]);
        setStats({
          totalNodes: 0,
          activeNodes: 0,
          totalRewards: 0,
          totalStaked: 0,
          avgPerformance: 0,
          totalThreats: 0,
          networkUptime: 0
        });
      }
    } catch (err) {
      console.error('Failed to load nodes from API:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setNodesState([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Update stats when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      const activeNodes = nodes.filter(node => node.status === 'active').length;
      const avgPerformance = nodes.reduce((sum, node) => sum + node.performance, 0) / nodes.length;
      const totalRewards = nodes.reduce((sum, node) => sum + node.rewards, 0);
      const totalStaked = nodes.reduce((sum, node) => sum + node.stakingAmount, 0);
      const totalThreats = nodes.reduce((sum, node) => sum + node.threatsDetected, 0);
      const networkUptime = nodes.reduce((sum, node) => sum + node.uptime, 0) / nodes.length;
      
      setStats({
        totalNodes: nodes.length,
        activeNodes,
        avgPerformance,
        totalRewards,
        totalStaked,
        totalThreats,
        networkUptime
      });
    } else {
      setStats({
        totalNodes: 0,
        activeNodes: 0,
        avgPerformance: 0,
        totalRewards: 0,
        totalStaked: 0,
        totalThreats: 0,
        networkUptime: 0
      });
    }
  }, [nodes]);

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNodes]);

  return { nodes, setNodes, stats, loading, error, refetch: fetchNodes, deleteNode: (nodeId: string) => {
    console.log('deleteNode called with nodeId:', nodeId);
    setNodes(prevNodes => {
      const filteredNodes = prevNodes.filter(node => node.id !== nodeId);
      console.log('Filtered nodes after deletion:', filteredNodes);
      return filteredNodes;
    });
  } };
};

// Mock data generators (remove in production)
const generateMockNodes = (): NodeData[] => [
  {
    id: "dagshield-node-001",
    name: "Primary Shield Node",
    status: "active",
    performance: 98.5,
    rewards: 1247.82,
    location: "New York, US",
    uptime: 99.2,
    threatsDetected: 342,
    lastSeen: new Date(Date.now() - 120000).toISOString(),
    version: "v2.1.4",
    metrics: {
      cpuUsage: 45,
      memoryUsage: 67,
      diskUsage: 34,
      networkIn: 125.6,
      networkOut: 98.3,
      responseTime: 12
    },
    publicKey: "0x742d35Cc6634C0532925a3b8D8eA3C98E8b6b8A2",
    stakingAmount: 50000,
    validatedTransactions: 15847,
    earnings24h: 12.45,
    region: "us-east-1"
  },
  {
    id: "dagshield-node-002",
    name: "European Shield Node",
    status: "active",
    performance: 96.8,
    rewards: 1156.23,
    location: "Frankfurt, DE",
    uptime: 97.8,
    threatsDetected: 289,
    lastSeen: new Date(Date.now() - 60000).toISOString(),
    version: "v2.1.4",
    metrics: {
      cpuUsage: 52,
      memoryUsage: 71,
      diskUsage: 28,
      networkIn: 98.4,
      networkOut: 112.7,
      responseTime: 18
    },
    publicKey: "0x8f3c4B2A1d9E6F7C8A5B3D2E1F4A9C7B6D8E5F2A",
    stakingAmount: 45000,
    validatedTransactions: 13256,
    earnings24h: 10.89,
    region: "eu-west-1"
  },
  {
    id: "dagshield-node-003",
    name: "Asia Pacific Node",
    status: "maintenance",
    performance: 0,
    rewards: 892.67,
    location: "Singapore, SG",
    uptime: 0,
    threatsDetected: 0,
    lastSeen: new Date(Date.now() - 7200000).toISOString(),
    version: "v2.1.3",
    metrics: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 41,
      networkIn: 0,
      networkOut: 0,
      responseTime: 0
    },
    publicKey: "0x5D8C9F2A7B1E4D6C3F8A2B5E7D1C4A6B9E2F5C8A",
    stakingAmount: 40000,
    validatedTransactions: 9834,
    earnings24h: 0,
    region: "ap-southeast-1"
  },
  {
    id: "dagshield-node-004",
    name: "West Coast Node",
    status: "active",
    performance: 94.2,
    rewards: 987.34,
    location: "Los Angeles, US",
    uptime: 98.5,
    threatsDetected: 256,
    lastSeen: new Date(Date.now() - 180000).toISOString(),
    version: "v2.1.4",
    metrics: {
      cpuUsage: 38,
      memoryUsage: 59,
      diskUsage: 22,
      networkIn: 87.2,
      networkOut: 104.6,
      responseTime: 15
    },
    publicKey: "0x2B8E5F1A4D7C9A3B6E2F5C8A1D4B7E9F2A5C8D1B",
    stakingAmount: 55000,
    validatedTransactions: 11923,
    earnings24h: 8.67,
    region: "us-west-1"
  }
];

const generateMockStats = (): NodeStats => ({
  totalNodes: 4,
  activeNodes: 3,
  avgPerformance: 94.6,
  totalRewards: 4283.06,
  totalStaked: 190000,
  totalThreats: 887,
  networkUptime: 98.75
});

// Node management functions
const useNodeActions = () => {
  const startNode = async (nodeId: string) => {
    try {
      const response = await fetch('/api/nodes/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ nodeId })
      });
      
      if (!response.ok) throw new Error('Failed to start node');
      return await response.json();
    } catch (error) {
      console.error('Error starting node:', error);
      throw error;
    }
  };

  const stopNode = async (nodeId: string) => {
    try {
      const response = await fetch('/api/nodes/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ nodeId })
      });
      
      if (!response.ok) throw new Error('Failed to stop node');
      return await response.json();
    } catch (error) {
      console.error('Error stopping node:', error);
      throw error;
    }
  };

  const restartNode = async (nodeId: string) => {
    try {
      const response = await fetch('/api/nodes/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ nodeId })
      });
      
      if (!response.ok) throw new Error('Failed to restart node');
      return await response.json();
    } catch (error) {
      console.error('Error restarting node:', error);
      throw error;
    }
  };

  return { startNode, stopNode, restartNode };
};

export default function NodesPage() {
  const { address } = useAccount();
  const router = useRouter();
  const { isConnected, isChecking } = useProtectedPage();
  const { nodes, setNodes, stats, loading, error, refetch, deleteNode } = useNodeData();
  const { startNode, stopNode, restartNode } = useNodeActions();
  
  // State for filtering and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('performance');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [showNodeSettingsModal, setShowNodeSettingsModal] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [showClaimRewardsModal, setShowClaimRewardsModal] = useState(false);
  const [showConfirmActionModal, setShowConfirmActionModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [pendingAction, setPendingAction] = useState<{action: string, nodeId: string} | null>(null);
  
  // Success notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form states
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [newNodeConfig, setNewNodeConfig] = useState({
    name: '',
    region: 'us-east-1',
    stakeAmount: '50000'
  });

  // Filtered and sorted nodes
  const filteredNodes = useMemo(() => {
    const filtered = nodes.filter(node => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           node.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || node.status === statusFilter;
      const matchesRegion = regionFilter === 'all' || node.region === regionFilter;
      
      return matchesSearch && matchesStatus && matchesRegion;
    });

    // Sort nodes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.performance - a.performance;
        case 'rewards':
          return b.rewards - a.rewards;
        case 'uptime':
          return b.uptime - a.uptime;
        case 'threats':
          return b.threatsDetected - a.threatsDetected;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [nodes, searchTerm, statusFilter, regionFilter, sortBy]);

  // Node action handlers
  const handleNodeAction = async (action: 'start' | 'stop' | 'restart', nodeId: string) => {
    setPendingAction({ action, nodeId });
    setShowConfirmActionModal(true);
  };
  
  const confirmNodeAction = async () => {
    if (!pendingAction) return;
    
    setActionLoading(pendingAction.nodeId);
    setShowConfirmActionModal(false);
    
    try {
      switch (pendingAction.action) {
        case 'start':
          await startNode(pendingAction.nodeId);
          break;
        case 'stop':
          await stopNode(pendingAction.nodeId);
          break;
        case 'restart':
          await restartNode(pendingAction.nodeId);
          break;
      }
      await refetch(); // Refresh data after action
    } catch (error) {
      console.error(`Error ${pendingAction.action}ing node:`, error);
    } finally {
      setActionLoading(null);
      setPendingAction(null);
    }
  };
  
  // Modal handlers
  const handleStakeTokens = async () => {
    if (!stakeAmount || !selectedNode) return;
    
    try {
      // Implement staking logic here
      console.log(`Staking ${stakeAmount} U2U tokens for node ${selectedNode.id}`);
      setShowStakeModal(false);
      setStakeAmount('');
      setSelectedNode(null);
      await refetch();
    } catch (error) {
      console.error('Error staking tokens:', error);
    }
  };
  
  const handleUnstakeTokens = async () => {
    if (!unstakeAmount || !selectedNode) return;
    
    try {
      // Implement unstaking logic here
      console.log(`Unstaking ${unstakeAmount} U2U tokens from node ${selectedNode.id}`);
      setShowUnstakeModal(false);
      setUnstakeAmount('');
      setSelectedNode(null);
      await refetch();
    } catch (error) {
      console.error('Error unstaking tokens:', error);
    }
  };
  
  const handleClaimRewards = async () => {
    try {
      // Implement claim rewards logic here
      console.log('Claiming all available rewards');
      setShowClaimRewardsModal(false);
      await refetch();
    } catch (error) {
      console.error('Error claiming rewards:', error);
    }
  };
  
  // Function to generate a new node
  const generateNewNode = (config: typeof newNodeConfig): NodeData => {
    const nodeNumber = String(nodes.length + 1).padStart(3, '0');
    const regionMap: Record<string, string> = {
      'us-east-1': 'New York, US',
      'us-west-1': 'Los Angeles, US', 
      'eu-west-1': 'Frankfurt, DE',
      'ap-southeast-1': 'Singapore, SG'
    };
    
    return {
      id: `dagshield-node-${nodeNumber}`,
      name: config.name,
      status: 'active',
      performance: Math.floor(Math.random() * 10) + 90, // 90-99%
      rewards: Math.floor(Math.random() * 500) + 100, // 100-600 U2U
      location: regionMap[config.region] || 'Unknown',
      uptime: Math.floor(Math.random() * 5) + 95, // 95-99%
      threatsDetected: Math.floor(Math.random() * 50),
      lastSeen: new Date().toISOString(),
      version: 'v2.1.4',
      metrics: {
        cpuUsage: Math.floor(Math.random() * 30) + 30, // 30-60%
        memoryUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
        diskUsage: Math.floor(Math.random() * 40) + 20, // 20-60%
        networkIn: Math.floor(Math.random() * 50) + 80, // 80-130 MB/s
        networkOut: Math.floor(Math.random() * 50) + 70, // 70-120 MB/s
        responseTime: Math.floor(Math.random() * 20) + 10 // 10-30ms
      },
      publicKey: `0x${Math.random().toString(16).substr(2, 40)}`,
      stakingAmount: parseInt(config.stakeAmount),
      validatedTransactions: Math.floor(Math.random() * 5000) + 1000,
      earnings24h: Math.floor(Math.random() * 10) + 5, // 5-15 U2U
      region: config.region
    };
  };

  const handleDeployNode = async () => {
    if (!newNodeConfig.name) return;
    
    try {
      // Generate new node data
      const newNode = generateNewNode(newNodeConfig);
      
      // Add to nodes list (in a real app, this would be an API call)
      setNodes(prevNodes => [...prevNodes, newNode]);
      
      // Show success notification
      setSuccessMessage(`Node "${newNodeConfig.name}" deployed successfully!`);
      setShowSuccessNotification(true);
      
      // Hide success notification after 2 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 2000);
      
      // Close modal and reset form
      setShowAddNodeModal(false);
      setNewNodeConfig({ name: '', region: 'us-east-1', stakeAmount: '50000' });
      
    } catch (error) {
      console.error('Error deploying node:', error);
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-500 text-white",
      inactive: "bg-gray-500 text-white",
      maintenance: "bg-yellow-500 text-white",
      error: "bg-red-500 text-white"
    };
    
    const icons = {
      active: CheckCircle,
      inactive: XCircle,
      maintenance: Clock,
      error: AlertTriangle
    };

    const Icon = icons[status as keyof typeof icons] || CheckCircle;
    
    return (
      <Badge className={styles[status as keyof typeof styles] || styles.inactive}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Performance indicator color
  const getPerformanceColor = (performance: number) => {
    if (performance >= 95) return "text-green-600";
    if (performance >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="text-muted-foreground">Please connect your wallet to access the nodes page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading node data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 space-y-6 animate-slide-in-up">
        {/* Page Header */}
        <div className="flex items-center justify-between animate-slide-in-up">
          <div className="animate-slide-in-right">
            <h1 className="text-3xl font-bold text-black animate-scale-in">Node Management</h1>
            <p className="text-black font-medium mt-1 animate-slide-in-up stagger-1">Monitor and manage your DAGShield nodes</p>
            {address && (
              <p className="text-sm text-gray-600 mt-1 animate-slide-in-up stagger-2">Wallet: {address}</p>
            )}
          </div>
          <div className="flex items-center space-x-3 animate-slide-in-right">
            <Button 
              variant="outline" 
              onClick={refetch}
              disabled={loading}
              className="smooth-hover animate-scale-in stagger-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 smooth-hover animate-scale-in stagger-2"
              onClick={() => setShowAddNodeModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Node
            </Button>
          </div>
        </div>

        {/* Success Notification */}
        {showSuccessNotification && (
          <Alert className="animate-slide-in-up card-hover bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-slide-in-up card-hover">
            <AlertTriangle className="h-4 w-4 animate-pulse" />
            <AlertDescription>
              {error} - Using fallback data for demonstration.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-slide-in-up">
            <Card className="bg-card card-3d animate-scale-in stagger-1">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Server className="h-6 w-6 mr-2 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-black mb-1">
                  {stats.totalNodes}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Nodes</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card card-3d animate-scale-in stagger-2">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {stats.activeNodes}
                </div>
                <div className="text-sm text-gray-600 font-medium">Active Nodes</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card card-3d animate-scale-in stagger-3">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 mr-2 text-purple-600" />
                </div>
                <div className={`text-3xl font-bold mb-1 ${getPerformanceColor(stats.avgPerformance)}`}>
                  {stats.avgPerformance.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 font-medium">Avg Performance</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card card-3d animate-scale-in stagger-4">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-6 w-6 mr-2 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-black mb-1">
                  {Math.round(stats.totalRewards).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 font-medium">U2U Rewards</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card card-3d animate-scale-in stagger-5">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 mr-2 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {Math.round(stats.totalThreats).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 font-medium">Threats Blocked</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="bg-card card-3d animate-slide-in-up">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Filter className="h-5 w-5 text-blue-600" />
              <span>Search & Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search nodes by name, ID, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 smooth-hover animate-scale-in border-2 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-11 smooth-hover animate-scale-in stagger-1 border-2">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-11 smooth-hover animate-scale-in stagger-2 border-2">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="us-east-1">US East</SelectItem>
                    <SelectItem value="us-west-1">US West</SelectItem>
                    <SelectItem value="eu-west-1">EU West</SelectItem>
                    <SelectItem value="ap-southeast-1">Asia Pacific</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40 h-11 smooth-hover animate-scale-in stagger-3 border-2">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="rewards">Rewards</SelectItem>
                    <SelectItem value="uptime">Uptime</SelectItem>
                    <SelectItem value="threats">Threats</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
              </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nodes List */}
        <Card className="bg-card card-3d animate-slide-in-up">
          <CardHeader>
            <CardTitle className="flex items-center justify-between animate-slide-in-right">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-black" />
                <span className="text-black">My Nodes ({filteredNodes.length})</span>
              </div>
              <div className="text-sm text-gray-600 animate-pulse">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredNodes.map((node, index) => (
                <div key={node.id} className={`rounded-lg p-6 card-3d-inset animate-slide-in-up stagger-${(index % 5) + 1}`}>
                  {/* Node Header */}
                  <div className="flex items-center justify-between mb-6 animate-slide-in-right">
                    <div className="flex items-center space-x-4">
                      <div className="animate-scale-in">
                        <div className="font-bold text-lg text-black">{node.name}</div>
                        <div className="font-mono text-sm text-gray-600">{node.id}</div>
                      </div>
                      <div className="animate-scale-in stagger-1">{getStatusBadge(node.status)}</div>
                      <div className="flex items-center space-x-1 text-black font-medium animate-slide-in-up stagger-2">
                        <MapPin className="h-4 w-4" />
                        <span>{node.location}</span>
                      </div>
                      <Badge variant="outline" className="animate-scale-in stagger-3">v{node.version}</Badge>
                    </div>
                    <div className="flex items-center space-x-2 animate-slide-in-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleNodeAction(node.status === 'active' ? 'stop' : 'start', node.id)}
                        disabled={actionLoading === node.id}
                        className="smooth-hover animate-scale-in stagger-1"
                      >
                        {node.status === "active" ? 
                          <Pause className="h-4 w-4 mr-2" /> : 
                          <Play className="h-4 w-4 mr-2" />
                        }
                        {node.status === "active" ? "Stop" : "Start"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleNodeAction('restart', node.id)}
                        disabled={actionLoading === node.id}
                        className="smooth-hover animate-scale-in stagger-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restart
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="smooth-hover animate-scale-in stagger-3"
                        onClick={() => {
                          setSelectedNode(node);
                          setShowNodeSettingsModal(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="smooth-hover animate-scale-in stagger-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Delete button clicked for node:', node.id);
                          
                          const shouldDelete = window.confirm(`Are you sure you want to delete node "${node.name}"? This action cannot be undone.`);
                          console.log('User confirmed deletion:', shouldDelete);
                          
                          if (shouldDelete) {
                            console.log('Deleting node:', node.id);
                            deleteNode(node.id);
                            setSuccessMessage(`Node "${node.name}" deleted successfully!`);
                            setShowSuccessNotification(true);
                            setTimeout(() => {
                              setShowSuccessNotification(false);
                            }, 2000);
                          }
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Node Metrics Tabs */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                      <TabsTrigger value="security">Security</TabsTrigger>
                      <TabsTrigger value="rewards">Rewards</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getPerformanceColor(node.performance)}`}>
                            {node.performance}%
                          </div>
                          <div className="text-sm text-black font-medium">Performance</div>
                          <Progress value={node.performance} className="h-2 mt-2" />
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-black">{node.uptime}%</div>
                          <div className="text-sm text-black font-medium">Uptime</div>
                          <Progress value={node.uptime} className="h-2 mt-2" />
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-black flex items-center justify-center">
                            <Activity className="h-5 w-5 mr-1" />
                            {Math.floor((Date.now() - new Date(node.lastSeen).getTime()) / 60000)}m
                          </div>
                          <div className="text-sm text-black font-medium">Last Seen</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-black">
                            {node.validatedTransactions.toLocaleString()}
                          </div>
                          <div className="text-sm text-black font-medium">Transactions</div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="performance" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Cpu className="h-5 w-5 mr-2" />
                            <span className="font-bold">{node.metrics.cpuUsage}%</span>
                          </div>
                          <div className="text-sm text-black font-medium">CPU Usage</div>
                          <Progress value={node.metrics.cpuUsage} className="h-2 mt-2" />
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Database className="h-5 w-5 mr-2" />
                            <span className="font-bold">{node.metrics.memoryUsage}%</span>
                          </div>
                          <div className="text-sm text-black font-medium">Memory Usage</div>
                          <Progress value={node.metrics.memoryUsage} className="h-2 mt-2" />
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <HardDrive className="h-5 w-5 mr-2" />
                            <span className="font-bold">{node.metrics.diskUsage}%</span>
                          </div>
                          <div className="text-sm text-black font-medium">Disk Usage</div>
                          <Progress value={node.metrics.diskUsage} className="h-2 mt-2" />
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Network className="h-5 w-5 mr-2" />
                            <span className="font-bold">{node.metrics.networkIn} MB/s</span>
                          </div>
                          <div className="text-sm text-black font-medium">Network In</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Wifi className="h-5 w-5 mr-2" />
                            <span className="font-bold">{node.metrics.networkOut} MB/s</span>
                          </div>
                          <div className="text-sm text-black font-medium">Network Out</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Zap className="h-5 w-5 mr-2" />
                            <span className="font-bold">{node.metrics.responseTime}ms</span>
                          </div>
                          <div className="text-sm text-black font-medium">Response Time</div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="security" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="flex items-center justify-center mb-2">
                            <Shield className="h-8 w-8 text-red-600" />
                          </div>
                          <div className="text-2xl font-bold text-red-600">{node.threatsDetected}</div>
                          <div className="text-sm text-black font-medium">Threats Detected</div>
                          <div className="text-xs text-gray-600 mt-1">Last 24h</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-lg font-bold text-black truncate">{node.publicKey}</div>
                          <div className="text-sm text-black font-medium">Public Key</div>
                          <Button variant="ghost" size="sm" className="mt-2">
                            Copy Address
                          </Button>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {(node.stakingAmount / 1000).toFixed(0)}K U2U
                          </div>
                          <div className="text-sm text-black font-medium">Staked Amount</div>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedNode(node);
                                setShowStakeModal(true);
                              }}
                            >
                              Stake More
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedNode(node);
                                setShowUnstakeModal(true);
                              }}
                            >
                              Unstake
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Security Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border rounded">
                            <span>SSL Certificate</span>
                            <Badge className="bg-green-500 text-white">Valid</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded">
                            <span>Firewall Status</span>
                            <Badge className="bg-green-500 text-white">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded">
                            <span>DDoS Protection</span>
                            <Badge className="bg-green-500 text-white">Enabled</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded">
                            <span>Intrusion Detection</span>
                            <Badge className="bg-green-500 text-white">Active</Badge>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="rewards" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 mr-2" />
                            {node.rewards.toFixed(2)}
                          </div>
                          <div className="text-sm text-black font-medium">Total Rewards</div>
                          <div className="text-xs text-gray-600 mt-1">U2U Tokens</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            +{node.earnings24h.toFixed(2)}
                          </div>
                          <div className="text-sm text-black font-medium">24h Earnings</div>
                          <div className="text-xs text-gray-600 mt-1">U2U Tokens</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {((node.earnings24h / node.stakingAmount) * 365 * 100).toFixed(2)}%
                          </div>
                          <div className="text-sm text-black font-medium">APY Estimate</div>
                          <div className="text-xs text-gray-600 mt-1">Annual Yield</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {node.validatedTransactions.toLocaleString()}
                          </div>
                          <div className="text-sm text-black font-medium">Validated Txns</div>
                          <div className="text-xs text-gray-600 mt-1">All Time</div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Reward History</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <span className="font-medium">Validation Rewards</span>
                              <div className="text-sm text-gray-600">Block #{Math.floor(Math.random() * 1000000)}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">+2.34 U2U</div>
                              <div className="text-sm text-gray-600">2 min ago</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <span className="font-medium">Threat Detection Bonus</span>
                              <div className="text-sm text-gray-600">Security Event</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">+0.89 U2U</div>
                              <div className="text-sm text-gray-600">15 min ago</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <span className="font-medium">Staking Rewards</span>
                              <div className="text-sm text-gray-600">Daily Distribution</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">+5.67 U2U</div>
                              <div className="text-sm text-gray-600">1 hour ago</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between">
                          <Button variant="outline">
                            View Full History
                          </Button>
                          <Button 
                            className="bg-primary"
                            onClick={() => setShowClaimRewardsModal(true)}
                          >
                            Claim Rewards
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ))}
            </div>
            
            {filteredNodes.length === 0 && (
              <div className="text-center py-12">
                <Server className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Nodes Found</h3>
                <p className="text-gray-500 mb-6">
                  {nodes.length === 0 
                    ? "You haven't deployed any nodes yet. Get started by deploying your first node."
                    : "No nodes match your current filter criteria. Try adjusting your search or filters."
                  }
                </p>
                {nodes.length === 0 && (
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setShowAddNodeModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Deploy Your First Node
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-black" />
              <span className="text-black">Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col transition-all dark:!bg-white/10 dark:!border-white/20 dark:!text-white dark:hover:!bg-white/20 dark:hover:!border-white/30"
                onClick={() => setShowAddNodeModal(true)}
              >
                <Plus className="h-6 w-6 mb-2" />
                Deploy Node
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col transition-all dark:!bg-white/10 dark:!border-white/20 dark:!text-white dark:hover:!bg-white/20 dark:hover:!border-white/30"
                onClick={() => setShowNodeSettingsModal(true)}
              >
                <Settings className="h-6 w-6 mb-2" />
                Bulk Settings
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col transition-all dark:!bg-white/10 dark:!border-white/20 dark:!text-white dark:hover:!bg-white/20 dark:hover:!border-white/30"
                onClick={() => router.push('/analytics')}
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                Analytics
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col transition-all dark:!bg-white/10 dark:!border-white/20 dark:!text-white dark:hover:!bg-white/20 dark:hover:!border-white/30"
                onClick={() => alert('Security logs feature coming soon!')}
              >
                <Shield className="h-6 w-6 mb-2" />
                Security Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Network Status Footer */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-black">DAGShield Network Status: Online</span>
                </div>
                <div className="text-sm text-gray-600">
                  Network Uptime: {stats?.networkUptime || 98.75}% | 
                  Active Validators: {(stats?.totalNodes || 4) * 847} | 
                  Current Block: #{Math.floor(Math.random() * 1000000)}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Network Healthy
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/analytics')}
                >
                  View Network Stats
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      
      {/* Confirm Action Modal */}
      <Dialog open={showConfirmActionModal} onOpenChange={setShowConfirmActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {pendingAction?.action} node {pendingAction?.nodeId}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmActionModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmNodeAction}>
              Confirm {pendingAction?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Node Modal */}
      <Dialog open={showAddNodeModal} onOpenChange={setShowAddNodeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deploy New Node</DialogTitle>
            <DialogDescription>
              Configure and deploy a new DAGShield node to the network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nodeName">Node Name</Label>
              <Input
                id="nodeName"
                placeholder="Enter node name"
                value={newNodeConfig.name}
                onChange={(e) => setNewNodeConfig({...newNodeConfig, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="nodeRegion">Region</Label>
              <Select value={newNodeConfig.region} onValueChange={(value) => setNewNodeConfig({...newNodeConfig, region: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East</SelectItem>
                  <SelectItem value="us-west-1">US West</SelectItem>
                  <SelectItem value="eu-west-1">EU West</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stakeAmount">Initial Stake Amount (U2U)</Label>
              <Input
                id="stakeAmount"
                type="number"
                placeholder="50000"
                value={newNodeConfig.stakeAmount}
                onChange={(e) => setNewNodeConfig({...newNodeConfig, stakeAmount: e.target.value})}
                min="0"
                max={stats ? stats.totalRewards - stats.totalStaked : 0}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Available: {stats ? (stats.totalRewards - stats.totalStaked).toLocaleString() : 0} U2U</span>
                {stats && (stats.totalRewards - stats.totalStaked) > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => setNewNodeConfig({
                      ...newNodeConfig, 
                      stakeAmount: (stats.totalRewards - stats.totalStaked).toString()
                    })}
                  >
                    Max
                  </Button>
                )}
              </div>
              {stats && (stats.totalRewards - stats.totalStaked) <= 0 && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>No balance available. Earn U2U tokens first by running existing nodes.</span>
                </div>
              )}
              {newNodeConfig.stakeAmount && 
               parseFloat(newNodeConfig.stakeAmount) > (stats ? stats.totalRewards - stats.totalStaked : 0) && 
               (stats ? stats.totalRewards - stats.totalStaked : 0) > 0 && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Insufficient balance</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNodeModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeployNode} 
              disabled={
                !newNodeConfig.name || 
                !newNodeConfig.stakeAmount ||
                parseFloat(newNodeConfig.stakeAmount) <= 0 ||
                parseFloat(newNodeConfig.stakeAmount) > (stats ? stats.totalRewards - stats.totalStaked : 0)
              }
            >
              Deploy Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node Settings Modal */}
      <Dialog open={showNodeSettingsModal} onOpenChange={setShowNodeSettingsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedNode ? `Settings - ${selectedNode.name}` : 'Node Settings'}
            </DialogTitle>
            <DialogDescription>
              Configure node settings and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Node Name</Label>
                <Input defaultValue={selectedNode?.name || ''} />
              </div>
              <div>
                <Label>Region</Label>
                <Select defaultValue={selectedNode?.region || 'us-east-1'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-east-1">US East</SelectItem>
                    <SelectItem value="us-west-1">US West</SelectItem>
                    <SelectItem value="eu-west-1">EU West</SelectItem>
                    <SelectItem value="ap-southeast-1">Asia Pacific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notification Settings</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="threats" defaultChecked />
                  <Label htmlFor="threats">Threat Detection Alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="performance" defaultChecked />
                  <Label htmlFor="performance">Performance Alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="rewards" defaultChecked />
                  <Label htmlFor="rewards">Reward Notifications</Label>
                </div>
              </div>
            </div>
            <div>
              <Label>Auto-Restart Settings</Label>
              <div className="flex items-center space-x-2 mt-2">
                <input type="checkbox" id="autoRestart" />
                <Label htmlFor="autoRestart">Enable automatic restart on failure</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNodeSettingsModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowNodeSettingsModal(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stake More Modal */}
      <Dialog open={showStakeModal} onOpenChange={setShowStakeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stake More Tokens</DialogTitle>
            <DialogDescription>
              Add more U2U tokens to increase your node&apos;s stake and potential rewards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stakeAmount">Amount to Stake (U2U)</Label>
              <Input
                id="stakeAmount"
                type="number"
                placeholder="1000"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              Current stake: {selectedNode ? (selectedNode.stakingAmount / 1000).toFixed(0) : 0}K U2U
            </div>
            <div className="text-sm text-gray-600">
              Available balance: 12,847 U2U
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStakeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleStakeTokens} disabled={!stakeAmount}>
              Stake Tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unstake Modal */}
      <Dialog open={showUnstakeModal} onOpenChange={setShowUnstakeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unstake Tokens</DialogTitle>
            <DialogDescription>
              Remove U2U tokens from your node&apos;s stake. Note: This may affect your node&apos;s performance and rewards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="unstakeAmount">Amount to Unstake (U2U)</Label>
              <Input
                id="unstakeAmount"
                type="number"
                placeholder="1000"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              Current stake: {selectedNode ? (selectedNode.stakingAmount / 1000).toFixed(0) : 0}K U2U
            </div>
            <div className="text-sm text-yellow-600">
              ⚠️ Unstaking tokens will reduce your node&apos;s voting power and potential rewards.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnstakeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnstakeTokens} disabled={!unstakeAmount}>
              Unstake Tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Rewards Modal */}
      <Dialog open={showClaimRewardsModal} onOpenChange={setShowClaimRewardsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Rewards</DialogTitle>
            <DialogDescription>
              Claim your accumulated U2U token rewards from all nodes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                +{stats ? stats.totalRewards.toFixed(2) : '0.00'} U2U
              </div>
              <div className="text-sm text-gray-600">Total claimable rewards</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Validation Rewards:</span>
                <span className="font-medium">+{stats ? (stats.totalRewards * 0.7).toFixed(2) : '0.00'} U2U</span>
              </div>
              <div className="flex justify-between">
                <span>Threat Detection Bonus:</span>
                <span className="font-medium">+{stats ? (stats.totalRewards * 0.2).toFixed(2) : '0.00'} U2U</span>
              </div>
              <div className="flex justify-between">
                <span>Staking Rewards:</span>
                <span className="font-medium">+{stats ? (stats.totalRewards * 0.1).toFixed(2) : '0.00'} U2U</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimRewardsModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleClaimRewards}>
              Claim All Rewards
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}