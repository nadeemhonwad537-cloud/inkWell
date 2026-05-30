const router = require('express').Router();
const pool   = require('../db/database');
const { auth, optionalAuth } = require('../middleware/auth');

// GET /api/posts — all published posts visible to everyone
router.get('/', optionalAuth, async (req, res) => {
  const { search, category, page = 1, limit = 12 } = req.query;
  const isAdmin = req.user?.role === 'admin';
  const offset  = (Number(page) - 1) * Number(limit);

  try {
    let where  = isAdmin ? 'WHERE 1=1' : "WHERE p.status = 'published'";
    const vals = [];

    if (category && category !== 'All') {
      where += ' AND p.category = ?'; vals.push(category);
    }
    if (search) {
      where += ' AND (p.title LIKE ? OR p.excerpt LIKE ? OR p.body LIKE ?)';
      const like = `%${search}%`;
      vals.push(like, like, like);
    }

    const countSQL = `SELECT COUNT(*) as total FROM posts p ${where}`;
    const [[{ total }]] = await pool.query(countSQL, vals);

    const postsSQL = `
      SELECT p.*,
             u.id   AS author_id,
             u.name AS author_name,
             (SELECT COUNT(*) FROM likes    l WHERE l.post_id = p.id) AS likes,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'approved') AS comments
      FROM posts p
      JOIN users u ON u.id = p.author_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [posts] = await pool.query(postsSQL, [...vals, Number(limit), offset]);

    // attach liked flag per user
    let likedSet = new Set();
    if (req.user) {
      const [liked] = await pool.query(
        'SELECT post_id FROM likes WHERE user_id = ?', [req.user.id]
      );
      likedSet = new Set(liked.map(r => r.post_id));
    }

    const shaped = posts.map(p => ({
      id: p.id, title: p.title, excerpt: p.excerpt, category: p.category,
      status: p.status, cover_image: p.cover_image,
      created_at: p.created_at, updated_at: p.updated_at,
      author_id: p.author_id,
      author: { id: p.author_id, name: p.author_name },
      likes: p.likes, comments: p.comments,
      liked: likedSet.has(p.id),
    }));

    res.json({ posts: shaped, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/categories
router.get('/categories', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT category FROM posts WHERE status = 'published' ORDER BY category"
    );
    res.json({ categories: rows.map(r => r.category) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.name AS author_name,
        (SELECT COUNT(*) FROM likes    l WHERE l.post_id = p.id) AS likes,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status='approved') AS comments
      FROM posts p JOIN users u ON u.id = p.author_id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    const p = rows[0];

    if (p.status !== 'published') {
      const isOwner = req.user && (req.user.role === 'admin' || req.user.id === p.author_id);
      if (!isOwner) return res.status(404).json({ error: 'Post not found' });
    }

    let liked = false;
    if (req.user) {
      const [lr] = await pool.query(
        'SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [p.id, req.user.id]
      );
      liked = lr.length > 0;
    }

    res.json({
      post: {
        id: p.id, title: p.title, excerpt: p.excerpt, body: p.body,
        category: p.category, status: p.status, cover_image: p.cover_image,
        created_at: p.created_at, updated_at: p.updated_at,
        author_id: p.author_id,
        author: { id: p.author_id, name: p.author_name },
        likes: p.likes, comments: p.comments, liked,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts — any logged-in user can create
router.post('/', auth, async (req, res) => {
  const { title, excerpt, body, category, status, cover_image } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });

  try {
    const st = ['draft', 'published'].includes(status) ? status : 'draft';
    const nowUTC = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await pool.query(
      'INSERT INTO posts (title, excerpt, body, category, status, cover_image, author_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [title, excerpt || '', body, category || 'Essay', st, cover_image || null, req.user.id, nowUTC, nowUTC]
    );
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
    res.status(201).json({
      post: { ...rows[0], author: { id: req.user.id, name: req.user.name }, likes: 0, comments: 0, liked: false }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/posts/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });

    const post = rows[0];
    const isOwner = req.user.role === 'admin' || req.user.id === post.author_id;
    if (!isOwner) return res.status(403).json({ error: 'Not authorized' });

    const { title, excerpt, body, category, status, cover_image } = req.body;
    await pool.query(`
      UPDATE posts SET
        title       = COALESCE(?, title),
        excerpt     = COALESCE(?, excerpt),
        body        = COALESCE(?, body),
        category    = COALESCE(?, category),
        status      = COALESCE(?, status),
        cover_image = ?
      WHERE id = ?
    `, [title, excerpt, body, category, status, cover_image ?? post.cover_image, req.params.id]);

    const [updated] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    res.json({ post: { ...updated[0], author: { id: req.user.id, name: req.user.name } } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });

    const isOwner = req.user.role === 'admin' || req.user.id === rows[0].author_id;
    if (!isOwner) return res.status(403).json({ error: 'Not authorized' });

    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id/likes — get users who liked a post
router.get('/:id/likes', optionalAuth, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.name, u.avatar
      FROM likes l
      JOIN users u ON u.id = l.user_id
      WHERE l.post_id = ?
      ORDER BY l.id DESC
      LIMIT 20
    `, [req.params.id]);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/like — toggle like
router.post('/:id/like', auth, async (req, res) => {
  const postId = Number(req.params.id);
  const userId = req.user.id;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]
    );
    if (existing.length) {
      await pool.query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
    } else {
      await pool.query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
    }
    const [[{ cnt }]] = await pool.query('SELECT COUNT(*) as cnt FROM likes WHERE post_id = ?', [postId]);
    res.json({ liked: !existing.length, likes: cnt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
