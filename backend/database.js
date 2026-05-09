const mysql = require('mysql2/promise');

// Conexão com o banco MySQL (PHPMyAdmin usa MySQL por baixo)
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',        // sua senha do PHPMyAdmin
  database: process.env.DB_NAME     || 'fatecode',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

// Testa a conexão ao iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado ao banco MySQL (fatecode)');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    process.exit(1);
  });

module.exports = pool;
