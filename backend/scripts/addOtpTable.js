// Run once: node scripts/addOtpTable.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inkwell_db',
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS otps (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      email      VARCHAR(150) NOT NULL,
      code       VARCHAR(6)   NOT NULL,
      purpose    VARCHAR(30)  NOT NULL DEFAULT 'reset_password',
      expires_at DATETIME     NOT NULL,
      used       TINYINT(1)   NOT NULL DEFAULT 0,
      created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅  otps table ready');
  await conn.end();
}

run().catch(err => { console.error(err.message); process.exit(1); });
