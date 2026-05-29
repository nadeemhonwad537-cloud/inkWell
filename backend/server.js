require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const autoSetup = require('./scripts/autoSetup');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads folder if missing
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ── MIDDLEWARE ────────────────────────────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://ink-well-one.vercel.app',
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // allow all origins in production for now
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── ROUTES ────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', db: 'mysql', time: new Date().toISOString() }));

// One-time admin setup — creates superadmin if not exists
app.get('/api/setup-admin', async (_req, res) => {
  try {
    const pool = require('./db/database');
    const bcrypt = require('bcryptjs');
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', ['nadeemhonwad537@gmail.com']);
    if (rows.length) {
      await pool.query("UPDATE users SET role = 'admin' WHERE email = ?", ['nadeemhonwad537@gmail.com']);
      return res.json({ message: 'Admin role updated' });
    }
    const hashed = bcrypt.hashSync('Nadeem@123', 12);
    await pool.query(
      "INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, 'admin', NOW())",
      ['Nadeem', 'nadeemhonwad537@gmail.com', hashed]
    );
    res.json({ message: 'Superadmin created! Email: nadeemhonwad537@gmail.com, Password: Nadeem@123' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`\n🖊  Inkwell API  →  http://localhost:${PORT}`);
  console.log(`   Database     →  MySQL (${process.env.DB_NAME})`);
  console.log(`   Health check →  http://localhost:${PORT}/api/health\n`);
  await autoSetup();
});
