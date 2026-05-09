const pool = require('../../database');

// Query base que retorna grupos com contagem de membros
const BASE_SELECT = `
  SELECT
    g.id, g.name, g.subject, g.description, g.location,
    g.max_members, g.admin_id, g.created_at,
    u.name                        AS admin_name,
    COUNT(gm.user_id)             AS member_count,
    (g.max_members - COUNT(gm.user_id)) AS available_slots
  FROM \`groups\` g
  LEFT JOIN group_members gm ON g.id = gm.group_id
  LEFT JOIN users u          ON g.admin_id = u.id
`;

const GroupModel = {
  // Cria grupo e adiciona o admin como primeiro membro (transação)
  async create({ id, name, subject, description, location, max_members, admin_id }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `INSERT INTO \`groups\` (id, name, subject, description, location, max_members, admin_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, subject, description, location, max_members, admin_id]
      );

      await conn.execute(
        'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
        [id, admin_id]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `${BASE_SELECT}
       WHERE g.id = ?
       GROUP BY g.id, g.name, g.subject, g.description,
                g.location, g.max_members, g.admin_id, g.created_at, u.name`,
      [id]
    );
    return rows[0] || null;
  },

  // Busca grupos com filtros opcionais: query (texto), location, available (vagas)
  async search({ query = '', location = '', available = '' }) {
    let sql = `
      ${BASE_SELECT}
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      sql += ` AND (
        g.name        LIKE CONCAT('%', ?, '%') OR
        g.subject     LIKE CONCAT('%', ?, '%') OR
        g.description LIKE CONCAT('%', ?, '%')
      )`;
      params.push(query, query, query);
    }

    if (location === 'online' || location === 'presencial') {
      sql += ' AND g.location = ?';
      params.push(location);
    }

    sql += `
      GROUP BY g.id, g.name, g.subject, g.description,
               g.location, g.max_members, g.admin_id, g.created_at, u.name
    `;

    // Filtra somente grupos com vagas disponíveis
    if (available === 'true') {
      sql += ' HAVING available_slots > 0';
    }

    sql += ' ORDER BY g.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async addMember(groupId, userId) {
    await pool.execute(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, userId]
    );
  },

  // Remove o usuário do grupo e retorna quantas linhas foram afetadas
  async removeMember(groupId, userId) {
    const [result] = await pool.execute(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return result.affectedRows; // 1 = removido, 0 = não era membro
  },

  async isMember(groupId, userId) {
    const [rows] = await pool.execute(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return rows.length > 0;
  },

  async getMemberCount(groupId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM group_members WHERE group_id = ?',
      [groupId]
    );
    return rows[0].count;
  },

  async getUserGroups(userId) {
    const [rows] = await pool.execute(
      `SELECT
         g.id, g.name, g.subject, g.description, g.location,
         g.max_members, g.admin_id, g.created_at,
         u.name AS admin_name,
         COUNT(gm2.user_id) AS member_count,
         (g.max_members - COUNT(gm2.user_id)) AS available_slots
       FROM group_members gm
       JOIN \`groups\` g        ON g.id  = gm.group_id
       LEFT JOIN group_members gm2 ON gm2.group_id = g.id
       LEFT JOIN users u        ON g.admin_id = u.id
       WHERE gm.user_id = ?
       GROUP BY g.id, g.name, g.subject, g.description,
                g.location, g.max_members, g.admin_id, g.created_at, u.name
       ORDER BY gm.joined_at DESC`,
      [userId]
    );
    return rows;
  },
};

module.exports = GroupModel;
