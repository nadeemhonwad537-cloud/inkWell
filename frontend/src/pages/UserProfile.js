import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.getPublicProfile(id)
      .then(({ data }) => {
        setProfile(data.user);
        setPosts(data.posts);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>;
  if (!profile) return null;

  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 2rem 5rem' }}>

      {/* Back */}
      <button onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.72rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '2.5rem', letterSpacing: '.05em' }}>
        ← Back
      </button>

      {/* Profile header */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap' }}>

        {/* Avatar */}
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.name}
            style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 90, height: 90, borderRadius: '50%', flexShrink: 0,
            background: 'var(--rust)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontFamily: 'var(--serif)',
          }}>
            {initials(profile.name)}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.4rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400, margin: 0 }}>
              {profile.name}
            </h1>
            <span style={{
              fontSize: '.6rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase',
              padding: '.2rem .5rem', border: '1px solid var(--border)',
              background: profile.role === 'admin' ? 'var(--rust)' : 'var(--cream)',
              color: profile.role === 'admin' ? '#fff' : 'var(--muted)',
            }}>
              {profile.role}
            </span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '.85rem', margin: '0 0 .5rem', lineHeight: 1.6 }}>
            {profile.bio || 'No bio yet.'}
          </p>
          <p style={{ fontSize: '.72rem', color: 'var(--muted)', margin: 0 }}>
            Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
          {[
            { label: 'Essays', value: posts.length },
            { label: 'Likes', value: totalLikes },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400 }}>{s.value}</div>
              <div style={{ fontSize: '.65rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '1.75rem' }} />

      {/* Published essays */}
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 400, marginBottom: '1.25rem' }}>
        Essays by {profile.name}
      </h3>

      {posts.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '.85rem', fontStyle: 'italic' }}>No published essays yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '1px solid var(--border)' }}>
          {posts.map(post => (
            <Link key={post.id} to={`/post/${post.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.25rem', background: 'var(--white)',
                borderBottom: '1px solid var(--border)', transition: 'background .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}
              >
                {/* Thumbnail */}
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
                    <span>{post.category}</span>
                    <span>{timeAgo(post.created_at)}</span>
                    <span>♥ {post.likes || 0}</span>
                    <span>💬 {post.comments || 0}</span>
                  </div>
                </div>

                <span style={{ fontSize: '.7rem', color: 'var(--muted)', flexShrink: 0 }}>Read →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
