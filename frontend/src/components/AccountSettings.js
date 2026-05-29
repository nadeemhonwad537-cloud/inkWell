import React, { useState } from 'react';
import { authAPI } from '../api';
import { useToast } from '../context/ToastContext';

// ── small reusable input ──────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div style={{ marginBottom: '.9rem' }}>
      <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '.35rem' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="field-input"
        style={{ fontSize: '.9rem' }}
      />
    </div>
  );
}

// ── tab button ───────────────────────────────────────────────────────
function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '.5rem 1rem', fontSize: '.72rem', fontWeight: 600,
      letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer',
      border: 'none', borderBottom: active ? '2px solid var(--rust)' : '2px solid transparent',
      background: 'transparent', color: active ? 'var(--rust)' : 'var(--muted)',
      transition: 'all .15s',
    }}>
      {children}
    </button>
  );
}

export default function AccountSettings({ onClose, onUsernameChanged }) {
  const { toast } = useToast();
  const [tab, setTab] = useState('username'); // 'username' | 'password'

  // ── username change state ─────────────────────────────────────────
  const [newName, setNewName]           = useState('');
  const [namePassword, setNamePassword] = useState('');
  const [nameSaving, setNameSaving]     = useState(false);

  // ── password change state ─────────────────────────────────────────
  const [pwMode, setPwMode]         = useState('current'); // 'current' | 'otp'
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwSaving, setPwSaving]     = useState(false);

  // ── OTP state ─────────────────────────────────────────────────────
  const [otpEmail, setOtpEmail]     = useState('');
  const [otpCode, setOtpCode]       = useState('');
  const [otpNewPw, setOtpNewPw]     = useState('');
  const [otpConfirm, setOtpConfirm] = useState('');
  const [otpSent, setOtpSent]       = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSaving, setOtpSaving]   = useState(false);

  // ── handlers ─────────────────────────────────────────────────────

  async function handleUsernameChange(e) {
    e.preventDefault();
    if (!newName.trim()) return toast('Enter a new username', 'error');
    if (!namePassword)   return toast('Enter your current password', 'error');
    setNameSaving(true);
    try {
      const { data } = await authAPI.changeUsername({ newName: newName.trim(), currentPassword: namePassword });
      toast('Username updated!', 'success');
      if (onUsernameChanged) onUsernameChanged(data.user);
      onClose();
    } catch (err) {
      toast(err.response?.data?.error || 'Could not update username', 'error');
    } finally { setNameSaving(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPw !== confirmPw) return toast('Passwords do not match', 'error');
    if (newPw.length < 6)   return toast('Password must be at least 6 characters', 'error');
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: currentPw, newPassword: newPw });
      toast('Password updated!', 'success');
      onClose();
    } catch (err) {
      toast(err.response?.data?.error || 'Could not update password', 'error');
    } finally { setPwSaving(false); }
  }

  async function handleSendOTP(e) {
    e.preventDefault();
    if (!otpEmail) return toast('Enter your email', 'error');
    setOtpSending(true);
    try {
      await authAPI.sendOTP(otpEmail);
      setOtpSent(true);
      toast('OTP sent! Check your email.', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Could not send OTP', 'error');
    } finally { setOtpSending(false); }
  }

  async function handleOTPReset(e) {
    e.preventDefault();
    if (!otpCode)                    return toast('Enter the OTP code', 'error');
    if (otpNewPw !== otpConfirm)     return toast('Passwords do not match', 'error');
    if (otpNewPw.length < 6)         return toast('Password must be at least 6 characters', 'error');
    setOtpSaving(true);
    try {
      await authAPI.verifyOTP({ email: otpEmail, code: otpCode, newPassword: otpNewPw });
      toast('Password reset! Please sign in again.', 'success');
      onClose();
    } catch (err) {
      toast(err.response?.data?.error || 'Invalid or expired OTP', 'error');
    } finally { setOtpSaving(false); }
  }

  // ── render ────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--white)', width: '100%', maxWidth: 440,
        border: '1px solid var(--border)', padding: '2rem',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.1rem', color: 'var(--muted)',
        }}>✕</button>

        <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.3rem', margin: '0 0 1.25rem' }}>
          Account Settings
        </h3>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <Tab active={tab === 'username'} onClick={() => setTab('username')}>Change Username</Tab>
          <Tab active={tab === 'password'} onClick={() => setTab('password')}>Change Password</Tab>
        </div>

        {/* ── USERNAME TAB ── */}
        {tab === 'username' && (
          <form onSubmit={handleUsernameChange}>
            <Field label="New Username" value={newName} onChange={setNewName} placeholder="Enter new username" autoComplete="username" />
            <Field label="Current Password" type="password" value={namePassword} onChange={setNamePassword} placeholder="Confirm with your password" autoComplete="current-password" />
            <button type="submit" className="btn btn-dark btn-sm" style={{ width: '100%', marginTop: '.5rem' }} disabled={nameSaving}>
              {nameSaving ? 'Saving…' : 'Update Username'}
            </button>
          </form>
        )}

        {/* ── PASSWORD TAB ── */}
        {tab === 'password' && (
          <>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
              <button onClick={() => setPwMode('current')} style={{
                flex: 1, padding: '.4rem', fontSize: '.7rem', fontWeight: 600,
                letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer',
                border: '1px solid var(--border)',
                background: pwMode === 'current' ? 'var(--ink)' : 'transparent',
                color: pwMode === 'current' ? '#fff' : 'var(--muted)',
              }}>I know my password</button>
              <button onClick={() => setPwMode('otp')} style={{
                flex: 1, padding: '.4rem', fontSize: '.7rem', fontWeight: 600,
                letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer',
                border: '1px solid var(--border)',
                background: pwMode === 'otp' ? 'var(--ink)' : 'transparent',
                color: pwMode === 'otp' ? '#fff' : 'var(--muted)',
              }}>Forgot password</button>
            </div>

            {/* Current password flow */}
            {pwMode === 'current' && (
              <form onSubmit={handlePasswordChange}>
                <Field label="Current Password" type="password" value={currentPw} onChange={setCurrentPw} placeholder="Your current password" autoComplete="current-password" />
                <Field label="New Password" type="password" value={newPw} onChange={setNewPw} placeholder="At least 6 characters" autoComplete="new-password" />
                <Field label="Confirm New Password" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" autoComplete="new-password" />
                <button type="submit" className="btn btn-dark btn-sm" style={{ width: '100%', marginTop: '.5rem' }} disabled={pwSaving}>
                  {pwSaving ? 'Saving…' : 'Update Password'}
                </button>
              </form>
            )}

            {/* OTP / forgot password flow */}
            {pwMode === 'otp' && (
              <>
                {!otpSent ? (
                  <form onSubmit={handleSendOTP}>
                    <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
                      Enter the email address on your account and we'll send you a 6-digit code.
                    </p>
                    <Field label="Email Address" type="email" value={otpEmail} onChange={setOtpEmail} placeholder="your@email.com" autoComplete="email" />
                    <button type="submit" className="btn btn-dark btn-sm" style={{ width: '100%', marginTop: '.5rem' }} disabled={otpSending}>
                      {otpSending ? 'Sending…' : 'Send OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOTPReset}>
                    <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
                      A 6-digit code was sent to <strong>{otpEmail}</strong>. Enter it below along with your new password.
                    </p>
                    <Field label="OTP Code" value={otpCode} onChange={setOtpCode} placeholder="6-digit code" autoComplete="one-time-code" />
                    <Field label="New Password" type="password" value={otpNewPw} onChange={setOtpNewPw} placeholder="At least 6 characters" autoComplete="new-password" />
                    <Field label="Confirm New Password" type="password" value={otpConfirm} onChange={setOtpConfirm} placeholder="Repeat new password" autoComplete="new-password" />
                    <button type="submit" className="btn btn-dark btn-sm" style={{ width: '100%', marginTop: '.5rem' }} disabled={otpSaving}>
                      {otpSaving ? 'Resetting…' : 'Reset Password'}
                    </button>
                    <button type="button" onClick={() => setOtpSent(false)}
                      style={{ width: '100%', marginTop: '.5rem', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                      Use a different email
                    </button>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
