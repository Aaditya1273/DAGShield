"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Server, Play, Pause, Settings, TrendingUp, Plus, Activity } from "lucide-react"
import { useRouter } from "next/navigation"

// Types for node data
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
  stakingAmount: number;
  validatedTransactions: number;
  earnings24h: number;
  region: string;
}

// Load nodes from localStorage
const loadNodesFromStorage = (): NodeData[] => {
  try {
    const stored = localStorage.getItem('dagshield_nodes');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load nodes from localStorage:', error);
    return [];
  }
};

// Calculate node summary statistics
const calculateNodeSummary = (nodes: NodeData[]) => {
  const activeNodes = nodes.filter(node => node.status === 'active').length;
  const maintenanceNodes = nodes.filter(node => node.status === 'maintenance').length;
  const avgPerformance = nodes.length > 0 ? 
    Math.round(nodes.reduce((sum, node) => sum + node.performance, 0) / nodes.length) : 0;
  
  return {
    active: activeNodes,
    maintenance: maintenanceNodes,
    avgPerformance
  };
};

export function NodeManager() {
  const router = useRouter()
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNodeData = () => {
      const nodeData = loadNodesFromStorage();
      console.log('Loading nodes for dashboard:', nodeData);
      setNodes(nodeData);
      setLoading(false);
    };

    loadNodeData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadNodeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddNode = () => {
    router.push('/nodes')
  }

  // Calculate summary stats
  const summary = calculateNodeSummary(nodes);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-primary" />
              <span>My Nodes</span>
            </CardTitle>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90"
              onClick={handleAddNode}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Node
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-primary" />
            <span>My Nodes</span>
          </CardTitle>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90"
            onClick={handleAddNode}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {nodes.length === 0 ? (
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No nodes deployed</p>
              <p className="text-xs text-muted-foreground mt-1">Click &quot;Add Node&quot; to get started</p>
            </div>
          ) : (
            nodes.slice(0, 3).map((node: NodeData) => (
              <div key={node.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="font-mono text-sm text-black font-bold">{node.name}</div>
                    <Badge
                      variant={node.status === "active" ? "default" : "secondary"}
                      className={node.status === "active" ? "bg-accent text-accent-foreground" : ""}
                    >
                      {node.status}
                    </Badge>
                    <span className="text-xs text-black font-medium">{node.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {node.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-black font-medium">Performance</span>
                      <span className="text-xs font-bold text-black">{node.performance}%</span>
                    </div>
                    <Progress value={node.performance} className="h-1.5" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-black font-medium">Rewards Earned</div>
                    <div className="text-sm font-bold text-black flex items-center justify-end">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {node.rewards.toLocaleString()} DAG
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm font-bold text-black mb-2">Node Performance Summary</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-accent">{summary.active}</div>
              <div className="text-xs text-black font-medium">Active</div>
            </div>
            <div>
              <div className="text-lg font-bold text-chart-3">{summary.maintenance}</div>
              <div className="text-xs text-black font-medium">Maintenance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{summary.avgPerformance}%</div>
              <div className="text-xs text-black font-medium">Avg Performance</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
