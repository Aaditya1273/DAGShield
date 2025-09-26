"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Coins, TrendingUp, Gift, Lock, Unlock, Activity, CheckCircle, AlertCircle } from "lucide-react"

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

// Calculate real tokenomics from nodes
const calculateTokenomics = (nodes: NodeData[]) => {
  const totalRewards = nodes.reduce((sum, node) => sum + node.rewards, 0);
  const totalStaked = nodes.reduce((sum, node) => sum + node.stakingAmount, 0);
  const totalEarnings24h = nodes.reduce((sum, node) => sum + node.earnings24h, 0);
  const totalThreats = nodes.reduce((sum, node) => sum + node.threatsDetected, 0);
  
  // Calculate staking percentage
  const stakingPercentage = totalRewards > 0 ? Math.min(100, (totalStaked / totalRewards) * 100) : 0;
  
  // Calculate recent rewards breakdown
  const threatRewards = Math.floor(totalEarnings24h * 0.4); // 40% from threats
  const uptimeRewards = Math.floor(totalEarnings24h * 0.5); // 50% from uptime
  const challengeRewards = Math.floor(totalEarnings24h * 0.1); // 10% from challenges
  
  // Calculate challenge progress (threat detection)
  const challengeTarget = 50;
  const challengeProgress = Math.min(challengeTarget, totalThreats);
  const challengePercentage = (challengeProgress / challengeTarget) * 100;
  
  return {
    totalBalance: Math.floor(totalRewards),
    dailyEarnings: Math.floor(totalEarnings24h),
    stakedAmount: Math.floor(totalStaked),
    stakingPercentage: Math.round(stakingPercentage),
    threatRewards,
    uptimeRewards,
    challengeRewards,
    challengeProgress,
    challengeTarget,
    challengePercentage: Math.round(challengePercentage)
  };
};

