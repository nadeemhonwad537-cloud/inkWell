// Auto-runs on first deploy to create all tables
const pool = require('../db/database');

async function autoSetup() {
  try {
    // disable strict mode for this session to handle older MySQL compatibility
    await pool.query(`SET SESSION sql_mode = ''`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100)  NOT NULL,
        email      VARCHAR(150)  NOT NULL UNIQUE,
        password   VARCHAR(255)  NOT NULL,
        role       ENUM('reader','writer','admin') NOT NULL DEFAULT 'reader',
        bio        VARCHAR(500)  DEFAULT '',
        avatar     VARCHAR(500)  DEFAULT NULL,
        created_at TIMESTAMP     NULL DEFAULT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(300)  NOT NULL,
        excerpt     VARCHAR(500)  DEFAULT '',
        body        LONGTEXT      NOT NULL,
        category    VARCHAR(80)   DEFAULT 'Essay',
        status      ENUM('draft','published') NOT NULL DEFAULT 'draft',
        cover_image VARCHAR(500)  DEFAULT NULL,
        author_id   INT           NOT NULL,
        created_at  TIMESTAMP     NULL DEFAULT NULL,
        updated_at  TIMESTAMP     NULL DEFAULT NULL,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        post_id     INT           NOT NULL,
        author_id   INT           DEFAULT NULL,
        author_name VARCHAR(100)  DEFAULT 'Anonymous',
        body        VARCHAR(500)  NOT NULL,
        status      ENUM('approved','pending','rejected') NOT NULL DEFAULT 'approved',
        created_at  TIMESTAMP     NULL DEFAULT NULL,
        FOREIGN KEY (post_id)   REFERENCES posts(id)   ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id)   ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id      INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        UNIQUE KEY unique_like (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        email      VARCHAR(150) NOT NULL,
        code       VARCHAR(6)   NOT NULL,
        purpose    VARCHAR(30)  NOT NULL DEFAULT 'reset_password',
        expires_at DATETIME     NOT NULL,
        used       TINYINT(1)   NOT NULL DEFAULT 0,
        created_at TIMESTAMP    NULL DEFAULT NULL
      )
    `);

    console.log('✅  All tables ready');
  } catch (err) {
    console.error('❌  Auto setup error:', err.message);
  }
}

module.exports = autoSetup;
