const GroupService = require('../services/groupService');

const GroupController = {
  async create(req, res) {
    try {
      const group = await GroupService.createGroup(req.body, req.user.id);
      res.status(201).json(group);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Retorna array direto — o frontend faz groups.map() sem wrapper
  async search(req, res) {
    try {
      const groups = await GroupService.searchGroups(req.query);
      res.json(groups); // [] quando vazio, array de grupos quando encontrar
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const group = await GroupService.getGroup(req.params.id);
      res.json(group);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async join(req, res) {
    try {
      const result = await GroupService.joinGroup(req.params.id, req.user.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async leave(req, res) {
    try {
      const result = await GroupService.leaveGroup(req.params.id, req.user.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Retorna array direto — o frontend faz groups.map() sem wrapper
  async myGroups(req, res) {
    try {
      const groups = await GroupService.getUserGroups(req.user.id);
      res.json(groups);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = GroupController;