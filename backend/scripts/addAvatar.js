// Run once: node scripts/addAvatar.js
// Adds avatar column to users table if it doesn't exist

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

  try {
    // Check if column already exists
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar'
    `, [process.env.DB_NAME || 'inkwell_db']);

    if (cols.length === 0) {
      await conn.query(`ALTER TABLE users ADD COLUMN avatar VARCHAR(500) DEFAULT NULL`);
      console.log('✅  avatar column added to users table');
    } else {
      console.log('ℹ️  avatar column already exists');
    }
  } catch (err) {
    throw err;
  }

  await conn.end();
  console.log('Done!');
}

run().catch(err => { console.error(err.message); process.exit(1); });
