const AuthService = require('../services/authService');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação necessário.' });
  }
  try {
    req.user = AuthService.verifyJWT(header.split(' ')[1]);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

module.exports = { requireAuth };
