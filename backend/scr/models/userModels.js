const db = require('../../database');

const UserModel = {
  create({ id, name, email, password, university, course, verify_token }) {
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password, university, course, verify_token)
      VALUES (@id, @name, @email, @password, @university, @course, @verify_token)
    `);
    return stmt.run({ id, name, email, password, university, course, verify_token });
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findById(id) {
    return db.prepare('SELECT id, name, email, university, course, verified FROM users WHERE id = ?').get(id);
  },

  findByVerifyToken(token) {
    return db.prepare('SELECT * FROM users WHERE verify_token = ?').get(token);
  },

  verify(id) {
    return db.prepare(
      'UPDATE users SET verified = 1, verify_token = NULL WHERE id = ?'
    ).run(id);
  },
};

module.exports = UserModel;
