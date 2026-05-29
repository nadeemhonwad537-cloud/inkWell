import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../api';

export default function SignIn() {
  const { signin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ── sign in state ─────────────────────────────────
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // ── forgot password state ─────────────────────────
  const [mode, setMode] = useState('signin'); // 'signin' | 'forgot' | 'otp'
  const [fpEmail, setFpEmail]     = useState('');
  const [fpSending, setFpSending] = useState(false);
  const [otpCode, setOtpCode]     = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [otpSaving, setOtpSaving] = useState(false);

  const set = f => e => setForm(x => ({ ...x, [f]: e.target.value }));

  // ── handlers ──────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await signin(form.email, form.password);
      toast(`Welcome back, ${user.name}!`, 'success');
      navigate('/');
    } catch (err) {
      toast(err.response?.data?.error || 'Sign in failed', 'error');
    } finally { setLoading(false); }
  }

  async function handleSendOTP(e) {
    e.preventDefault();
    if (!fpEmail) return toast('Enter your email', 'error');
    setFpSending(true);
    try {
      await authAPI.sendOTP(fpEmail);
      toast('OTP sent! Check your email.', 'success');
      setMode('otp');
    } catch (err) {
      toast(err.response?.data?.error || 'Could not send OTP', 'error');
    } finally { setFpSending(false); }
  }

  async function handleOTPReset(e) {
    e.preventDefault();
    if (!otpCode)              return toast('Enter the OTP code', 'error');
    if (newPw !== confirmPw)   return toast('Passwords do not match', 'error');
    if (newPw.length < 6)      return toast('Password must be at least 6 characters', 'error');
    setOtpSaving(true);
    try {
      await authAPI.verifyOTP({ email: fpEmail, code: otpCode, newPassword: newPw });
      toast('Password reset! Please sign in with your new password.', 'success');
      setMode('signin');
      setForm(f => ({ ...f, email: fpEmail, password: '' }));
    } catch (err) {
      toast(err.response?.data?.error || 'Invalid or expired OTP', 'error');
    } finally { setOtpSaving(false); }
  }

  // ── shared card wrapper ───────────────────────────
  const card = (title, subtitle, children) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 52px)', padding: '2rem' }}>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '2.5rem', width: '100%', maxWidth: 420 }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 300, marginBottom: '.5rem' }}>{title}</h2>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>{subtitle}</p>
        {children}
      </div>
    </div>
  );

  // ── SIGN IN ───────────────────────────────────────
  if (mode === 'signin') return card('Sign In', 'Welcome back to Inkwell.',
    <>
      <form onSubmit={handleSignIn}>
        <div className="field-group">
          <label className="field-label">Email</label>
          <input className="field-input" type="email" placeholder="you@example.com"
            value={form.email} onChange={set('email')} required />
        </div>
        <div className="field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.35rem' }}>
            <label className="field-label" style={{ margin: 0 }}>Password</label>
            <button type="button" onClick={() => { setFpEmail(form.email); setMode('forgot'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.72rem', color: 'var(--rust)', textDecoration: 'underline', padding: 0 }}>
              Forgot password?
            </button>
          </div>
          <input className="field-input" type="password" placeholder="••••••••"
            value={form.password} onChange={set('password')} required />
        </div>
        <button type="submit" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '1.25rem', textAlign: 'center' }}>
        Don't have an account?{' '}
        <Link to="/signup" style={{ color: 'var(--ink)', fontWeight: 500, textDecoration: 'underline' }}>Subscribe</Link>
      </p>
    </>
  );

  // ── FORGOT — enter email ──────────────────────────
  if (mode === 'forgot') return card('Reset Password', 'Enter your account email and we\'ll send you a 6-digit code.',
    <>
      <form onSubmit={handleSendOTP}>
        <div className="field-group">
          <label className="field-label">Email Address</label>
          <input className="field-input" type="email" placeholder="you@example.com"
            value={fpEmail} onChange={e => setFpEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }} disabled={fpSending}>
          {fpSending ? 'Sending…' : 'Send OTP'}
        </button>
      </form>
      <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '1.25rem', textAlign: 'center' }}>
        <button onClick={() => setMode('signin')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', fontWeight: 500, textDecoration: 'underline', fontSize: '.78rem' }}>
          ← Back to Sign In
        </button>
      </p>
    </>
  );

  // ── OTP — enter code + new password ──────────────
  return card('Enter OTP', `A 6-digit code was sent to ${fpEmail}.`,
    <>
      <form onSubmit={handleOTPReset}>
        <div className="field-group">
          <label className="field-label">OTP Code</label>
          <input className="field-input" type="text" placeholder="6-digit code"
            value={otpCode} onChange={e => setOtpCode(e.target.value)} required
            style={{ letterSpacing: '.2em', fontSize: '1.1rem' }} />
        </div>
        <div className="field-group">
          <label className="field-label">New Password</label>
          <input className="field-input" type="password" placeholder="At least 6 characters"
            value={newPw} onChange={e => setNewPw(e.target.value)} required />
        </div>
        <div className="field-group">
          <label className="field-label">Confirm New Password</label>
          <input className="field-input" type="password" placeholder="Repeat new password"
            value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }} disabled={otpSaving}>
          {otpSaving ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
      <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '1rem', textAlign: 'center' }}>
        <button onClick={() => setMode('forgot')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', fontWeight: 500, textDecoration: 'underline', fontSize: '.78rem' }}>
          ← Use a different email
        </button>
      </p>
    </>
  );
}
