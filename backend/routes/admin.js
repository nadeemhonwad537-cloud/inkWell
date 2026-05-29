const router = require('express').Router();
const pool   = require('../db/database');
const { auth, adminOnly } = require('../middleware/auth');

const SUPERADMIN_EMAIL = 'nadeemhonwad537@gmail.com';

router.use(auth, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
  try {
    const [[{ totalPosts }]]    = await pool.query('SELECT COUNT(*) AS totalPosts FROM posts');
    const [[{ published }]]     = await pool.query("SELECT COUNT(*) AS published FROM posts WHERE status='published'");
    const [[{ drafts }]]        = await pool.query("SELECT COUNT(*) AS drafts FROM posts WHERE status='draft'");
    const [[{ totalComments }]] = await pool.query('SELECT COUNT(*) AS totalComments FROM comments');
    const [[{ pending }]]       = await pool.query("SELECT COUNT(*) AS pending FROM comments WHERE status='pending'");
    const [[{ totalUsers }]]    = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalLikes }]]    = await pool.query('SELECT COUNT(*) AS totalLikes FROM likes');
    res.json({ totalPosts, published, drafts, totalComments, pending, totalUsers, totalLikes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/users
router.get('/users', async (_req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, bio, created_at FROM users WHERE email != ? ORDER BY created_at DESC',
      [SUPERADMIN_EMAIL]
    );
    res.json({ users });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/users/:id/role
// Admin can promote/demote any user — but cannot change superadmin's role
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['reader', 'writer', 'admin'].includes(role))
    return res.status(400).json({ error: 'Invalid role. Must be reader, writer, or admin' });
  try {
    // Check if target user is the superadmin
    const [rows] = await pool.query('SELECT email FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    if (rows[0].email === SUPERADMIN_EMAIL)
      return res.status(403).json({ error: 'Cannot change the role of the superadmin' });

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: `Role updated to ${role}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Cannot delete your own account' });
  try {
    const [rows] = await pool.query('SELECT email FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    if (rows[0].email === SUPERADMIN_EMAIL)
      return res.status(403).json({ error: 'Cannot delete the superadmin account' });

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/posts  (all posts including drafts)

module.exports = router;
