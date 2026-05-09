const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    ssl: {
        rejectUnauthorized: false
    }
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
