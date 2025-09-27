import { NextRequest, NextResponse } from 'next/server';

// Required for static export
export const dynamic = 'force-static';
export const revalidate = false;

// Conditional import for better-sqlite3 to avoid build issues on static export
let Database: any = null;
let path: any = null;

try {
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
    Database = require('better-sqlite3');
    path = require('path');
  }
} catch (error) {
  console.warn('SQLite not available in this environment');
}

interface NodeSnapshot {
  threatsDetected?: number;
  rewards?: number;
  uptime?: number;
  stakingAmount?: number;
}

interface GamificationRequestBody {
  nodes?: NodeSnapshot[];
  displayName?: string;
}

interface UserRow {
  wallet_address: string;
  display_name: string | null;
  level: number | null;
  experience: number | null;
  total_rewards: number | null;
  threats_detected: number | null;
  node_uptime: number | null;
  total_nodes: number | null;
  total_staked: number | null;
  challenges_completed: number | null;
  streak: number | null;
  rank_position: number | null;
  created_at: string | null;
}

// Initialize database (only in development)
let db: any = null;
if (Database && path) {
  const dbPath = path.join(process.cwd(), 'dagshield.db');
  db = new Database(dbPath);
}

// Initialize tables if they don't exist
if (db) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    wallet_address TEXT PRIMARY KEY,
    display_name TEXT,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    total_rewards INTEGER DEFAULT 0,
    threats_detected INTEGER DEFAULT 0,
    node_uptime REAL DEFAULT 0,
    total_nodes INTEGER DEFAULT 0,
    total_staked INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    achievements_unlocked INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    rank_position INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
}

// Prepared statements
const getUserStmt = db ? db.prepare('SELECT * FROM users WHERE wallet_address = ?') : null;
const upsertUserStmt = db ? db.prepare(`
  INSERT OR REPLACE INTO users (
    wallet_address, display_name, level, experience, total_rewards,
    threats_detected, node_uptime, total_nodes, total_staked,
    challenges_completed, achievements_unlocked, streak, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`) : null;

// Calculate real stats from node data
function calculateUserStats(nodes: NodeSnapshot[]) {
  const totalThreats = nodes.reduce((sum, node) => sum + (node.threatsDetected || 0), 0);
  const totalRewards = nodes.reduce((sum, node) => sum + (node.rewards || 0), 0);
  const avgUptime = nodes.length > 0 ? nodes.reduce((sum, node) => sum + (node.uptime || 0), 0) / nodes.length : 0;
  const totalStaked = nodes.reduce((sum, node) => sum + (node.stakingAmount || 0), 0);
  
  // Calculate level based on total rewards (every 1000 DAG = 1 level)
  const level = Math.floor(totalRewards / 1000) + 1;
  const experience = Math.floor(totalRewards * 10);
  
  // Calculate streak and challenges
  const streak = Math.min(Math.floor(avgUptime / 10), 30);
  const challengesCompleted = Math.floor(totalThreats / 100) + Math.floor(avgUptime / 20);
  const achievementsUnlocked = Math.floor(totalThreats / 50) + Math.floor(avgUptime / 25);
  
  return {
    level,
    experience,
    totalRewards: Math.floor(totalRewards),
    threatsDetected: totalThreats,
    nodeUptime: Math.round(avgUptime * 10) / 10,
    totalNodes: nodes.length,
    totalStaked: Math.floor(totalStaked),
    challengesCompleted,
    achievementsUnlocked,
    streak
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    // Return fallback data if database not available (static export)
    if (!db || !getUserStmt) {
      return NextResponse.json({
        success: true,
        userStats: {
          level: 1,
          experience: 0,
          nextLevelExp: 10000,
          totalRewards: 0,
          threatsDetected: 0,
          nodeUptime: 0,
          totalNodes: 0,
          totalStaked: 0,
          challengesCompleted: 0,
          achievementsUnlocked: 0,
          streak: 1,
          rankPosition: 1
        },
        challenges: [],
        leaderboard: []
      });
    }
    
    // Get user from database
    let user = getUserStmt.get(address);
    
    if (!user) {
      // Create new user if doesn't exist
      const defaultStats = {
        level: 1,
        experience: 0,
        totalRewards: 0,
        threatsDetected: 0,
        nodeUptime: 0,
        totalNodes: 0,
        totalStaked: 0,
        challengesCompleted: 0,
        achievementsUnlocked: 0,
        streak: 0
      };
      
      upsertUserStmt.run(
        address, null, defaultStats.level, defaultStats.experience, 
        defaultStats.totalRewards, defaultStats.threatsDetected, 
        defaultStats.nodeUptime, defaultStats.totalNodes, defaultStats.totalStaked,
        defaultStats.challengesCompleted, defaultStats.achievementsUnlocked, defaultStats.streak
      );
      
      user = getUserStmt.get(address);
    }
    
    return NextResponse.json({
      success: true,
      user: {
        walletAddress: user.wallet_address,
        displayName: user.display_name,
        level: user.level || 1,
        experience: user.experience || 0,
        nextLevelExp: (user.level || 1) * 10000,
        totalRewards: user.total_rewards || 0,
        threatsDetected: user.threats_detected || 0,
        nodeUptime: user.node_uptime || 0,
        totalNodes: user.total_nodes || 0,
        totalStaked: user.total_staked || 0,
        challengesCompleted: user.challenges_completed || 0,
        achievementsUnlocked: user.achievements_unlocked || 0,
        streak: user.streak || 0,
        rank: user.rank_position || 1,
        createdAt: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Error fetching user gamification data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const body: GamificationRequestBody = await request.json();
    const { nodes, displayName } = body;
    
    // Calculate real stats from nodes
    const stats = calculateUserStats(nodes || []);
    
    // Return fallback data if database not available (static export)
    if (!db || !upsertUserStmt || !getUserStmt) {
      return NextResponse.json({
        success: true,
        user: {
          walletAddress: address,
          displayName: displayName || null,
          level: stats.level,
          experience: stats.experience,
          nextLevelExp: stats.level * 10000,
          totalRewards: stats.totalRewards,
          threatsDetected: stats.threatsDetected,
          nodeUptime: stats.nodeUptime,
          totalNodes: stats.totalNodes,
          totalStaked: stats.totalStaked,
          challengesCompleted: stats.challengesCompleted,
          achievementsUnlocked: stats.achievementsUnlocked,
          streak: stats.streak,
          rankPosition: 1
        }
      });
    }
    
    // Update user in database
    upsertUserStmt.run(
      address, displayName, stats.level, stats.experience,
      stats.totalRewards, stats.threatsDetected, stats.nodeUptime,
      stats.totalNodes, stats.totalStaked, stats.challengesCompleted,
      stats.achievementsUnlocked, stats.streak
    );
    
    // Get updated user
    const user = getUserStmt.get(address);
    
    return NextResponse.json({
      success: true,
      user: {
        walletAddress: user.wallet_address,
        displayName: user.display_name,
        level: user.level || 1,
        experience: user.experience || 0,
        nextLevelExp: (user.level || 1) * 10000,
        totalRewards: user.total_rewards || 0,
        threatsDetected: user.threats_detected || 0,
        nodeUptime: user.node_uptime || 0,
        totalNodes: user.total_nodes || 0,
        totalStaked: user.total_staked || 0,
        challengesCompleted: user.challenges_completed || 0,
        achievementsUnlocked: user.achievements_unlocked || 0,
        streak: user.streak || 0,
        rank: user.rank_position || 1
      }
    });
    
  } catch (error) {
    console.error('Error updating user gamification data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}
