const GroupService = require('../services/groupService');

const GroupController = {
  create(req, res) {
    try {
      const group = GroupService.createGroup(req.body, req.user.id);
      res.status(201).json(group);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  search(req, res) {
    try {
      const groups = GroupService.searchGroups(req.query);
      res.json(groups);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getOne(req, res) {
    try {
      const group = GroupService.getGroup(req.params.id);
      // Indica se o usuário autenticado é membro
      const { GroupModel } = require('../models/groupModel');
      res.json(group);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  join(req, res) {
    try {
      const result = GroupService.joinGroup(req.params.id, req.user.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  leave(req, res) {
    try {
      const result = GroupService.leaveGroup(req.params.id, req.user.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  myGroups(req, res) {
    try {
      const groups = GroupService.getUserGroups(req.user.id);
      res.json(groups);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = GroupController;
