"use client"

import { useState, useEffect } from "react"
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trophy, Star, Flame, Award, Users, Clock, Edit, User, CheckCircle } from "lucide-react"

// Types for node data (matching the nodes page)
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

// Load nodes from localStorage (same function as nodes page)
const loadNodesFromStorage = (): NodeData[] => {
  try {
    const stored = localStorage.getItem('dagshield_nodes');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load nodes from localStorage:', error);
    return [];
  }
};

// Fetch real gamification data from SQLite database
const fetchGamificationData = async (address: string, nodes: NodeData[]) => {
  try {
    // Update user data with current nodes
    const updateResponse = await fetch(`/api/gamification/${address}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes })
    });
    
    if (!updateResponse.ok) throw new Error('Failed to update user data');
    
    const userData = await updateResponse.json();
    
    // Fetch challenges
    const challengesResponse = await fetch(`/api/challenges/${address}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, userStats: userData.user })
    });
    
    const challengesData = challengesResponse.ok ? await challengesResponse.json() : { challenges: [] };
    
    // Fetch leaderboard
    const leaderboardResponse = await fetch('/api/leaderboard');
    const leaderboardData = leaderboardResponse.ok ? await leaderboardResponse.json() : { leaderboard: [] };
    
    return {
      userStats: userData.user,
      challenges: challengesData.challenges || [],
      leaderboard: leaderboardData.leaderboard || []
    };
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    return null;
  }
};

// Generate real user stats from actual node data
const generateRealUserStats = (nodes: NodeData[]) => {
  const totalThreats = nodes.reduce((sum, node) => sum + node.threatsDetected, 0);
  const totalRewards = nodes.reduce((sum, node) => sum + node.rewards, 0);
  const avgUptime = nodes.length > 0 ? nodes.reduce((sum, node) => sum + node.uptime, 0) / nodes.length : 0;
  const totalTransactions = nodes.reduce((sum, node) => sum + node.validatedTransactions, 0);
  const totalStaked = nodes.reduce((sum, node) => sum + node.stakingAmount, 0);
  
  // Calculate level based on total rewards (every 1000 DAG = 1 level)
  const level = Math.floor(totalRewards / 1000) + 1;
  const experience = Math.floor(totalRewards * 10); // 10 XP per DAG
  const nextLevelExp = level * 10000; // Next level requires 10k more XP
  
  // Calculate streak (mock for now, could be based on node activity)
  const streak = Math.min(Math.floor(avgUptime / 10), 30); // Max 30 day streak
  
  // Calculate challenges completed based on achievements
  const challengesCompleted = Math.floor(totalThreats / 100) + Math.floor(avgUptime / 20);
  
  // Calculate rank based on total rewards (mock ranking)
  const rank = Math.max(1, 100 - Math.floor(totalRewards / 500));
  
  return {
    level,
    experience,
    nextLevelExp,
    streak,
    totalRewards: Math.floor(totalRewards),
    threatsDetected: totalThreats,
    nodeUptime: Math.round(avgUptime * 10) / 10,
    challengesCompleted,
    achievements: Math.floor(totalThreats / 50) + Math.floor(avgUptime / 25),
    achievementsUnlocked: Math.floor(totalThreats / 50) + Math.floor(avgUptime / 25),
    rank,
    rankPosition: rank,
    totalNodes: nodes.length,
    totalTransactions,
    totalStaked
  };
};

// Static challenges removed - now using real data from SQLite database

interface UserStats {
  threatsDetected: number;
  nodeUptime: number;
  totalNodes: number;
  totalStaked: number;
  totalRewards: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  challengesCompleted: number;
  achievementsUnlocked: number;
  achievements: number;
  streak: number;
  rankPosition: number;
  rank: number;
  totalTransactions: number;
}

// Generate real achievements based on user stats
const generateRealAchievements = (userStats: UserStats | null) => {
  if (!userStats) return [];
  
  return [
    { 
      id: 1, 
      name: "First Blood", 
      description: "Detected your first threat", 
      reward: 100, 
      unlocked: userStats.threatsDetected > 0 
    },
    { 
      id: 2, 
      name: "Guardian", 
      description: "Detected 100 threats", 
      reward: 1000, 
      unlocked: userStats.threatsDetected >= 100 
    },
    { 
      id: 3, 
      name: "Always On", 
      description: "99% uptime for 30 days", 
      reward: 2000, 
      unlocked: userStats.nodeUptime >= 99 
    },
    { 
      id: 4, 
      name: "Node Uptime Master", 
      description: "Current uptime: " + Math.round(userStats.nodeUptime) + "%", 
      reward: 1500, 
      unlocked: userStats.nodeUptime >= 95, 
      showUptime: true 
    },
    { 
      id: 5, 
      name: "Rising Star", 
      description: "Reached level 10", 
      reward: 500, 
      unlocked: userStats.level >= 10 
    },
    { 
      id: 6, 
      name: "Sentinel", 
      description: "Detected 1000 threats", 
      reward: 10000, 
      unlocked: userStats.threatsDetected >= 1000 
    },
    { 
      id: 7, 
      name: "Node Master", 
      description: "Deploy 5 nodes", 
      reward: 2500, 
      unlocked: userStats.totalNodes >= 5 
    },
    { 
      id: 8, 
      name: "Whale Staker", 
      description: "Stake 100K DAG tokens", 
      reward: 5000, 
      unlocked: userStats.totalStaked >= 100000 
    }
  ];
};

