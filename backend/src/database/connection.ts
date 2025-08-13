import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

// Enable verbose mode for debugging
const sqlite = sqlite3.verbose();

let db: sqlite3.Database;

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create database file in the backend directory
    const dbPath = path.join(__dirname, '../../data/cryptoscore.db');
    
    db = new sqlite.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Create tables
      createTables()
        .then(() => resolve())
        .catch(reject);
    });
  });
}

async function createTables(): Promise<void> {
  const runAsync = promisify(db.run.bind(db));
  
  try {
    // Create credit_scores table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS credit_scores (
        address TEXT PRIMARY KEY,
        score INTEGER NOT NULL,
        breakdown TEXT NOT NULL,
        last_updated INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
    
    // Create score_history table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS score_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        score INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);
    
    // Create index for better query performance
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_score_history_address 
      ON score_history(address)
    `);
    
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_score_history_timestamp 
      ON score_history(timestamp)
    `);
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connection...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connection...');
  await closeDatabase();
  process.exit(0);
});