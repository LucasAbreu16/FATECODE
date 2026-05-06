const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const UserModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'connexa_secret_dev_2024';
const FRONTEND_URL = process.env.FRONTEND_URL || '[localhost](http://localhost:3000)';

// Transporter de e-mail — em dev usa Ethereal (fake SMTP)
async function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Fallback: Ethereal (imprime link no console)
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

async function sendVerificationEmail(email, name, token) {
  const transporter = await createTransporter();
  const verifyUrl = `${FRONTEND_URL}/verify.html?token=${token}`;

  const info = await transporter.sendMail({
    from: '"Connexa" <noreply@connexa.app>',
    to: email,
    subject: 'Confirme seu e-mail — Connexa',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#4f46e5">Bem-vindo à Connexa, ${name}! 🎓</h2>
        <p>Clique no botão abaixo para confirmar seu e-mail e ativar sua conta:</p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 28px;background:#4f46e5;
                  color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Confirmar e-mail
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px">
          Se não criou uma conta, ignore este e-mail.
        </p>
      </div>
    `,
  });

  // Em dev, exibe a URL de preview no console
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`📧 Preview do e-mail: ${preview}`);
}

const AuthService = {
  async register({ name, email, password, university, course }) {
    if (UserModel.findByEmail(email)) {
      throw new Error('E-mail já cadastrado.');
    }

    const hashed = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const verify_token = uuidv4();

    UserModel.create({ id, name, email, password: hashed, university, course, verify_token });
    await sendVerificationEmail(email, name, verify_token);

    return { message: 'Cadastro realizado! Verifique seu e-mail para ativar a conta.' };
  },

  async login({ email, password }) {
    const user = UserModel.findByEmail(email);
    if (!user) throw new Error('Credenciais inválidas.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Credenciais inválidas.');

    if (!user.verified) throw new Error('Confirme seu e-mail antes de fazer login.');

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, university: user.university, course: user.course },
    };
  },

  verifyEmail(token) {
    const user = UserModel.findByVerifyToken(token);
    if (!user) throw new Error('Token inválido ou já utilizado.');
    UserModel.verify(user.id);
    return { message: 'E-mail confirmado! Você já pode fazer login.' };
  },

  verifyJWT(token) {
    return jwt.verify(token, JWT_SECRET);
  },
};

module.exports = AuthService;
