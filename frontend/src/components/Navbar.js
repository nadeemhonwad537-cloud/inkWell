import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Navbar({ onSearch }) {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (onSearch) onSearch(search); }, 300);
    return () => clearTimeout(timer.current);
  }, [search, onSearch]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'var(--white)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', gap: '2rem',
      padding: '0 2rem', height: 52,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.75rem', textDecoration: 'none' }}>
        <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Quill */}
          <path d="M55,5 C70,0 85,20 72,52 C64,72 48,80 38,85 C46,62 53,42 50,25 C47,12 40,6 55,5 Z"
            fill="#c0392b" opacity="0.2" />
          <path d="M55,5 C70,0 85,20 72,52 C64,72 48,80 38,85"
            fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" />
          <path d="M55,5 L38,85" fill="none" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M38,85 L32,102 L37,88 Z" fill="#c0392b" />
          <circle cx="33" cy="106" r="3" fill="#c0392b" opacity="0.7" />
          {/* Ink bottle */}
          <rect x="58" y="60" width="28" height="24" rx="2" fill="#1a1a18" />
          <rect x="66" y="53" width="12" height="10" rx="1.5" fill="#1a1a18" />
          <rect x="64" y="49" width="16" height="6" rx="1.5" fill="#c0392b" />
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', fontWeight: 400, color: 'var(--ink)' }}>
            Inkwell
          </span>
          <span style={{ fontSize: '.65rem', fontWeight: 500, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', borderLeft: '1px solid var(--border)', paddingLeft: '.5rem' }}>
            — A Journal
          </span>
        </div>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '.7rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase' }} className="hide-mobile">
        <Link to="/" style={{ color: isActive('/') ? 'var(--ink)' : 'var(--muted)', transition: 'color .2s' }}>Home</Link>
        <Link to="/categories" style={{ color: isActive('/categories') ? 'var(--ink)' : 'var(--muted)', transition: 'color .2s' }}>Categories</Link>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flex: 1, maxWidth: 220, marginLeft: 'auto' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text" placeholder="Search essays..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', fontFamily: 'var(--sans)', fontSize: '.8rem', color: 'var(--ink)', outline: 'none', width: '100%', borderBottom: '1px solid var(--border)', padding: '.25rem .1rem' }}
        />
      </div>

      {/* Auth actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', position: 'relative' }}>
        {user ? (
          <>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {user.avatar ? (
                <img src={user.avatar} alt="avatar"
                  style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
              ) : (
                <div className="avatar">{initials(user.name)}</div>
              )}
              <span style={{ fontSize: '.75rem', fontWeight: 500 }} className="hide-mobile">{user.name}</span>
            </div>
            {menuOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, background: 'var(--white)',
                border: '1px solid var(--border)', minWidth: 160, zIndex: 200,
              }} onClick={() => setMenuOpen(false)}>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '.6rem 1rem', borderBottom: '1px solid var(--border)' }}
                  onClick={() => navigate('/profile')}>My Profile</button>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '.6rem 1rem', borderBottom: '1px solid var(--border)' }}
                  onClick={() => navigate('/write')}>Write Essay</button>
                {user.role === 'admin' && (
                  <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '.6rem 1rem', borderBottom: '1px solid var(--border)' }}
                    onClick={() => navigate('/admin')}>Admin Panel</button>
                )}
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '.6rem 1rem' }}
                  onClick={signout}>Sign Out</button>
              </div>
            )}
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/signin')}>Sign in</button>
            <button className="btn btn-dark btn-sm" onClick={() => navigate('/signup')}>Subscribe</button>
          </>
        )}
      </div>
    </nav>
  );
}