// Static leaderboard removed - now using real data from SQLite database

// LocalStorage keys
const USER_PROFILE_KEY = 'dagshield_user_profile';
const STREAK_STORAGE_KEY = 'dagshield_user_streaks';

interface UserProfile {
  name: string;
  title: string;
}

// Helper functions for user profile
const saveUserProfile = (address: string, profile: UserProfile) => {
  try {
    const profiles = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}');
    profiles[address] = profile;
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profiles));
    console.log('User profile saved:', profile);
  } catch (error) {
    console.error('Failed to save user profile:', error);
  }
};

const loadUserProfile = (address: string): UserProfile => {
  try {
    const profiles = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}');
    return profiles[address] || { name: '', title: 'Guardian Protector' };
  } catch (error) {
    console.error('Failed to load user profile:', error);
    return { name: '', title: 'Guardian Protector' };
  }
};

// Export function to get user display name by address (for use in other components)
export const getUserDisplayName = (address: string) => {
  const profile = loadUserProfile(address);
  if (profile.name) return profile.name;
  if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`;
  return 'Anonymous';
};

type StreakData = {
  streak: number;
  lastActive: string;
};

const loadStreakData = (address: string): StreakData | null => {
  try {
    const streaks = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
    return streaks[address] || null;
  } catch (error) {
    console.error('Failed to load streak data:', error);
    return null;
  }
};

const saveStreakData = (address: string, data: StreakData) => {
  try {
    const streaks = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
    streaks[address] = data;
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streaks));
  } catch (error) {
    console.error('Failed to save streak data:', error);
  }
};

const updateDailyStreak = (address: string): number => {
  if (!address) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const existingData = loadStreakData(address);

  if (!existingData) {
    const initial = { streak: 1, lastActive: todayISO };
    saveStreakData(address, initial);
    return 1;
  }

  const lastActiveDate = new Date(existingData.lastActive);
  lastActiveDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
  let streak = existingData.streak || 1;

  if (diffDays === 0) {
    streak = Math.max(streak, 1);
  } else if (diffDays === 1) {
    streak = streak + 1;
  } else if (diffDays > 1) {
    streak = 1;
  }

  const updatedData = { streak, lastActive: todayISO };
  saveStreakData(address, updatedData);
  return streak;
};

interface Challenge {
  id: number;
  name?: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  type?: string;
  timeLeft?: string;
}

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  displayName: string;
  user?: string;
  level: number;
  totalRewards: number;
  threatsDetected: number;
  score?: number;
}

export function GamificationDashboard() {
  const { address } = useAccount();
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', title: 'Guardian Protector' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user profile on component mount
  useEffect(() => {
    if (address) {
      const profile = loadUserProfile(address);
      setUserProfile(profile);
      setEditName(profile.name);
    }
  }, [address]);

  // Load real gamification data from SQLite database
  useEffect(() => {
    const loadGamificationData = async () => {
      if (!address) return;
      
      setLoading(true);
      console.log('Loading gamification data for address:', address);
      const currentStreak = updateDailyStreak(address);
      
      const data = await fetchGamificationData(address, []);
      if (data) {
        console.log('Fetched gamification data:', data);
        const mergedStats = {
          ...data.userStats,
          streak: Math.max(currentStreak, data.userStats?.streak ?? 1)
        };
        setUserStats(mergedStats);
        setChallenges(data.challenges);
        setLeaderboard(data.leaderboard);
      } else {
        // Fallback to empty stats if API fails
        const fallbackStats = {
          level: 1,
          experience: 0,
          nextLevelExp: 10000,
          totalRewards: 0,
          totalStaked: 0,
          totalNodes: 0,
          threatsDetected: 0,
          nodeUptime: 0,
          challengesCompleted: 0,
          achievementsUnlocked: 0,
          achievements: 0,
          streak: Math.max(currentStreak, 1),
          rankPosition: 0,
          rank: 0,
          totalTransactions: 0
        };
        setUserStats(fallbackStats);
        setChallenges([]);
        setLeaderboard([]);
      }
      setLoading(false);
    };

    loadGamificationData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadGamificationData, 30000);
    return () => clearInterval(interval);
  }, [address]);

  // Handle name update
  const handleUpdateName = () => {
    if (!address || !editName.trim()) return;
    
    const updatedProfile = { ...userProfile, name: editName.trim() };
    setUserProfile(updatedProfile);
    saveUserProfile(address, updatedProfile);
    
    setShowEditModal(false);
    setShowSuccessNotification(true);
    
    // Hide success notification after 2 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 2000);
  };

  // Get display name (use custom name or shortened address)
  const getDisplayName = () => {
    if (userProfile.name) return userProfile.name;
    if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`;
    return 'Anonymous';
  };

  // Show loading state
  if (loading || !userStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Star className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading gamification data...</p>
        </div>
      </div>
    );
  }

  // Generate real achievements based on current stats
  const recentAchievements = generateRealAchievements(userStats);

  return (
    <div className="space-y-6">
      {/* User Level & Progress */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <Badge className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground">
                  {userStats.level}
                </Badge>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold text-foreground">Level {userStats.level}</h2>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-lg font-medium text-foreground">{getDisplayName()}</p>
                <p className="text-sm text-muted-foreground">{userProfile.title}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Flame className="h-5 w-5 text-chart-3" />
                <span className="text-lg font-bold text-chart-3">{userStats.streak} day streak</span>
              </div>
              <div className="text-sm text-muted-foreground">Rank #{userStats.rank} globally</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Experience</span>
              <span>
                {userStats.experience?.toLocaleString() || 0} / {userStats.nextLevelExp?.toLocaleString() || 0}
              </span>
            </div>
            <Progress value={userStats.nextLevelExp > 0 ? (userStats.experience / userStats.nextLevelExp) * 100 : 0} className="h-3" />
            <div className="text-xs text-muted-foreground">
              {((userStats.nextLevelExp || 0) - (userStats.experience || 0)).toLocaleString()} XP to next level
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="challenges" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{challenge.name}</h3>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={challenge.type === "weekly" ? "default" : "secondary"}>{challenge.type}</Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {challenge.timeLeft}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {challenge.progress} / {challenge.target}
                      </span>
                    </div>
                    <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {Math.round((challenge.progress / challenge.target) * 100)}% complete
                      </span>
                      <div className="flex items-center text-accent">
                        <Trophy className="h-3 w-3 mr-1" />
                        <span className="text-sm font-medium">{challenge.reward} DAG</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-3">
            {recentAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`bg-card border-border ${achievement.unlocked ? "opacity-100" : "opacity-60"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          achievement.unlocked ? "bg-gradient-to-br from-yellow-100 to-yellow-200 border border-yellow-300" : "bg-gray-100 border border-gray-300"
                        }`}
                      >
                        <Award
                          className={`h-5 w-5 ${achievement.unlocked ? "text-yellow-600" : "text-gray-400"}`}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-black">{achievement.name}</h3>
                        <p className="text-sm text-black">{achievement.description}</p>
                        {achievement.showUptime && (
                          <div className="text-2xl font-bold text-black mt-1">{userStats.nodeUptime}%</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {achievement.unlocked ? (
                        <Badge className="bg-green-500 text-white">✓ Unlocked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 border-gray-300">🔒 Locked</Badge>
                      )}
                      <div className={`text-sm mt-1 font-medium ${achievement.unlocked ? 'text-green-600' : 'text-gray-500'}`}>
                        +{achievement.reward} DAG
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Global Leaderboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.walletAddress === address ? "bg-primary/10 border border-primary/20" : "bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          entry.rank === 1
                            ? "bg-chart-3 text-background"
                            : entry.rank === 2
                              ? "bg-muted text-foreground"
                              : entry.rank === 3
                                ? "bg-chart-4 text-background"
                                : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {entry.walletAddress === address ? getDisplayName() : entry.user}
                        </div>
                        <div className="text-sm text-muted-foreground">Level {entry.level}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{entry.score?.toLocaleString() || 0}</div>
                      <div className="text-sm text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{userStats.threatsDetected}</div>
                <div className="text-sm text-muted-foreground">Threats Detected</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">{userStats.nodeUptime}%</div>
                <div className="text-sm text-muted-foreground">Node Uptime</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-chart-3">{userStats.challengesCompleted}</div>
                <div className="text-sm text-muted-foreground">Challenges Won</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{userStats.totalRewards?.toLocaleString() || 0}</div>
                <div className="text-sm text-muted-foreground">Total Rewards</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Performance Multipliers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Node Performance</span>
                  <span className="text-sm font-medium">+25%</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Threat Detection</span>
                  <span className="text-sm font-medium">+15%</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Community Participation</span>
                  <span className="text-sm font-medium">+10%</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Loyalty Bonus</span>
                  <span className="text-sm font-medium">+30%</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg animate-slide-in-up">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Profile updated successfully!</span>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Edit Profile</span>
            </DialogTitle>
            <DialogDescription>
              Update your display name and title for the DAGShield network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Enter your display name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This name will be shown in leaderboards and rewards
              </p>
            </div>
            <div>
              <Label>Wallet Address</Label>
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {address || 'Not connected'}
              </div>
            </div>
            <div>
              <Label>Current Title</Label>
              <div className="text-sm text-foreground">
                {userProfile.title}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateName} disabled={!editName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
