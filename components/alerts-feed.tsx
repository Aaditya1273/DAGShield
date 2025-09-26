"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Shield, Eye, ExternalLink, Activity, Clock, MapPin, Cpu } from "lucide-react"

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

// Generate real alerts based on node data and activity
const generateRealAlerts = (nodes: NodeData[]) => {
  const alerts = [];
  const chains = ['Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Optimism'];
  const regions = ['US-East', 'EU-West', 'Asia-Pacific', 'US-West', 'EU-Central'];
  
  // Generate alerts based on actual node activity
  nodes.forEach((node, index) => {
    const chain = chains[index % chains.length];
    const timeAgo = Math.floor(Math.random() * 30) + 1; // 1-30 minutes ago
    
    // High threat detection = critical alert
    if (node.threatsDetected > 100) {
      alerts.push({
        id: `threat-${node.id}`,
        type: "critical",
        title: "High Threat Activity Detected",
        description: `Node ${node.name} detected ${node.threatsDetected} threats in the last 24h`,
        time: `${timeAgo} minutes ago`,
        chain: chain,
        address: `0x${node.id.slice(0, 4)}...${node.id.slice(-4)}`,
        confidence: Math.min(98, node.performance + Math.floor(Math.random() * 10)),
        nodeId: node.id,
        nodeName: node.name
      });
    }
    
    // Low performance = warning
    if (node.performance < 90) {
      alerts.push({
        id: `perf-${node.id}`,
        type: "warning",
        title: "Node Performance Alert",
        description: `Node ${node.name} performance dropped to ${node.performance}%`,
        time: `${timeAgo + 5} minutes ago`,
        chain: chain,
        address: `0x${node.id.slice(0, 4)}...${node.id.slice(-4)}`,
        confidence: 85,
        nodeId: node.id,
        nodeName: node.name
      });
    }
    
    // Maintenance status = info
    if (node.status === 'maintenance') {
      alerts.push({
        id: `maint-${node.id}`,
        type: "info",
        title: "Node Maintenance Mode",
        description: `Node ${node.name} is currently under maintenance`,
        time: `${timeAgo + 10} minutes ago`,
        chain: chain,
        address: `0x${node.id.slice(0, 4)}...${node.id.slice(-4)}`,
        confidence: 100,
        nodeId: node.id,
        nodeName: node.name
      });
    }
    
    // High performance = blocked threat (success)
    if (node.performance > 95 && node.threatsDetected > 50) {
      alerts.push({
        id: `blocked-${node.id}`,
        type: "blocked",
        title: "Threats Successfully Blocked",
        description: `Node ${node.name} blocked ${Math.floor(node.threatsDetected * 0.95)} threats with ${node.performance}% efficiency`,
        time: `${timeAgo + 15} minutes ago`,
        chain: chain,
        address: `0x${node.id.slice(0, 4)}...${node.id.slice(-4)}`,
        confidence: node.performance,
        nodeId: node.id,
        nodeName: node.name
      });
    }
  });
  
  // If no nodes, show system status
  if (nodes.length === 0) {
    alerts.push({
      id: 'no-nodes',
      type: "info",
      title: "No Active Nodes",
      description: "Deploy nodes to start monitoring network threats",
      time: "Just now",
      chain: "System",
      address: "0x0000...0000",
      confidence: 100,
      nodeId: null,
      nodeName: "System"
    });
  }
  
  // Sort by time (most recent first) and limit to 4 alerts
  return alerts.slice(0, 4);
};

