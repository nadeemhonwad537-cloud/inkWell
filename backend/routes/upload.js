const router   = require('express').Router();
const multer   = require('multer');
const { auth } = require('../middleware/auth');
const { Readable } = require('stream');
const https = require('https');
const FormData = require('form-data');

// Use memory storage — no local disk needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// POST /api/upload  →  { url: "https://res.cloudinary.com/..." }
router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const preset    = process.env.CLOUDINARY_UPLOAD_PRESET || 'inkwell-unsigned';

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    form.append('upload_preset', preset);
    form.append('folder', 'inkwell');

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.cloudinary.com',
        path: `/v1_1/${cloudName}/image/upload`,
        method: 'POST',
        headers: form.getHeaders(),
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(e); }
        });
      });

      request.on('error', reject);
      form.pipe(request);
    });

    if (result.error) {
      console.error('Cloudinary error:', result.error.message);
      return res.status(500).json({ error: result.error.message });
    }

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

module.exports = router;
