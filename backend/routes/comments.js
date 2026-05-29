const router = require('express').Router();
const pool   = require('../db/database');
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// GET /api/comments?post_id=X
router.get('/', optionalAuth, async (req, res) => {
  const postId  = Number(req.query.post_id);
  if (!postId) return res.status(400).json({ error: 'post_id is required' });
  const isAdmin = req.user?.role === 'admin';
  try {
    const where = isAdmin ? 'WHERE post_id = ?' : "WHERE post_id = ? AND status = 'approved'";
    const [comments] = await pool.query(
      `SELECT * FROM comments ${where} ORDER BY created_at ASC`, [postId]
    );
    res.json({ comments });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/comments/all  (admin only)
router.get('/all', auth, adminOnly, async (_req, res) => {
  try {
    const [comments] = await pool.query(`
      SELECT c.*, p.title AS post_title
      FROM comments c
      LEFT JOIN posts p ON p.id = c.post_id
      ORDER BY c.created_at DESC
    `);
    res.json({ comments });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/comments
router.post('/', optionalAuth, async (req, res) => {
  const { post_id, body } = req.body;
  if (!post_id || !body?.trim()) return res.status(400).json({ error: 'post_id and body are required' });
  try {
    const [posts] = await pool.query("SELECT id FROM posts WHERE id = ? AND status = 'published'", [post_id]);
    if (!posts.length) return res.status(404).json({ error: 'Post not found' });

    const authorId   = req.user?.id   || null;
    const authorName = req.user?.name || (req.body.author_name || 'Anonymous');

    const [result] = await pool.query(
      'INSERT INTO comments (post_id, author_id, author_name, body, status) VALUES (?,?,?,?,?)',
      [post_id, authorId, authorName, body.trim(), 'approved']
    );
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [result.insertId]);
    res.status(201).json({ comment: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/comments/:id/status  (admin moderation)
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'pending', 'rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  try {
    await pool.query('UPDATE comments SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Comment updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/comments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Comment not found' });

    const isOwner = req.user.role === 'admin' || req.user.id === rows[0].author_id;
    if (!isOwner) return res.status(403).json({ error: 'Not authorized' });

    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
