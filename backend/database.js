
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      university TEXT,
      course TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      max_members INTEGER NOT NULL,
      admin_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (group_id, user_id)
    )
  `);
});

function execute(query, params = []) {
  return new Promise((resolve, reject) => {
    const normalized = query
      .replace(/`/g, '')
      .replace(/CONCAT\('%', \?, '%'\)/g, "'%' || ? || '%'");

    const isSelect = normalized.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
      db.all(normalized, params, (err, rows) => {
        if (err) reject(err);
        else resolve([rows]);
      });
    } else {
      db.run(normalized, params, function(err) {
        if (err) reject(err);
        else resolve([{ affectedRows: this.changes, insertId: this.lastID }]);
      });
    }
  });
}

module.exports = {
  execute
};