export function TokenomicsPanel() {
  const [tokenomics, setTokenomics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadTokenomicsData = () => {
      const nodes = loadNodesFromStorage();
      console.log('Loading tokenomics for nodes:', nodes);
      const metrics = calculateTokenomics(nodes);
      console.log('Calculated tokenomics:', metrics);
      setTokenomics(metrics);
      setLoading(false);
    };

    loadTokenomicsData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadTokenomicsData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate available balance for staking (total - already staked)
  const getAvailableBalance = () => {
    if (!tokenomics) return 0;
    return tokenomics.totalBalance - tokenomics.stakedAmount;
  };

  // Handle stake tokens
  const handleStake = async () => {
    if (!stakeAmount || isStaking) return;
    
    const amount = parseFloat(stakeAmount);
    const availableBalance = getAvailableBalance();
    
    if (amount > availableBalance) return; // Should be disabled by validation
    
    setIsStaking(true);
    
    // Simulate staking process
    setTimeout(() => {
      // Update localStorage with new staked amount
      const nodes = loadNodesFromStorage();
      const updatedNodes = nodes.map(node => ({
        ...node,
        stakingAmount: node.stakingAmount + (amount / nodes.length) // Distribute equally
      }));
      
      // Save updated nodes
      localStorage.setItem('dagshield_nodes', JSON.stringify(updatedNodes));
      
      // Refresh tokenomics
      const newMetrics = calculateTokenomics(updatedNodes);
      setTokenomics(newMetrics);
      
      setIsStaking(false);
      setShowStakeModal(false);
      setStakeAmount('');
      setSuccessMessage(`Successfully staked ${amount} DAG tokens!`);
      setShowSuccessNotification(true);
      
      setTimeout(() => setShowSuccessNotification(false), 3000);
    }, 2000);
  };

  // Handle unstake tokens
  const handleUnstake = async () => {
    if (!unstakeAmount || isUnstaking) return;
    
    const amount = parseFloat(unstakeAmount);
    
    if (amount > tokenomics.stakedAmount) return; // Should be disabled by validation
    
    setIsUnstaking(true);
    
    // Simulate unstaking process
    setTimeout(() => {
      // Update localStorage with reduced staked amount
      const nodes = loadNodesFromStorage();
      const updatedNodes = nodes.map(node => ({
        ...node,
        stakingAmount: Math.max(0, node.stakingAmount - (amount / nodes.length)) // Distribute equally
      }));
      
      // Save updated nodes
      localStorage.setItem('dagshield_nodes', JSON.stringify(updatedNodes));
      
      // Refresh tokenomics
      const newMetrics = calculateTokenomics(updatedNodes);
      setTokenomics(newMetrics);
      
      setIsUnstaking(false);
      setShowUnstakeModal(false);
      setUnstakeAmount('');
      setSuccessMessage(`Successfully unstaked ${amount} DAG tokens!`);
      setShowSuccessNotification(true);
      
      setTimeout(() => setShowSuccessNotification(false), 3000);
    }, 2000);
  };

  // Validation functions
  const isStakeAmountValid = () => {
    if (!stakeAmount) return false;
    const amount = parseFloat(stakeAmount);
    return amount > 0 && amount <= getAvailableBalance();
  };

  const isUnstakeAmountValid = () => {
    if (!unstakeAmount) return false;
    const amount = parseFloat(unstakeAmount);
    return amount > 0 && amount <= tokenomics?.stakedAmount;
  };

  if (loading || !tokenomics) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-chart-3" />
            <span>DAG Rewards</span>
          </CardTitle>
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
        <CardTitle className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-chart-3" />
          <span>DAG Rewards</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Overview */}
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-3xl font-bold text-chart-3 mb-1">{tokenomics.totalBalance.toLocaleString()} DAG</div>
          <div className="text-sm text-black font-medium">Total Balance</div>
          <div className="flex items-center justify-center mt-2 text-sm text-accent">
            <TrendingUp className="h-4 w-4 mr-1" />
            +{tokenomics.dailyEarnings} DAG today
          </div>
        </div>

        {/* Staking Status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-black">Staked Tokens</span>
            </div>
            <Badge variant="outline" className="text-primary border-primary">
              {tokenomics.stakedAmount.toLocaleString()} DAG
            </Badge>
          </div>
          <Progress value={tokenomics.stakingPercentage} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-black font-medium">
            <span>{tokenomics.stakingPercentage}% of balance staked</span>
            <span>APY: 12.5%</span>
          </div>
        </div>

        {/* Available Actions */}
        <div className="space-y-3">
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => setShowStakeModal(true)}
          >
            <Coins className="h-4 w-4 mr-2" />
            Stake More Tokens
          </Button>
          <Button 
            variant="outline" 
            className="w-full bg-transparent"
            onClick={() => setShowUnstakeModal(true)}
          >
            <Unlock className="h-4 w-4 mr-2" />
            Unstake Tokens
          </Button>
        </div>

        {/* Rewards Breakdown */}
        <div className="space-y-3">
          <div className="text-sm font-bold text-black">Recent Rewards</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-black font-medium">Threat Detection</span>
              <span className="text-black font-bold">+{tokenomics.threatRewards} DAG</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-black font-medium">Node Uptime</span>
              <span className="text-black font-bold">+{tokenomics.uptimeRewards} DAG</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-black font-medium">Community Challenge</span>
              <span className="text-black font-bold">+{tokenomics.challengeRewards} DAG</span>
            </div>
          </div>
        </div>

        {/* Gamification Element */}
        <div className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
          <div className="flex items-center space-x-2 mb-2">
            <Gift className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-black">Weekly Challenge</span>
            <Badge variant="secondary" className="text-xs">
              2 days left
            </Badge>
          </div>
          <div className="text-xs text-black font-medium mb-2">Detect 50 threats to earn bonus rewards</div>
          <Progress value={tokenomics.challengePercentage} className="h-1.5" />
          <div className="text-xs text-black font-medium mt-1">{tokenomics.challengeProgress}/{tokenomics.challengeTarget} threats detected</div>
        </div>
      </CardContent>

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg animate-slide-in-up">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Stake Tokens Modal */}
      <Dialog open={showStakeModal} onOpenChange={setShowStakeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Stake DAG Tokens</span>
            </DialogTitle>
            <DialogDescription>
              Stake your DAG tokens to earn rewards and support the network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stakeAmount">Amount to Stake</Label>
              <Input
                id="stakeAmount"
                type="number"
                placeholder="Enter amount"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="mt-1"
                min="0"
                max={getAvailableBalance()}
                step="0.01"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Available: {getAvailableBalance().toLocaleString()} DAG</span>
                {getAvailableBalance() > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => setStakeAmount(getAvailableBalance().toString())}
                  >
                    Max
                  </Button>
                )}
              </div>
              {getAvailableBalance() <= 0 && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>No balance available. Deploy nodes to earn DAG tokens.</span>
                </div>
              )}
              {stakeAmount && parseFloat(stakeAmount) > getAvailableBalance() && getAvailableBalance() > 0 && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Insufficient balance</span>
                </div>
              )}
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Staking Benefits:</div>
              <ul className="text-xs space-y-1">
                <li>• 12.5% APY rewards</li>
                <li>• Support network security</li>
                <li>• Governance voting rights</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStakeModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStake}
              disabled={!isStakeAmountValid() || isStaking}
              className="bg-primary hover:bg-primary/90"
            >
              {isStaking ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Staking...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Stake Tokens
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unstake Tokens Modal */}
      <Dialog open={showUnstakeModal} onOpenChange={setShowUnstakeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Unlock className="h-5 w-5" />
              <span>Unstake DAG Tokens</span>
            </DialogTitle>
            <DialogDescription>
              Unstake your DAG tokens. Note: There may be a cooldown period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="unstakeAmount">Amount to Unstake</Label>
              <Input
                id="unstakeAmount"
                type="number"
                placeholder="Enter amount"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                className="mt-1"
                min="0"
                max={tokenomics?.stakedAmount || 0}
                step="0.01"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Staked: {tokenomics?.stakedAmount?.toLocaleString() || 0} DAG</span>
                {(tokenomics?.stakedAmount || 0) > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => setUnstakeAmount(tokenomics?.stakedAmount?.toString() || '0')}
                  >
                    Max
                  </Button>
                )}
              </div>
              {(tokenomics?.stakedAmount || 0) <= 0 && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>No tokens staked. Stake tokens first to earn rewards.</span>
                </div>
              )}
              {unstakeAmount && parseFloat(unstakeAmount) > (tokenomics?.stakedAmount || 0) && (tokenomics?.stakedAmount || 0) > 0 && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Insufficient staked balance</span>
                </div>
              )}
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="text-xs text-yellow-800">
                ⚠️ Unstaking will stop earning rewards for the unstaked amount.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnstakeModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUnstake}
              disabled={!isUnstakeAmountValid() || isUnstaking}
              variant="outline"
            >
              {isUnstaking ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Unstaking...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unstake Tokens
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
