import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['Technology', 'Design', 'Culture', 'Science', 'Philosophy', 'Society'];

export default function Editor() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { toast }  = useToast();
  const isEdit     = Boolean(id);

  const [form, setForm]           = useState({ title: '', category: '', excerpt: '', body: '', status: 'draft' });
  const [saving, setSaving]       = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult]   = useState('');
  const [coverImage, setCoverImage]   = useState('');   // ← image URL after upload
  const [uploading, setUploading]     = useState(false); // ← shows "Uploading…" while sending

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    if (id) {
      postsAPI.getOne(id).then(({ data }) => {
        const p = data.post;
        setForm({ title: p.title, category: p.category, excerpt: p.excerpt, body: p.body, status: p.status });
        if (p.cover_image) setCoverImage(p.cover_image);
      }).catch(() => navigate('/'));
    }
  }, [id, user, navigate]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // ── upload image to backend ────────────────────────────────────────────
  async function handleImagePick(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const token = localStorage.getItem('inkwell_token');
      const res   = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        setCoverImage('http://localhost:5000' + data.url);
        toast('Image uploaded!', 'success');
      } else {
        toast(data.error || 'Upload failed', 'error');
      }
    } catch {
      toast('Upload failed — is the backend running?', 'error');
    } finally {
      setUploading(false);
    }
  }

  // ── save / publish ─────────────────────────────────────────────────────
  async function save(status) {
    if (!form.title.trim() || !form.body.trim()) { toast('Title and body are required', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, status, cover_image: coverImage };   // ← send cover_image
      if (isEdit) {
        await postsAPI.update(id, payload);
        toast(`Essay ${status === 'published' ? 'published' : 'saved'}!`, 'success');
      } else {
        const { data } = await postsAPI.create(payload);
        toast(`Essay ${status === 'published' ? 'published' : 'saved as draft'}!`, 'success');
        navigate(`/write/${data.post.id}`, { replace: true });
      }
      if (status === 'published') setTimeout(() => navigate('/'), 800);
    } catch (err) {
      toast(err.response?.data?.error || 'Could not save', 'error');
    } finally { setSaving(false); }
  }

  // ── AI Polish ──────────────────────────────────────────────────────────
  async function aiAssist() {
    if (!form.body.trim()) { toast('Write something first!', 'error'); return; }
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 800,
          messages: [{ role: 'user', content: `You are an editorial assistant for Inkwell, a literary journal. Essay title: "${form.title}"\n\nDraft:\n${form.body}\n\nProvide: 1) A 2-sentence editorial note on what works. 2) An improved opening paragraph. 3) One suggestion to develop further. Keep the author's voice.` }],
        }),
      });
      const data = await res.json();
      console.log('Groq response:', data);
      if (data.error) {
        setAiResult('Error: ' + data.error.message);
      } else {
        setAiResult(data.choices?.[0]?.message?.content || 'No suggestion returned.');
      }
    } catch (err) {
      console.error('AI Polish error:', err);
      setAiResult('Could not reach AI: ' + err.message);
    } finally { setAiLoading(false); }
  }

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 2rem 5rem' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400 }}>
          {isEdit ? 'Edit Essay' : 'New Essay'}
        </h2>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => save('draft')} disabled={saving}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button className="btn btn-dark btn-sm" onClick={() => save('published')} disabled={saving}>
            {saving ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem', background: 'var(--cream)', marginBottom: '1.5rem', fontSize: '.78rem', color: 'var(--muted)' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: form.status === 'published' ? '#27ae60' : '#f39c12' }} />
        {form.status === 'published' ? 'Live' : 'Draft'}
      </div>

      {/* Title */}
      <div className="field-group">
        <label className="field-label">Title</label>
        <input className="field-input" type="text" placeholder="Your essay title…"
          style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 300 }}
          value={form.title} onChange={set('title')} />
      </div>

      {/* Category */}
      <div className="field-group">
        <label className="field-label">Category</label>
        <select className="field-input field-select" value={form.category} onChange={set('category')}>
          <option value="">Select a category</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Excerpt */}
      <div className="field-group">
        <label className="field-label">Excerpt</label>
        <textarea className="field-input" style={{ minHeight: 70, resize: 'vertical' }}
          placeholder="A short description of your essay…" value={form.excerpt} onChange={set('excerpt')} />
      </div>

      {/* Body */}
      <div className="field-group">
        <label className="field-label">Body</label>
        <textarea className="field-input field-textarea"
          placeholder="Write your essay here… (use ### for subheadings, blank line between paragraphs)"
          value={form.body} onChange={set('body')} />
      </div>

      {/* ── COVER IMAGE ──────────────────────────────────────────────── */}
      <div className="field-group">
        <label className="field-label">Cover Image</label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>

          {/* File picker button */}
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '.45rem',
            border: '1px solid var(--border)', padding: '.55rem 1rem',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '.75rem', fontWeight: 600, letterSpacing: '.06em',
            color: 'var(--muted)', background: 'var(--white)',
            transition: 'border-color .18s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {uploading
              ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Uploading…</>
              : <>📷 {coverImage ? 'Change Image' : 'Choose Image'}</>
            }
            {/* hidden actual file input */}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={handleImagePick}
            />
          </label>

          {/* Preview + remove */}
          {coverImage && (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={coverImage}
                alt="cover preview"
                style={{ height: 72, width: 130, objectFit: 'cover', border: '1px solid var(--border)', display: 'block' }}
              />
              <button
                onClick={() => setCoverImage('')}
                style={{
                  position: 'absolute', top: -7, right: -7,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--rust)', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontSize: '.65rem', lineHeight: '20px', textAlign: 'center',
                }}
              >✕</button>
            </div>
          )}

          <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
            JPG, PNG, WebP — max 5 MB
          </span>
        </div>
      </div>
      {/* ─────────────────────────────────────────────────────────────── */}

      {/* AI Polish */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginTop: '.5rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ border: '1px solid rgba(192,57,43,.35)', color: 'var(--rust)' }}
          onClick={aiAssist} disabled={aiLoading}
        >
          {aiLoading
            ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Thinking…</>
            : '✦ AI Polish'}
        </button>
        <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
          Let AI improve the readability of your draft
        </span>
      </div>

      {aiResult && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--cream)', borderLeft: '3px solid var(--rust)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.65rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rust)', border: '1px solid rgba(192,57,43,.3)', padding: '.15rem .5rem', marginBottom: '.5rem' }}>
            ✦ AI Suggestion
          </div>
          <div style={{ fontSize: '.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiResult}</div>
        </div>
      )}

    </div>
  );
}
