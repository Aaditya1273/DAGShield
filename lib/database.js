import Database from 'better-sqlite3';
import path from 'path';

// Create or connect to SQLite database
const dbPath = path.join(process.cwd(), 'dagshield.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database tables
function initializeDatabase() {
  // Users table for storing user profiles and stats
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

  // Challenges table for storing challenge progress
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wallet_address) REFERENCES users (wallet_address)
    )
  `);

  // Achievements table for tracking unlocked achievements
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT,
      achievement_id TEXT,
      achievement_name TEXT,
      unlocked BOOLEAN DEFAULT FALSE,
      reward INTEGER DEFAULT 0,
      unlocked_at DATETIME,
      FOREIGN KEY (wallet_address) REFERENCES users (wallet_address)
    )
  `);

  // Leaderboard view for ranking users
  db.exec(`
    CREATE VIEW IF NOT EXISTS leaderboard AS
    SELECT 
      wallet_address,
      display_name,
      level,
      total_rewards as score,
      rank_position,
      ROW_NUMBER() OVER (ORDER BY total_rewards DESC, created_at ASC) as current_rank
    FROM users
    ORDER BY total_rewards DESC, created_at ASC
  `);

  console.log('Database initialized successfully');
}

// User operations
const userOperations = {
  // Create or update user
  upsertUser: db.prepare(`
    INSERT OR REPLACE INTO users (
      wallet_address, display_name, level, experience, total_rewards,
      threats_detected, node_uptime, total_nodes, total_staked,
      challenges_completed, achievements_unlocked, streak, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `),

  // Get user by wallet address
  getUserByAddress: db.prepare(`
    SELECT * FROM users WHERE wallet_address = ?
  `),

  // Get all users for leaderboard
  getLeaderboard: db.prepare(`
    SELECT * FROM leaderboard LIMIT 100
  `),

  // Update user rank positions
  updateRanks: db.prepare(`
    UPDATE users SET rank_position = ? WHERE wallet_address = ?
  `)
};

// Challenge operations
const challengeOperations = {
  // Get user challenges
  getUserChallenges: db.prepare(`
    SELECT * FROM user_challenges WHERE wallet_address = ?
  `),

  // Update challenge progress
  updateChallengeProgress: db.prepare(`
    INSERT OR REPLACE INTO user_challenges (
      wallet_address, challenge_id, challenge_name, progress, target, completed, reward, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `),

  // Complete challenge
  completeChallenge: db.prepare(`
    UPDATE user_challenges SET completed = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE wallet_address = ? AND challenge_id = ?
  `)
};

// Achievement operations
const achievementOperations = {
  // Get user achievements
  getUserAchievements: db.prepare(`
    SELECT * FROM user_achievements WHERE wallet_address = ?
  `),

  // Unlock achievement
  unlockAchievement: db.prepare(`
    INSERT OR REPLACE INTO user_achievements (
      wallet_address, achievement_id, achievement_name, unlocked, reward, unlocked_at
    ) VALUES (?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP)
  `)
};

// Initialize database on module load
initializeDatabase();

export {
  db,
  userOperations,
  challengeOperations,
  achievementOperations,
  initializeDatabase
};
