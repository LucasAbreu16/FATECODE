const db = require('../../database');

const GroupModel = {
  create({ id, name, subject, description, location, max_members, admin_id }) {
    // Cria o grupo e adiciona o admin como primeiro membro atomicamente
    const createGroup = db.prepare(`
      INSERT INTO groups (id, name, subject, description, location, max_members, admin_id)
      VALUES (@id, @name, @subject, @description, @location, @max_members, @admin_id)
    `);
    const addMember = db.prepare(`
      INSERT INTO group_members (group_id, user_id) VALUES (?, ?)
    `);

    const transaction = db.transaction(() => {
      createGroup.run({ id, name, subject, description, location, max_members, admin_id });
      addMember.run(id, admin_id);
    });

    transaction();
    return this.findById(id);
  },

  findById(id) {
    return db.prepare(`
      SELECT
        g.*,
        COUNT(gm.user_id)                AS member_count,
        u.name                           AS admin_name,
        (g.max_members - COUNT(gm.user_id)) AS available_slots
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN users u          ON g.admin_id = u.id
      WHERE g.id = ?
      GROUP BY g.id
    `).get(id);
  },

  search({ query = '', location = '', available = '' }) {
    let sql = `
      SELECT
        g.id, g.name, g.subject, g.description, g.location,
        g.max_members, g.admin_id, g.created_at,
        u.name  AS admin_name,
        COUNT(gm.user_id) AS member_count,
        (g.max_members - COUNT(gm.user_id)) AS available_slots
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN users u          ON g.admin_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      sql += ` AND (
        g.name        LIKE '%' || ? || '%' OR
        g.subject     LIKE '%' || ? || '%' OR
        g.description LIKE '%' || ? || '%'
      )`;
      params.push(query, query, query);
    }

    if (location === 'online' || location === 'presencial') {
      sql += ' AND g.location = ?';
      params.push(location);
    }

    sql += ' GROUP BY g.id';

    if (available === 'true') {
      sql += ' HAVING available_slots > 0';
    }

    sql += ' ORDER BY g.created_at DESC';

    return db.prepare(sql).all(...params);
  },

  addMember(groupId, userId) {
    return db.prepare(`
      INSERT INTO group_members (group_id, user_id) VALUES (?, ?)
    `).run(groupId, userId);
  },

  removeMember(groupId, userId) {
    return db.prepare(`
      DELETE FROM group_members WHERE group_id = ? AND user_id = ?
    `).run(groupId, userId);
  },

  isMember(groupId, userId) {
    return !!db.prepare(`
      SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?
    `).get(groupId, userId);
  },

  getMemberCount(groupId) {
    const row = db.prepare(`
      SELECT COUNT(*) AS count FROM group_members WHERE group_id = ?
    `).get(groupId);
    return row.count;
  },

  getUserGroups(userId) {
    return db.prepare(`
      SELECT
        g.*, u.name AS admin_name,
        COUNT(gm2.user_id) AS member_count,
        (g.max_members - COUNT(gm2.user_id)) AS available_slots
      FROM group_members gm
      JOIN groups g       ON g.id = gm.group_id
      LEFT JOIN group_members gm2 ON gm2.group_id = g.id
      LEFT JOIN users u   ON g.admin_id = u.id
      WHERE gm.user_id = ?
      GROUP BY g.id
      ORDER BY gm.joined_at DESC
    `).all(userId);
  },
};

module.exports = GroupModel;
