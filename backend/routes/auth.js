const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../db/database');
const { auth, JWT_SECRET } = require('../middleware/auth');
const { sendOTP } = require('../utils/mailer');

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/signup  — creates a READER account only. Never admin.
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const hashed = bcrypt.hashSync(password, 12);
    // role is hardcoded to 'reader' — can never be changed via this route
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, 'reader']
    );

    const [rows] = await pool.query(
      'SELECT id, name, email, role, bio, avatar, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    const token = jwt.sign({ id: rows[0].id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: rows[0], token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length || !bcrypt.compareSync(password, rows[0].password))
      return res.status(401).json({ error: 'Invalid email or password' });

    const { password: _, ...safe } = rows[0];
    const token = jwt.sign({ id: safe.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: safe, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/me  — update own name/bio/avatar
router.put('/me', auth, async (req, res) => {
  const { name, bio, avatar } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?',
      [name, bio, avatar || null, req.user.id]
    );
    const [rows] = await pool.query(
      'SELECT id, name, email, role, bio, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — public profile
router.get('/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, bio, avatar, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const [posts] = await pool.query(`
      SELECT p.id, p.title, p.excerpt, p.category, p.cover_image, p.created_at,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'approved') AS comments
      FROM posts p
      WHERE p.author_id = ? AND p.status = 'published'
      ORDER BY p.created_at DESC
    `, [req.params.id]);

    res.json({ user: rows[0], posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me/posts — get all posts by the logged-in user
router.get('/me/posts', auth, async (req, res) => {  try {
    const [posts] = await pool.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM likes    l WHERE l.post_id = p.id) AS likes,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'approved') AS comments
      FROM posts p
      WHERE p.author_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/me/username — change username (requires current password)
router.put('/me/username', auth, async (req, res) => {
  const { newName, currentPassword } = req.body;
  if (!newName || !currentPassword)
    return res.status(400).json({ error: 'New name and current password are required' });

  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length || !bcrypt.compareSync(currentPassword, rows[0].password))
      return res.status(401).json({ error: 'Current password is incorrect' });

    await pool.query('UPDATE users SET name = ? WHERE id = ?', [newName.trim(), req.user.id]);
    const [updated] = await pool.query(
      'SELECT id, name, email, role, bio, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ user: updated[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/me/password — change password (requires current password)
router.put('/me/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Current and new password are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });

  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length || !bcrypt.compareSync(currentPassword, rows[0].password))
      return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = bcrypt.hashSync(newPassword, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/otp/send — send OTP to email (forgot password flow)
router.post('/otp/send', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(404).json({ error: 'No account found with this email' });

    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    const expiresUTC = expires.toISOString().slice(0, 19).replace('T', ' ');

    // invalidate old OTPs for this email
    await pool.query("UPDATE otps SET used = 1 WHERE email = ? AND purpose = 'reset_password'", [email]);

    await pool.query(
      "INSERT INTO otps (email, code, purpose, expires_at) VALUES (?, ?, 'reset_password', ?)",
      [email, code, expiresUTC]
    );

    await sendOTP(email, code);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/otp/verify — verify OTP and reset password
router.post('/otp/verify', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword)
    return res.status(400).json({ error: 'Email, OTP code and new password are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });

  try {
    const [rows] = await pool.query(
      "SELECT * FROM otps WHERE email = ? AND code = ? AND purpose = 'reset_password' AND used = 0 AND expires_at > UTC_TIMESTAMP() ORDER BY id DESC LIMIT 1",
      [email, code]
    );

    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });

    // mark OTP as used
    await pool.query('UPDATE otps SET used = 1 WHERE id = ?', [rows[0].id]);

    const hashed = bcrypt.hashSync(newPassword, 12);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);

    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
