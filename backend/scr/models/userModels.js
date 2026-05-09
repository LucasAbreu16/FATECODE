const pool = require('../../database');

const UserModel = {
  async create({ id, name, email, password, university, course }) {
    await pool.execute(
      `INSERT INTO users (id, name, email, password, university, course)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, email, password, university || null, course || null]
    );
  },

  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, university, course FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = UserModel;