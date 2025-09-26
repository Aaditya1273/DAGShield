import { NextRequest, NextResponse } from 'next/server';

const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbPath = path.join(process.cwd(), 'dagshield.db');
const db = new Database(dbPath);

// Initialize challenges table
db.exec(`
  CREATE TABLE IF NOT EXISTS user_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT,
    challenge_id TEXT,
    challenge_name TEXT,
    progress INTEGER DEFAULT 0,
    target INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    reward INTEGER DEFAULT 0,
    challenge_type TEXT DEFAULT 'weekly',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_address, challenge_id)
  )
`);

// Generate real challenges based on user's node data
function generateRealChallenges(nodes: any[], userStats: any) {
  const totalThreats = nodes.reduce((sum, node) => sum + (node.threatsDetected || 0), 0);
  const avgUptime = nodes.length > 0 ? nodes.reduce((sum, node) => sum + (node.uptime || 0), 0) / nodes.length : 0;
  const totalTransactions = nodes.reduce((sum, node) => sum + (node.validatedTransactions || 0), 0);
  
  return [
    {
      id: 'threat_hunter_weekly',
      name: 'Threat Hunter',
      description: 'Detect 50 threats this week',
      progress: Math.min(totalThreats, 50),
      target: 50,
      reward: 500,
      timeLeft: '2 days',
      type: 'weekly',
      completed: totalThreats >= 50
    },
    {
      id: 'perfect_uptime_weekly',
      name: 'Perfect Uptime',
      description: 'Maintain 99%+ uptime for 7 days',
      progress: avgUptime >= 99 ? 7 : Math.floor(avgUptime / 14.3), // Simulate days
      target: 7,
      reward: 750,
      timeLeft: '2 days',
      type: 'weekly',
      completed: avgUptime >= 99
    },
    {
      id: 'transaction_validator',
      name: 'Transaction Validator',
      description: 'Validate 1000 transactions',
      progress: Math.min(totalTransactions, 1000),
      target: 1000,
      reward: 300,
      timeLeft: '5 days',
      type: 'weekly',
      completed: totalTransactions >= 1000
    },
    {
      id: 'node_master_monthly',
      name: 'Node Master',
      description: 'Deploy and maintain 5 nodes',
      progress: Math.min(nodes.length, 5),
      target: 5,
      reward: 2000,
      timeLeft: '15 days',
      type: 'monthly',
      completed: nodes.length >= 5
    },
    {
      id: 'threat_sentinel_monthly',
      name: 'Threat Sentinel',
      description: 'Detect 500 threats this month',
      progress: Math.min(totalThreats, 500),
      target: 500,
      reward: 1500,
      timeLeft: '20 days',
      type: 'monthly',
      completed: totalThreats >= 500
    }
  ];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    // Get user's stored challenges
    const storedChallenges = db.prepare(`
      SELECT * FROM user_challenges WHERE wallet_address = ?
    `).all(address);
    
    return NextResponse.json({
      success: true,
      challenges: storedChallenges
    });
    
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch challenges' },
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
    const body = await request.json();
    const { nodes, userStats } = body;
    
    // Generate real challenges based on current node data
    const realChallenges = generateRealChallenges(nodes || [], userStats || {});
    
    // Update challenges in database
    const upsertChallengeStmt = db.prepare(`
      INSERT OR REPLACE INTO user_challenges (
        wallet_address, challenge_id, challenge_name, progress, target, 
        completed, reward, challenge_type, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    realChallenges.forEach(challenge => {
      upsertChallengeStmt.run(
        address,
        challenge.id,
        challenge.name,
        challenge.progress,
        challenge.target,
        challenge.completed ? 1 : 0, // Convert boolean to integer
        challenge.reward,
        challenge.type
      );
    });
    
    // Get updated challenges
    const updatedChallenges = db.prepare(`
      SELECT * FROM user_challenges WHERE wallet_address = ?
    `).all(address);
    
    // Format for frontend
    const formattedChallenges = updatedChallenges.map((challenge: any) => ({
      id: challenge.challenge_id,
      name: challenge.challenge_name,
      description: getDescriptionForChallenge(challenge.challenge_id),
      progress: challenge.progress || 0,
      target: challenge.target || 1,
      reward: challenge.reward || 0,
      timeLeft: getTimeLeftForChallenge(challenge.challenge_type),
      type: challenge.challenge_type || 'weekly',
      completed: challenge.completed === 1 // Convert integer back to boolean
    }));
    
    return NextResponse.json({
      success: true,
      challenges: formattedChallenges
    });
    
  } catch (error) {
    console.error('Error updating challenges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update challenges' },
      { status: 500 }
    );
  }
}

function getDescriptionForChallenge(challengeId: string): string {
  const descriptions: { [key: string]: string } = {
    'threat_hunter_weekly': 'Detect 50 threats this week',
    'perfect_uptime_weekly': 'Maintain 99%+ uptime for 7 days',
    'transaction_validator': 'Validate 1000 transactions',
    'node_master_monthly': 'Deploy and maintain 5 nodes',
    'threat_sentinel_monthly': 'Detect 500 threats this month'
  };
  return descriptions[challengeId] || 'Complete this challenge';
}

function getTimeLeftForChallenge(type: string): string {
  if (type === 'weekly') {
    return Math.floor(Math.random() * 6) + 1 + ' days';
  } else if (type === 'monthly') {
    return Math.floor(Math.random() * 25) + 5 + ' days';
  }
  return '7 days';
}
