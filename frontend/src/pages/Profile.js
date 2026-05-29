import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, postsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AccountSettings from '../components/AccountSettings';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Profile() {
  const { user, signout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // 'all' | 'published' | 'draft'
  const [editing, setEditing] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatar: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    setForm({ name: user.name || '', bio: user.bio || '', avatar: user.avatar || '' });
    fetchPosts();
  }, [user?.id]); // only re-run when user ID changes, not on every user update

  // keep form in sync when user data refreshes (e.g. after save)
  useEffect(() => {
    if (user && !editing) {
      setForm({ name: user.name || '', bio: user.bio || '', avatar: user.avatar || '' });
    }
  }, [user?.name, user?.bio, user?.avatar]);

  async function fetchPosts() {
    setLoading(true);
    try {
      const { data } = await authAPI.myPosts();
      setPosts(data.posts);
    } catch {
      toast('Could not load posts', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const { data } = await authAPI.updateMe(form);
      await refreshUser(); // updates global user in AuthContext + re-fetches from server
      setForm({ name: data.user.name, bio: data.user.bio || '', avatar: data.user.avatar || '' });
      toast('Profile updated!', 'success');
      setEditing(false);
    } catch {
      toast('Could not save profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const token = localStorage.getItem('inkwell_token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        setForm(f => ({ ...f, avatar: data.url }));
        toast('Avatar uploaded!', 'success');
      } else {
        toast(data.error || 'Upload failed', 'error');
      }
    } catch {
      toast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function deletePost(id) {
    if (!window.confirm('Delete this post?')) return;
    setDeleting(id);
    try {
      await postsAPI.delete(id);
      setPosts(p => p.filter(post => post.id !== id));
      toast('Post deleted', 'success');
    } catch {
      toast('Could not delete post', 'error');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = posts.filter(p => {
    if (tab === 'published') return p.status === 'published';
    if (tab === 'draft') return p.status === 'draft';
    return true;
  });

  const published = posts.filter(p => p.status === 'published').length;
  const drafts = posts.filter(p => p.status === 'draft').length;
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);

  if (!user) return null;

  const avatarUrl = form.avatar || (editing ? '' : user.avatar);

  return (
    <>
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 2rem 5rem' }}>

      {/* ── Profile Header ── */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap' }}>

        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar"
              style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
          ) : (
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'var(--rust)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontFamily: 'var(--serif)', fontWeight: 400,
            }}>
              {initials(user.name)}
            </div>
          )}
          {editing && (
            <label style={{
              position: 'absolute', bottom: 0, right: 0,
              background: 'var(--ink)', color: '#fff',
              width: 26, height: 26, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '.7rem',
            }}>
              {uploading ? '…' : '📷'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          )}
        </div>

        {/* Info / Edit form */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <input
                className="field-input"
                style={{ fontSize: '1rem', fontWeight: 500 }}
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <textarea
                className="field-input"
                style={{ minHeight: 70, resize: 'vertical', fontSize: '.85rem' }}
                placeholder="Write a short bio…"
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              />
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button className="btn btn-dark btn-sm" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '.4rem' }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400, margin: 0 }}>
                  {user.name}
                </h1>
                <span style={{
                  fontSize: '.6rem', fontWeight: 600, letterSpacing: '.1em',
                  textTransform: 'uppercase', padding: '.2rem .5rem',
                  background: user.role === 'admin' ? 'var(--rust)' : 'var(--cream)',
                  color: user.role === 'admin' ? '#fff' : 'var(--muted)',
                  border: '1px solid var(--border)',
                }}>
                  {user.role}
                </span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '.85rem', margin: '0 0 .75rem', lineHeight: 1.6 }}>
                {user.bio || 'No bio yet.'}
              </p>
              <p style={{ fontSize: '.72rem', color: 'var(--muted)', margin: '0 0 .75rem' }}>
                {user.email}
              </p>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAccountSettings(true)}
                style={{ border: '1px solid var(--border)', fontSize: '.68rem' }}>
                ⚙ Account Settings
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
          {[
            { label: 'Posts', value: posts.length },
            { label: 'Published', value: published },
            { label: 'Likes', value: totalLikes },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400 }}>{s.value}</div>
              <div style={{ fontSize: '.65rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '1.5rem' }} />

      {/* ── Tabs + Write button ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <div style={{ display: 'flex', gap: '.25rem' }}>
          {[
            { key: 'all', label: `All (${posts.length})` },
            { key: 'published', label: `Published (${published})` },
            { key: 'draft', label: `Drafts (${drafts})` },
          ].map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '.4rem .9rem', fontSize: '.72rem', fontWeight: 600,
                letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer',
                border: '1px solid var(--border)',
                background: tab === t.key ? 'var(--ink)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--muted)',
                transition: 'all .15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <button className="btn btn-dark btn-sm" onClick={() => navigate('/write')}>
          + New Essay
        </button>
      </div>

      {/* ── Posts list ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          {tab === 'draft' ? 'No drafts.' : tab === 'published' ? 'No published posts yet.' : 'No posts yet.'}
          <br />
          <button className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }} onClick={() => navigate('/write')}>
            Write your first essay
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '1px solid var(--border)' }}>
          {filtered.map(post => (
            <div key={post.id} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem 1.25rem', background: 'var(--white)',
              borderBottom: '1px solid var(--border)',
              transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}
            >
              {/* Cover thumbnail */}
              {post.cover_image ? (
                <img src={post.cover_image} alt=""
                  style={{ width: 56, height: 42, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
              ) : (
                <div style={{ width: 56, height: 42, background: 'var(--cream)', flexShrink: 0, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>✍️</span>
                </div>
              )}

              {/* Title + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 400, marginBottom: '.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {post.title}
                </div>
                <div style={{ display: 'flex', gap: '.75rem', fontSize: '.7rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '.1rem .4rem', fontSize: '.6rem', fontWeight: 600,
                    letterSpacing: '.08em', textTransform: 'uppercase',
                    background: post.status === 'published' ? 'rgba(39,174,96,.12)' : 'rgba(243,156,18,.12)',
                    color: post.status === 'published' ? '#27ae60' : '#f39c12',
                    border: `1px solid ${post.status === 'published' ? 'rgba(39,174,96,.3)' : 'rgba(243,156,18,.3)'}`,
                  }}>
                    {post.status}
                  </span>
                  <span>{post.category}</span>
                  <span>{timeAgo(post.created_at)}</span>
                  <span>♥ {post.likes || 0}</span>
                  <span>💬 {post.comments || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                {post.status === 'published' && (
                  <Link to={`/post/${post.id}`}
                    style={{ padding: '.35rem .7rem', fontSize: '.68rem', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', border: '1px solid var(--border)', color: 'var(--muted)', textDecoration: 'none', background: 'transparent' }}>
                    View
                  </Link>
                )}
                <button
                  onClick={() => navigate(`/write/${post.id}`)}
                  style={{ padding: '.35rem .7rem', fontSize: '.68rem', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', border: '1px solid var(--border)', color: 'var(--ink)', background: 'transparent', cursor: 'pointer' }}>
                  Edit
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  disabled={deleting === post.id}
                  style={{ padding: '.35rem .7rem', fontSize: '.68rem', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', border: '1px solid rgba(192,57,43,.3)', color: 'var(--rust)', background: 'transparent', cursor: 'pointer' }}>
                  {deleting === post.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {showAccountSettings && (
      <AccountSettings
        onClose={() => setShowAccountSettings(false)}
        onUsernameChanged={() => refreshUser()}
      />
    )}
  </>
  );
}