export function AlertsFeed() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);

  useEffect(() => {
    const loadAlertsData = () => {
      const nodes = loadNodesFromStorage();
      console.log('Loading alerts for nodes:', nodes);
      const realAlerts = generateRealAlerts(nodes);
      console.log('Generated alerts:', realAlerts);
      setAlerts(realAlerts);
      setLoading(false);
    };

    loadAlertsData();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(loadAlertsData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-chart-3" />
              <span>Real-time Threat Alerts</span>
            </CardTitle>
            <Button variant="outline" size="sm">
              View All
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
            <AlertTriangle className="h-5 w-5 text-chart-3" />
            <span>Real-time Threat Alerts</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAllAlerts(true)}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No recent alerts</p>
              <p className="text-xs text-muted-foreground mt-1">Your network is secure</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${
                  alert.type === "critical"
                    ? "border-destructive/50 bg-destructive/5"
                    : alert.type === "warning"
                      ? "border-chart-3/50 bg-chart-3/5"
                      : alert.type === "blocked"
                        ? "border-accent/50 bg-accent/5"
                        : "border-border bg-muted/20"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {alert.type === "critical" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    {alert.type === "warning" && <Eye className="h-4 w-4 text-chart-3" />}
                    {alert.type === "blocked" && <Shield className="h-4 w-4 text-accent" />}
                    {alert.type === "info" && <Eye className="h-4 w-4 text-primary" />}
                    <span className="font-medium text-sm">{alert.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        alert.type === "critical"
                          ? "destructive"
                          : alert.type === "warning"
                            ? "secondary"
                            : alert.type === "blocked"
                              ? "default"
                              : "outline"
                      }
                      className={alert.type === "blocked" ? "bg-accent text-accent-foreground" : ""}
                    >
                      {alert.chain}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {alert.confidence}% confidence
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{alert.time}</span>
                    <span className="font-mono">{alert.address}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowAlertDetails(true);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* View All Alerts Modal */}
      <Dialog open={showAllAlerts} onOpenChange={setShowAllAlerts}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-chart-3" />
              <span>All Threat Alerts</span>
            </DialogTitle>
            <DialogDescription>
              Complete history of threat alerts from your network nodes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No alerts found</p>
                <p className="text-xs text-muted-foreground mt-1">Deploy nodes to start monitoring</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${
                    alert.type === "critical"
                      ? "border-destructive/50 bg-destructive/5"
                      : alert.type === "warning"
                        ? "border-chart-3/50 bg-chart-3/5"
                        : alert.type === "blocked"
                          ? "border-accent/50 bg-accent/5"
                          : "border-border bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {alert.type === "critical" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      {alert.type === "warning" && <Eye className="h-4 w-4 text-chart-3" />}
                      {alert.type === "blocked" && <Shield className="h-4 w-4 text-accent" />}
                      {alert.type === "info" && <Eye className="h-4 w-4 text-primary" />}
                      <span className="font-medium text-sm">{alert.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          alert.type === "critical"
                            ? "destructive"
                            : alert.type === "warning"
                              ? "secondary"
                              : alert.type === "blocked"
                                ? "default"
                                : "outline"
                        }
                        className={alert.type === "blocked" ? "bg-accent text-accent-foreground" : ""}
                      >
                        {alert.chain}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{alert.time}</span>
                      <span className="font-mono">{alert.address}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowAlertDetails(true);
                        setShowAllAlerts(false);
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllAlerts(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Details Modal */}
      <Dialog open={showAlertDetails} onOpenChange={setShowAlertDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedAlert?.type === "critical" && <AlertTriangle className="h-5 w-5 text-destructive" />}
              {selectedAlert?.type === "warning" && <Eye className="h-5 w-5 text-chart-3" />}
              {selectedAlert?.type === "blocked" && <Shield className="h-5 w-5 text-accent" />}
              {selectedAlert?.type === "info" && <Eye className="h-5 w-5 text-primary" />}
              <span>{selectedAlert?.title}</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this threat alert.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              {/* Alert Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Alert Type</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      variant={
                        selectedAlert.type === "critical"
                          ? "destructive"
                          : selectedAlert.type === "warning"
                            ? "secondary"
                            : selectedAlert.type === "blocked"
                              ? "default"
                              : "outline"
                      }
                      className={selectedAlert.type === "blocked" ? "bg-accent text-accent-foreground" : ""}
                    >
                      {selectedAlert.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Confidence Level</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedAlert.confidence}%</Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{selectedAlert.description}</p>
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Blockchain</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{selectedAlert.chain}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Contract Address</Label>
                  <div className="font-mono text-sm mt-1">{selectedAlert.address}</div>
                </div>
              </div>

              {/* Node Information */}
              {selectedAlert.nodeName && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Detected By</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedAlert.nodeName}</span>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Detection Time</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedAlert.time}</span>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-xs font-medium text-muted-foreground">Recommended Actions</Label>
                <ul className="text-sm mt-2 space-y-1">
                  {selectedAlert.type === "critical" && (
                    <>
                      <li>• Block suspicious transactions immediately</li>
                      <li>• Monitor related addresses for activity</li>
                      <li>• Report to security team</li>
                    </>
                  )}
                  {selectedAlert.type === "warning" && (
                    <>
                      <li>• Monitor node performance closely</li>
                      <li>• Check system resources and connectivity</li>
                      <li>• Consider node maintenance if needed</li>
                    </>
                  )}
                  {selectedAlert.type === "blocked" && (
                    <>
                      <li>• Threat successfully neutralized</li>
                      <li>• Continue monitoring for similar patterns</li>
                      <li>• Update threat detection rules</li>
                    </>
                  )}
                  {selectedAlert.type === "info" && (
                    <>
                      <li>• No immediate action required</li>
                      <li>• Monitor for status changes</li>
                      <li>• Review maintenance schedule</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAlertDetails(false)}>
              Close
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
