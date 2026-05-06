const AuthService = require('../services/authService');

const AuthController = {
  async register(req, res) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      const result = await AuthService.login(req.body);
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  },

  verifyEmail(req, res) {
    try {
      const result = AuthService.verifyEmail(req.params.token);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  getMe(req, res) {
    res.json({ user: req.user });
  },
};

module.exports = AuthController;
