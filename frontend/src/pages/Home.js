import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { postsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Home({ searchQuery }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await postsAPI.getCategories();
      setCategories(data.categories);
    } catch {}
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (activeCategory !== 'All') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      const { data } = await postsAPI.getAll(params);
      setPosts(data.posts);
      setTotalPages(data.pages);
    } catch {} finally { setLoading(false); }
  }, [page, activeCategory, searchQuery]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { setPage(1); }, [activeCategory, searchQuery]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleLikeChange = (postId, liked, likes) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked, likes } : p));
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ padding: '3.5rem 2rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: '.65rem', fontWeight: 500, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1rem' }}>
          Vol. 01 — May 2026
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.8rem, 6vw, 4.2rem)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-.02em', marginBottom: '1.25rem' }}>
          Slow ideas, in long form.{' '}
          <span style={{ color: 'var(--rust)' }}>Read<br />deeply.</span>
        </h1>
        <p style={{ fontSize: '.9rem', color: 'var(--muted)', maxWidth: 400, lineHeight: 1.7 }}>
          Inkwell publishes essays from independent writers — on technology, design, culture, and the texture of modern life.
        </p>
      </div>

      <hr className="divider" style={{ margin: '0 2rem 2rem' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 4rem' }}>
        {/* Category pills */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {['All', ...categories].map(cat => (
            <button key={cat} className={`cat-pill${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}>{cat}</button>
          ))}
        </div>

        <div className="section-label">
          {searchQuery ? `Search: "${searchQuery}"` : activeCategory === 'All' ? 'Latest Essays' : `${activeCategory} Essays`}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h3>No essays yet.</h3>
            <p>Be the first to publish.</p>
            {user
              ? <button className="btn btn-dark" onClick={() => navigate('/write')}>Start Writing</button>
              : <button className="btn btn-dark" onClick={() => navigate('/signup')}>Start Writing</button>
            }
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {posts.map(post => (
                <PostCard key={post.id} post={post} onLikeChange={handleLikeChange} />
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginTop: '2.5rem' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`cat-pill${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
