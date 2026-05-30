import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SignUp() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', dob: '' });
  const [loading, setLoading] = useState(false);
  const [dobError, setDobError] = useState('');

  const set = f => e => {
    setForm(x => ({ ...x, [f]: e.target.value }));
    if (f === 'dob') setDobError('');
  };

  function validateAge(dob) {
    if (!dob) return 'Date of birth is required';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 18) return `You must be at least 18 years old (you are ${age})`;
    return '';
  }

  async function handle(e) {
    e.preventDefault();
    const ageErr = validateAge(form.dob);
    if (ageErr) { setDobError(ageErr); return; }
    setLoading(true);
    try {
      const user = await signup(form.name, form.email, form.password, form.dob);
      toast(`Welcome to Inkwell, ${user.name}!`, 'success');
      navigate('/');
    } catch (err) {
      toast(err.response?.data?.error || 'Sign up failed', 'error');
    } finally { setLoading(false); }
  }

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 52px)', padding: '2rem' }}>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '2.5rem', width: '100%', maxWidth: 420 }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 300, marginBottom: '.5rem' }}>Subscribe</h2>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Join Inkwell — read, write, and respond.
        </p>
        <form onSubmit={handle}>
          <div className="field-group">
            <label className="field-label">Full Name</label>
            <input className="field-input" type="text" placeholder="Your full name"
              value={form.name} onChange={set('name')} required />
          </div>
          <div className="field-group">
            <label className="field-label">Email</label>
            <input className="field-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required />
          </div>
          <div className="field-group">
            <label className="field-label">Date of Birth</label>
            <input className="field-input" type="date" max={maxDateStr}
              value={form.dob} onChange={set('dob')} required style={{ colorScheme: 'light' }} />
            {dobError && (
              <div style={{ marginTop: '.4rem', fontSize: '.75rem', color: 'var(--rust)' }}>⚠ {dobError}</div>
            )}
            <div style={{ marginTop: '.35rem', fontSize: '.7rem', color: 'var(--muted)' }}>
              You must be 18 or older to join.
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Password</label>
            <input className="field-input" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-dark"
            style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }}
            disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '1.25rem', textAlign: 'center' }}>
          Already a member?{' '}
          <Link to="/signin" style={{ color: 'var(--ink)', fontWeight: 500, textDecoration: 'underline' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
