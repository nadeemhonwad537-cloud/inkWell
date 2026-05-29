const jwt  = require('jsonwebtoken');
const pool = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'inkwell-secret-key-change-in-production';

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    const [rows]  = await pool.query(
      'SELECT id, name, email, role, bio, avatar, created_at FROM users WHERE id = ?',
      [decoded.id]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), JWT_SECRET);
      const [rows]  = await pool.query(
        'SELECT id, name, email, role, bio, avatar FROM users WHERE id = ?',
        [decoded.id]
      );
      if (rows.length) req.user = rows[0];
    } catch {}
  }
  next();
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = { auth, optionalAuth, adminOnly, JWT_SECRET };
