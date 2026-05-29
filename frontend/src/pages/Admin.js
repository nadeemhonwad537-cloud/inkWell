import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI, commentsAPI, adminAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function StatCard({ value, label }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '1.25rem' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '2.2rem', fontWeight: 300, lineHeight: 1, marginBottom: '.25rem' }}>{value}</div>
      <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}

function RowActions({ children }) {
  return <div style={{ display: 'flex', gap: '.4rem' }}>{children}</div>;
}

function IconBtn({ danger, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: '1px solid var(--border)', padding: '.3rem .55rem',
      cursor: 'pointer', fontSize: '.68rem', fontWeight: 500, color: 'var(--muted)',
      fontFamily: 'var(--sans)', transition: 'all .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = danger ? 'var(--rust)' : 'var(--ink)'; e.currentTarget.style.color = danger ? 'var(--rust)' : 'var(--ink)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
    >{children}</button>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState('posts');
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadStats();
  }, [user, navigate]);

  async function loadStats() {
    const { data } = await adminAPI.getStats();
    setStats(data);
  }

  const loadPosts = useCallback(async () => {
    const { data } = await postsAPI.getAll({ limit: 50 });
    setPosts(data.posts);
  }, []);

  const loadComments = useCallback(async () => {
    const { data } = await commentsAPI.getAll();
    setComments(data.comments);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await adminAPI.getUsers();
    setUsers(data.users);
  }, []);

  useEffect(() => {
    if (tab === 'posts') loadPosts();
    if (tab === 'comments') loadComments();
    if (tab === 'users') loadUsers();
  }, [tab, loadPosts, loadComments, loadUsers]);

  async function togglePostStatus(post) {
    const status = post.status === 'published' ? 'draft' : 'published';
    await postsAPI.update(post.id, { status });
    toast(`Post ${status}.`, 'success');
    loadPosts(); loadStats();
  }

  async function deletePost(id) {
    if (!window.confirm('Delete this essay permanently?')) return;
    await postsAPI.delete(id);
    toast('Essay deleted.', 'success');
    loadPosts(); loadStats();
  }

  async function moderateComment(id, status) {
    await commentsAPI.updateStatus(id, status);
    toast('Comment updated.', 'success');
    loadComments(); loadStats();
  }

  async function deleteComment(id) {
    if (!window.confirm('Delete this comment?')) return;
    await commentsAPI.delete(id);
    toast('Comment deleted.', 'success');
    loadComments(); loadStats();
  }

  async function changeRole(id, role) {
    await adminAPI.updateUserRole(id, role);
    toast('Role updated.', 'success');
    loadUsers();
  }

  async function deleteUser(id) {
    if (!window.confirm('Delete this user?')) return;
    await adminAPI.deleteUser(id);
    toast('User deleted.', 'success');
    loadUsers(); loadStats();
  }

  const tabs = ['posts', 'comments', 'users'];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem 5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400 }}>Admin Control</h2>
        <button className="btn btn-rust btn-sm" onClick={() => navigate('/write')}>+ New Essay</button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard value={stats.totalPosts} label="Total Essays" />
          <StatCard value={stats.published} label="Published" />
          <StatCard value={stats.totalComments} label="Comments" />
          <StatCard value={stats.totalLikes} label="Total Likes" />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontSize: '.72rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase',
            padding: '.65rem 1.25rem', cursor: 'pointer', border: 'none', background: 'transparent',
            fontFamily: 'var(--sans)', color: tab === t ? 'var(--ink)' : 'var(--muted)',
            borderBottom: tab === t ? '2px solid var(--ink)' : '2px solid transparent',
            marginBottom: -1, transition: 'all .18s',
          }}>{t}</button>
        ))}
      </div>

      {/* Posts Table */}
      {tab === 'posts' && (
        <table className="data-table">
          <thead><tr>
            <th>Title</th><th>Category</th><th>Author</th><th>Date</th>
            <th>Status</th><th>Likes</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id}>
                <td style={{ maxWidth: 220 }}><strong>{p.title}</strong></td>
                <td><span className="post-cat-tag">{p.category}</span></td>
                <td>{p.author?.name}</td>
                <td>{p.created_at?.slice(0, 10)}</td>
                <td><span className={`badge badge-${p.status === 'published' ? 'live' : 'draft'}`}>{p.status}</span></td>
                <td>♥ {p.likes || 0}</td>
                <td>
                  <RowActions>
                    <IconBtn onClick={() => navigate(`/write/${p.id}`)}>Edit</IconBtn>
                    <IconBtn onClick={() => togglePostStatus(p)}>{p.status === 'published' ? 'Unpublish' : 'Publish'}</IconBtn>
                    <IconBtn danger onClick={() => deletePost(p.id)}>Delete</IconBtn>
                  </RowActions>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Comments Table */}
      {tab === 'comments' && (
        <table className="data-table">
          <thead><tr>
            <th>Author</th><th>Comment</th><th>Post</th><th>Date</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {comments.map(c => (
              <tr key={c.id}>
                <td>{c.author_name}</td>
                <td style={{ maxWidth: 260 }}>{c.body.slice(0, 80)}{c.body.length > 80 ? '…' : ''}</td>
                <td style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{c.post_title?.slice(0, 30)}…</td>
                <td>{c.created_at?.slice(0, 10)}</td>
                <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                <td>
                  <RowActions>
                    {c.status !== 'approved' && <IconBtn onClick={() => moderateComment(c.id, 'approved')}>Approve</IconBtn>}
                    {c.status !== 'rejected' && <IconBtn onClick={() => moderateComment(c.id, 'rejected')}>Reject</IconBtn>}
                    <IconBtn danger onClick={() => deleteComment(c.id)}>Delete</IconBtn>
                  </RowActions>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Users Table */}
      {tab === 'users' && (
        <table className="data-table">
          <thead><tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <div className="avatar" style={{ width: 26, height: 26, fontSize: '.6rem' }}>
                    {(u.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  {u.name}
                </td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    style={{ border: '1px solid var(--border)', padding: '.2rem .4rem', fontFamily: 'var(--sans)', fontSize: '.75rem', background: 'var(--white)', cursor: 'pointer' }}>
                    <option value="reader">reader</option>
                    <option value="writer">writer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{u.created_at?.slice(0, 10)}</td>
                <td>
                  <RowActions>
                    {u.id !== user.id && <IconBtn danger onClick={() => deleteUser(u.id)}>Delete</IconBtn>}
                  </RowActions>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
