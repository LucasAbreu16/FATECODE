const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'connexa.db'));

// Habilita WAL para melhor performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      university  TEXT,
      course      TEXT,
      verified    INTEGER NOT NULL DEFAULT 0,
      verify_token TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS groups (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      subject      TEXT NOT NULL,
      description  TEXT NOT NULL,
      location     TEXT NOT NULL CHECK(location IN ('online', 'presencial')),
      max_members  INTEGER NOT NULL DEFAULT 10,
      admin_id     TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      joined_at  TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
    );
  `);

  console.log('✅ Banco de dados inicializado.');
}

initializeDatabase();

module.exports = db;
