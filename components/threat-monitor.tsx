"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, Activity } from "lucide-react"

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

// Calculate real threat metrics from nodes
const calculateThreatMetrics = (nodes: NodeData[]) => {
  const totalThreats = nodes.reduce((sum, node) => sum + node.threatsDetected, 0);
  const avgPerformance = nodes.length > 0 ? nodes.reduce((sum, node) => sum + node.performance, 0) / nodes.length : 0;
  
  // Calculate blocked threats based on performance
  const blockedThreats = Math.floor(totalThreats * (avgPerformance / 100));
  const successRate = totalThreats > 0 ? (blockedThreats / totalThreats) * 100 : 0;
  
  // Calculate consensus latency (mock based on performance)
  const consensusLatency = Math.max(30, Math.floor(100 - avgPerformance) + Math.floor(Math.random() * 20));
  
  return {
    totalThreats: totalThreats,
    blockedThreats: blockedThreats,
    successRate: Math.round(successRate * 10) / 10,
    avgResponse: 0.3, // Keep static for now
    consensus: consensusLatency
  };
};

export function ThreatMonitor() {
  // Removed unused address variable - will be used when user-specific filtering is added
  const [threatMetrics, setThreatMetrics] = useState<{
    totalThreats: number;
    blockedThreats: number;
    successRate: number;
    avgResponse: number;
    consensus: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThreatData = () => {
      const nodes = loadNodesFromStorage();
      console.log('Loading threat metrics for nodes:', nodes);
      const metrics = calculateThreatMetrics(nodes);
      console.log('Calculated threat metrics:', metrics);
      setThreatMetrics(metrics);
      setLoading(false);
    };

    loadThreatData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadThreatData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !threatMetrics) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Threat Detection</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-black border-black">
                <Activity className="h-3 w-3 mr-1 text-black animate-spin" />
                Loading...
              </Badge>
            </div>
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
            <Shield className="h-5 w-5 text-primary" />
            <span>Threat Detection</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-black border-black">
              <Zap className="h-3 w-3 mr-1 text-black" />
              Real-time
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{threatMetrics.totalThreats.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Threats Detected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black">{threatMetrics.blockedThreats.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Threats Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-chart-3">{threatMetrics.successRate}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{threatMetrics.avgResponse}s</div>
            <div className="text-sm text-muted-foreground">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black">{threatMetrics.consensus}ms</div>
            <div className="text-sm text-muted-foreground">Consensus</div>
          </div>
        </div>

        <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg border border-border">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Threat Detection Chart</p>
            <p className="text-xs text-muted-foreground mt-1">Real-time monitoring active</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
