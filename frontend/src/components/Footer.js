import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>

      {/* Main grid */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '3rem 2rem 2rem',
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr 1fr',
        gap: '3rem',
      }}>

        {/* Brand col */}
        <div>
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
            <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M55,5 C70,0 85,20 72,52 C64,72 48,80 38,85 C46,62 53,42 50,25 C47,12 40,6 55,5 Z"
                fill="#c0392b" opacity="0.15" />
              <path d="M55,5 C70,0 85,20 72,52 C64,72 48,80 38,85"
                fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" />
              <path d="M55,5 L38,85" fill="none" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M38,85 L32,102 L37,88 Z" fill="#c0392b" />
              <circle cx="33" cy="106" r="3" fill="#c0392b" opacity="0.7" />
              <rect x="58" y="60" width="28" height="24" rx="2" fill="var(--ink)" />
              <rect x="66" y="53" width="12" height="10" rx="1.5" fill="var(--ink)" />
              <rect x="64" y="49" width="16" height="6" rx="1.5" fill="#c0392b" />
            </svg>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>
                Inkwell
              </div>
              <div style={{ fontSize: '.6rem', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--rust)', marginTop: '.2rem' }}>
                — A Journal
              </div>
            </div>
          </div>

          <p style={{ fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.8, maxWidth: 260, marginBottom: '1.25rem' }}>
            A space for slow ideas and long-form thinking — on technology, design, culture, and the texture of modern life.
          </p>

          <div style={{ width: 32, height: 2, background: 'var(--rust)', marginBottom: '1rem' }} />

          <div style={{ fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Independent essays, published slowly.
          </div>
        </div>

        {/* Sections col */}
        <div>
          <h4 style={{
            fontSize: '.65rem', fontWeight: 600, letterSpacing: '.18em',
            textTransform: 'uppercase', color: 'var(--ink)',
            marginBottom: '1.1rem', paddingBottom: '.6rem',
            borderBottom: '1px solid var(--border)',
          }}>
            Sections
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
            {['Technology', 'Design', 'Culture', 'Philosophy', 'Science', 'Society'].map(c => (
              <Link
                to={`/categories?cat=${c}`}
                key={c}
                style={{
                  fontSize: '.82rem', color: 'var(--muted)',
                  display: 'flex', alignItems: 'center', gap: '.45rem',
                  transition: 'color .18s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--rust)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
              >
                <span style={{ color: 'var(--rust)', fontSize: '.5rem' }}>▶</span> {c}
              </Link>
            ))}
          </div>
        </div>

        {/* Write col */}
        <div>
          <h4 style={{
            fontSize: '.65rem', fontWeight: 600, letterSpacing: '.18em',
            textTransform: 'uppercase', color: 'var(--ink)',
            marginBottom: '1.1rem', paddingBottom: '.6rem',
            borderBottom: '1px solid var(--border)',
          }}>
            Contribute
          </h4>
          <p style={{ fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.8, marginBottom: '1.25rem' }}>
            Set in Cormorant Garamond & Manrope. Typeset with care, served from a quiet corner of the internet.
          </p>
          <div style={{
            padding: '.9rem 1rem',
            background: 'var(--paper)',
            borderLeft: '2px solid var(--rust)',
          }}>
            <div style={{
              fontSize: '.63rem', fontWeight: 600, letterSpacing: '.15em',
              textTransform: 'uppercase', color: 'var(--rust)', marginBottom: '.35rem',
            }}>
              Write for Inkwell
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Have something worth saying? Create an account and start writing today.
            </div>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '.75rem',
        }}>
          <span style={{ fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            © 2026 Inkwell — All words by their authors.
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Designed & Developed by
            </span>
            <span style={{
              fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 400,
              color: 'var(--ink)', letterSpacing: '.04em',
              borderBottom: '1px solid var(--rust)', paddingBottom: '1px',
            }}>
              Nadeem
            </span>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--rust)' }} />
          </div>
        </div>
      </div>

    </footer>
  );
}
