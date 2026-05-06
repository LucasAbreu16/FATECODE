const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve o frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rotas da API
app.use('/api/auth',   require('./src/routes/authRoutes'));
app.use('/api/groups', require('./src/routes/groupRoutes'));

// Fallback: qualquer rota não-API devolve o index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Connexa rodando em http://localhost:${PORT}`);
});
