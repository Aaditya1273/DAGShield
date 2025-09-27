import Database from 'better-sqlite3';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

// Required for static export
export const dynamic = 'force-static';
export const revalidate = false;

interface LeaderboardRow {
  wallet_address: string;
  display_name: string | null;
  level: number | null;
  score: number | null;
  created_at: string | null;
  rank: number;
}

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

export async function GET(): Promise<NextResponse> {
  try {
    // Get leaderboard data
    const leaderboard = getLeaderboardStmt.all() as LeaderboardRow[];

    // Update rank positions in database
    leaderboard.forEach((user, index) => {
      updateRankStmt.run(index + 1, user.wallet_address);
    });

    // Format leaderboard data
    const formattedLeaderboard = leaderboard.map((user) => ({
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    // Recalculate ranks for all users
    const allUsers = db.prepare(`
      SELECT wallet_address, total_rewards, created_at
      FROM users
      ORDER BY total_rewards DESC, created_at ASC
    `).all() as { wallet_address: string }[];

    // Update ranks
    allUsers.forEach((user, index) => {
      updateRankStmt.run(index + 1, user.wallet_address);
    });

    // Get user's current rank
    const userRank = db.prepare(`
      SELECT rank_position FROM users WHERE wallet_address = ?
    `).get(walletAddress) as { rank_position: number } | undefined;

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
