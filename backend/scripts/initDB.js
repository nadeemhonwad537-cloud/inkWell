// scripts/initDB.js
// Run once:  node scripts/initDB.js
// Creates all tables in your MySQL database

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function init() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('Connected to MySQL...');

  // Create database if not exists
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'inkwell_db'}\``);
  await conn.query(`USE \`${process.env.DB_NAME || 'inkwell_db'}\``);
  console.log(`✅  Database "${process.env.DB_NAME || 'inkwell_db'}" ready`);

  // ── USERS ────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(100)  NOT NULL,
      email      VARCHAR(150)  NOT NULL UNIQUE,
      password   VARCHAR(255)  NOT NULL,
      role       ENUM('reader','writer','admin') NOT NULL DEFAULT 'reader',
      bio        VARCHAR(500)  DEFAULT '',
      created_at DATETIME      DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅  Table: users');

  // ── POSTS ────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      title       VARCHAR(300)  NOT NULL,
      excerpt     VARCHAR(500)  DEFAULT '',
      body        LONGTEXT      NOT NULL,
      category    VARCHAR(80)   DEFAULT 'Essay',
      status      ENUM('draft','published') NOT NULL DEFAULT 'draft',
      cover_image VARCHAR(500)  DEFAULT NULL,
      author_id   INT           NOT NULL,
      created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅  Table: posts');

  // ── COMMENTS ─────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      post_id     INT           NOT NULL,
      author_id   INT           DEFAULT NULL,
      author_name VARCHAR(100)  DEFAULT 'Anonymous',
      body        VARCHAR(500)  NOT NULL,
      status      ENUM('approved','pending','rejected') NOT NULL DEFAULT 'approved',
      created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id)   REFERENCES posts(id)   ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)   ON DELETE SET NULL
    )
  `);
  console.log('✅  Table: comments');

  // ── LIKES ────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS likes (
      id      INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      UNIQUE KEY unique_like (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅  Table: likes');

  await conn.end();
  console.log('\n🎉  All tables created! Now run:  node scripts/createAdmin.js\n');
}

init().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
