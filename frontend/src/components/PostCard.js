import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../api';
import { useToast } from '../context/ToastContext';

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function PostCard({ post, onLikeChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  async function handleLike(e) {
    e.stopPropagation();
    if (!user) { navigate('/signin'); return; }
    try {
      const { data } = await postsAPI.like(post.id);
      if (onLikeChange) onLikeChange(post.id, data.liked, data.likes);
    } catch { toast('Could not update like', 'error'); }
  }

  return (
    <div
      onClick={() => navigate(`/post/${post.id}`)}
      style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        cursor: 'pointer', transition: 'border-color .2s, transform .2s',
        overflow: 'hidden',   /* so the cover image doesn't spill */
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >

      {/* ── Cover image (shown only when post has one) ── */}
      {post.cover_image && (
        <div style={{ height: 180, overflow: 'hidden' }}>
          <img
            src={post.cover_image}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* ── Card body ── */}
      <div style={{ padding: '1.75rem' }}>

        {/* Meta row: category + date + draft badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', fontSize: '.7rem', color: 'var(--muted)', fontWeight: 500 }}>
          <span className="post-cat-tag">{post.category || 'Essay'}</span>
          <span>{new Date(post.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(post.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          {post.status === 'draft' && <span className="badge badge-draft">Draft</span>}
        </div>

        {/* Title */}
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.45rem', fontWeight: 400, lineHeight: 1.25, marginBottom: '.6rem', letterSpacing: '-.01em' }}>
          {post.title}
        </h2>

        {/* Excerpt */}
        <p style={{ fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
          {post.excerpt}
        </p>

        {/* Footer: author + reactions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.72rem', fontWeight: 500 }}>
            <div className="avatar">{initials(post.author?.name || post.author_name)}</div>
            {post.author?.name || 'Anonymous'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', fontSize: '.72rem', color: 'var(--muted)' }}>
            <button
              onClick={handleLike}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '.3rem',
                fontSize: '.72rem', fontFamily: 'var(--sans)',
                color: post.liked ? 'var(--rust)' : 'var(--muted)',
                padding: '.2rem .4rem',
              }}
            >♥ {post.likes || 0}</button>
            <span>💬 {post.comments || 0}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
