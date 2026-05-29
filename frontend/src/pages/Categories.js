import React, { useState, useEffect, useCallback } from 'react';
import PostCard from '../components/PostCard';
import { postsAPI } from '../api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState('All');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsAPI.getCategories().then(({ data }) => setCategories(data.categories));
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (active !== 'All') params.category = active;
      const { data } = await postsAPI.getAll(params);
      setPosts(data.posts);
    } catch {} finally { setLoading(false); }
  }, [active]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleLikeChange = (postId, liked, likes) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked, likes } : p));
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem 4rem' }}>
      <div className="section-label">Browse by Category</div>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {['All', ...categories].map(cat => (
          <button key={cat} className={`cat-pill${active === cat ? ' active' : ''}`}
            onClick={() => setActive(cat)}>{cat}</button>
        ))}
      </div>
      {loading
        ? <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
        : posts.length === 0
          ? <div className="empty-state"><h3>No essays here yet.</h3><p>Check back soon.</p></div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {posts.map(post => <PostCard key={post.id} post={post} onLikeChange={handleLikeChange} />)}
            </div>
      }
    </div>
  );
}
