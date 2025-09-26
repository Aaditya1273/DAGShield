import { NextRequest, NextResponse } from 'next/server';

const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbPath = path.join(process.cwd(), 'dagshield.db');
const db = new Database(dbPath);

// Prepared statements
const getLeaderboardStmt = db.prepare(`
  SELECT 
    wallet_address,
    display_name,
    level,
    total_rewards as score,
    created_at,
    ROW_NUMBER() OVER (ORDER BY total_rewards DESC, created_at ASC) as rank
  FROM users
  WHERE total_rewards > 0 OR total_nodes > 0
  ORDER BY total_rewards DESC, created_at ASC
  LIMIT 100
`);

const updateRankStmt = db.prepare(`
  UPDATE users SET rank_position = ? WHERE wallet_address = ?
`);

export async function GET(request: NextRequest) {
  try {
    // Get leaderboard data
    const leaderboard = getLeaderboardStmt.all();
    
    // Update rank positions in database
    leaderboard.forEach((user: any, index: number) => {
      updateRankStmt.run(index + 1, user.wallet_address);
    });
    
    // Format leaderboard data
    const formattedLeaderboard = leaderboard.map((user: any) => ({
      rank: user.rank,
      user: user.display_name || `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`,
      walletAddress: user.wallet_address,
      score: user.score,
      level: user.level,
      createdAt: user.created_at
    }));
    
    return NextResponse.json({
      success: true,
      leaderboard: formattedLeaderboard
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;
    
    // Recalculate ranks for all users
    const allUsers = db.prepare(`
      SELECT wallet_address, total_rewards, created_at
      FROM users
      ORDER BY total_rewards DESC, created_at ASC
    `).all();
    
    // Update ranks
    allUsers.forEach((user: any, index: number) => {
      updateRankStmt.run(index + 1, user.wallet_address);
    });
    
    // Get user's current rank
    const userRank = db.prepare(`
      SELECT rank_position FROM users WHERE wallet_address = ?
    `).get(walletAddress);
    
    return NextResponse.json({
      success: true,
      userRank: userRank?.rank_position || null
    });
    
  } catch (error) {
    console.error('Error updating ranks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ranks' },
      { status: 500 }
    );
  }
}
