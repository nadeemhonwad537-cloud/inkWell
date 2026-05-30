import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsAPI, commentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [likers, setLikers] = useState([]);
  const [showLikers, setShowLikers] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [postRes, commentsRes, likersRes] = await Promise.all([
          postsAPI.getOne(id),
          commentsAPI.getByPost(id),
          postsAPI.getLikes(id),
        ]);
        setPost(postRes.data.post);
        setComments(commentsRes.data.comments);
        setLikers(likersRes.data.users);
      } catch { navigate('/'); }
      finally { setLoading(false); }
    }
    load();
  }, [id, navigate]);

  async function handleLike() {
    if (!user) { navigate('/signin'); return; }
    try {
      const { data } = await postsAPI.like(post.id);
      setPost(p => ({ ...p, liked: data.liked, likes: data.likes }));
      // refresh likers list
      const { data: ld } = await postsAPI.getLikes(post.id);
      setLikers(ld.users);
    } catch { toast('Could not update like', 'error'); }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await commentsAPI.create({ post_id: post.id, body: commentText });
      setComments(prev => [...prev, data.comment]);
      setCommentText('');
      toast('Response posted!', 'success');
    } catch { toast('Could not post comment', 'error'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>;
  if (!post) return null;

  const isOwner = user && (user.role === 'admin' || user.id === post.author_id);

  const bodyHtml = post.body.split('\n\n').map((para, i) => {
    if (para.startsWith('### '))
      return <h3 key={i} style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 400, margin: '2rem 0 .75rem', letterSpacing: '-.01em' }}>{para.slice(4)}</h3>;
    return <p key={i} style={{ marginBottom: '1.5rem' }}>{para}</p>;
  });

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '3rem 2rem 5rem' }}>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.72rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '2.5rem', letterSpacing: '.05em' }}
      >← Back to all essays</button>

      {/* Article header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', fontSize: '.7rem', color: 'var(--muted)', fontWeight: 500 }}>
          <span className="post-cat-tag">{post.category}</span>
          <span>{post.created_at ? new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) + ' · ' + new Date(post.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: true }) : 'Just now'}</span>
          {post.status === 'draft' && <span className="badge badge-draft">Draft</span>}
        </div>

        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 300, lineHeight: 1.15, letterSpacing: '-.02em', marginBottom: '1rem' }}>
          {post.title}
        </h1>

        {post.excerpt && (
          <p style={{ fontSize: '1rem', color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--serif)', marginBottom: '1rem' }}>
            {post.excerpt}
          </p>
        )}

        {/* Byline */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', fontSize: '.78rem', fontWeight: 500 }}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: '.75rem' }}>{initials(post.author?.name)}</div>
            <div>
              <div>{post.author?.name}</div>
              <div style={{ fontSize: '.7rem', color: 'var(--muted)', fontWeight: 400 }}>Independent contributor</div>
            </div>
          </div>
          {isOwner && (
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/write/${post.id}`)}>Edit</button>
              {user.role === 'admin' && (
                <button
                  className="btn btn-sm"
                  style={{ border: '1px solid var(--rust)', color: 'var(--rust)', background: 'transparent' }}
                  onClick={async () => {
                    if (window.confirm('Delete this essay?')) {
                      await postsAPI.delete(post.id);
                      navigate('/');
                    }
                  }}
                >Delete</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Cover image (full width under header) ── */}
      {post.cover_image && (
        <div style={{ margin: '0 0 2rem' }}>
          <img
            src={post.cover_image}
            alt={post.title}
            style={{ width: '100%', maxHeight: 400, objectFit: 'cover', border: '1px solid var(--border)', display: 'block' }}
          />
        </div>
      )}

      {/* Article body */}
      <div style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', lineHeight: 1.85, fontWeight: 300, margin: '2rem 0' }}>
        {bodyHtml}
      </div>

      {/* Like bar */}
      <div style={{ padding: '1.5rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleLike}
            style={{
              display: 'flex', alignItems: 'center', gap: '.5rem',
              fontFamily: 'var(--sans)', fontSize: '.78rem', fontWeight: 600,
              letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer',
              border: `1px solid ${post.liked ? 'var(--rust)' : 'var(--border)'}`,
              color: post.liked ? 'var(--rust)' : 'var(--ink)',
              background: post.liked ? 'rgba(192,57,43,.05)' : 'var(--white)',
              padding: '.6rem 1.25rem', transition: 'all .2s',
            }}
          >♥ {post.liked ? 'Liked' : 'Like this essay'}</button>

          {/* Likers avatars + count */}
          {likers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer' }}
              onClick={() => setShowLikers(v => !v)}>
              {/* Stacked avatars */}
              <div style={{ display: 'flex' }}>
                {likers.slice(0, 5).map((u, i) => (
                  <Link key={u.id} to={`/user/${u.id}`} title={u.name} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '2px solid var(--white)',
                    marginLeft: i === 0 ? 0 : -8,
                    overflow: 'hidden', flexShrink: 0,
                    background: 'var(--rust)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.6rem', fontWeight: 600, color: '#fff',
                    zIndex: 5 - i,
                    position: 'relative', textDecoration: 'none',
                  }}>
                    {u.avatar
                      ? <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials(u.name)
                    }
                  </Link>
                ))}
              </div>
              <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                {post.likes} reader{post.likes !== 1 ? 's' : ''} liked this
                <span style={{ fontSize: '.7rem', marginLeft: '.3rem', color: 'var(--rust)' }}>
                  {showLikers ? '▲' : '▼'}
                </span>
              </span>
            </div>
          )}

          {likers.length === 0 && (
            <span style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
              Be the first to like this essay
            </span>
          )}
        </div>

        {/* Expanded likers list */}
        {showLikers && likers.length > 0 && (
          <div style={{
            marginTop: '1rem', padding: '1rem',
            background: 'var(--cream)', border: '1px solid var(--border)',
            display: 'flex', flexWrap: 'wrap', gap: '.6rem',
          }}>
            {likers.map(u => (
              <Link key={u.id} to={`/user/${u.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '.4rem',
                  padding: '.3rem .7rem', background: 'var(--white)',
                  border: '1px solid var(--border)', fontSize: '.78rem', fontWeight: 500,
                  color: 'var(--ink)', cursor: 'pointer', transition: 'background .15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--rust)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.55rem', fontWeight: 700, overflow: 'hidden', flexShrink: 0,
                  }}>
                    {u.avatar
                      ? <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials(u.name)
                    }
                  </div>
                  {u.name}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '1.5rem' }}>
          Responses ({comments.length})
        </h3>

        <form onSubmit={submitComment} style={{ marginBottom: '2rem' }}>
          <textarea
            className="field-input"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={user ? 'Share your thoughts…' : 'Sign in to leave a response…'}
            readOnly={!user}
            style={{ minHeight: 80, resize: 'vertical', marginBottom: '.5rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {user
              ? <button type="submit" className="btn btn-dark btn-sm" disabled={submitting}>
                {submitting ? 'Posting…' : 'Post Response'}
              </button>
              : <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/signin')}>
                Sign in to respond
              </button>
            }
          </div>
        </form>

        {comments.length === 0
          ? <p style={{ color: 'var(--muted)', fontSize: '.85rem', fontStyle: 'italic' }}>No responses yet. Be the first.</p>
          : comments.map(c => (
            <div key={c.id} style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.75rem', fontWeight: 500 }}>
                  <div className="avatar">{initials(c.author_name || c.user_name)}</div>
                  {c.author_name || c.user_name || 'Anonymous'}
                </div>
                <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{c.created_at?.slice(0, 10)}</span>
              </div>
              <p style={{ fontSize: '.85rem', lineHeight: 1.65 }}>{c.body}</p>
            </div>
          ))
        }
      </div>

    </div>
  );
}
