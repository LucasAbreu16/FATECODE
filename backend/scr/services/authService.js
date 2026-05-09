const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const UserModel      = require('../models/userModels');

const JWT_SECRET = process.env.JWT_SECRET || 'connexa_secret_dev_2024';

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return typeof email === 'string' && regex.test(email.trim());
}

const AuthService = {
  async register({ name, email, password, university, course }) {
    if (!email || !isValidEmail(email)) {
      throw new Error('E-mail inválido. Informe um endereço no formato correto (ex: usuario@dominio.com).');
    }
    if (!name || !name.trim()) {
      throw new Error('O nome é obrigatório.');
    }
    if (!password || password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }

    const existing = await UserModel.findByEmail(email.trim().toLowerCase());
    if (existing) throw new Error('E-mail já cadastrado.');

    const hashed = await bcrypt.hash(password, 12);

    await UserModel.create({
      id:       uuidv4(),
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      password: hashed,
      university,
      course,
    });

    return { message: 'Cadastro realizado com sucesso! Você já pode fazer login.' };
  },

  async login({ email, password }) {
    if (!email || !isValidEmail(email)) {
      throw new Error('E-mail inválido.');
    }

    const user = await UserModel.findByEmail(email.trim().toLowerCase());
    if (!user) throw new Error('Credenciais inválidas.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Credenciais inválidas.');

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        university: user.university,
        course:     user.course,
      },
    };
  },

  verifyJWT(token) {
    return jwt.verify(token, JWT_SECRET);
  },
};

module.exports = AuthService;