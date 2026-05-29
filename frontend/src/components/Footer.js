import React from 'react';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--ink)', marginTop: 'auto' }}>

      {/* Top accent line */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--rust), #e67e22, var(--rust))' }} />

      {/* Main grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 2rem 2.5rem', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '3rem' }}>

        {/* Brand col */}
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--white)', letterSpacing: '-.02em', marginBottom: '.4rem' }}>
            Inkwell
          </div>
          <div style={{ fontSize: '.65rem', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--rust)', marginBottom: '1.25rem' }}>
            — A Journal
          </div>
          <p style={{ fontSize: '.82rem', color: '#9a9890', lineHeight: 1.8, maxWidth: 240 }}>
            A space for slow ideas and long-form thinking — on technology, design, culture, and the texture of modern life.
          </p>
          {/* Decorative line */}
          <div style={{ width: 40, height: 2, background: 'var(--rust)', margin: '1.5rem 0' }} />
          <div style={{ fontSize: '.7rem', color: '#9a9890', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Independent essays, published slowly.
          </div>
        </div>

        {/* Sections col */}
        <div>
          <h4 style={{ fontSize: '.65rem', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--rust)', marginBottom: '1.25rem', paddingBottom: '.6rem', borderBottom: '1px solid #2a2a28' }}>
            Sections
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {['Technology', 'Design', 'Culture', 'Philosophy', 'Science', 'Society'].map(c => (
              <span key={c} style={{ fontSize: '.82rem', color: '#9a9890', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.5rem', transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#9a9890'}
              >
                <span style={{ color: 'var(--rust)', fontSize: '.55rem' }}>▶</span> {c}
              </span>
            ))}
          </div>
        </div>

        {/* Colophon col */}
        <div>
          <h4 style={{ fontSize: '.65rem', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--rust)', marginBottom: '1.25rem', paddingBottom: '.6rem', borderBottom: '1px solid #2a2a28' }}>
            Colophon
          </h4>
          <p style={{ fontSize: '.82rem', color: '#9a9890', lineHeight: 1.8, marginBottom: '1.25rem' }}>
            Set in Cormorant Garamond & Manrope. Typeset with care, served from a quiet corner of the internet.
          </p>
          <div style={{ padding: '1rem', background: '#111110', borderLeft: '2px solid var(--rust)' }}>
            <div style={{ fontSize: '.65rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--rust)', marginBottom: '.4rem' }}>
              Write for Inkwell
            </div>
            <div style={{ fontSize: '.78rem', color: '#9a9890', lineHeight: 1.6 }}>
              Have something worth saying? Create an account and start writing today.
            </div>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid #2a2a28' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontSize: '.68rem', color: '#9a9890', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            © 2026 Inkwell — All words by their authors.
          </span>

          {/* Nadeem credit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{ width: 1, height: 16, background: '#2a2a28' }} />
            <span style={{ fontSize: '.68rem', color: '#9a9890', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Designed & Developed by
            </span>
            <span style={{
              fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 400,
              color: 'var(--white)', letterSpacing: '.04em',
              borderBottom: '1px solid var(--rust)', paddingBottom: '1px',
            }}>
              Nadeem
            </span>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rust)' }} />
          </div>
        </div>
      </div>

    </footer>
  );
}
