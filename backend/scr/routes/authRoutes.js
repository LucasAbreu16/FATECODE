const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { requireAuth } = require('./middleware');

router.post('/register', AuthController.register);
router.post('/login',    AuthController.login);
router.get('/verify/:token', AuthController.verifyEmail);
router.get('/me', requireAuth, AuthController.getMe);

module.exports = router;
