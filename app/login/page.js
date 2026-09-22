'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { TruckMark } from '../components/icons';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'signup-code' | 'forgot-email' | 'forgot-code'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function switchMode(newMode) {
    setMode(newMode);
    setError(null);
    setMessage(null);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data.session) {
      // Email confirmation is off — already logged in.
      router.push('/dashboard');
    } else {
      setMessage(`Sent a 6-digit code to ${email}.`);
      setMode('signup-code');
    }
  }

  // Verify the sign-up code (same reasoning as the reset-password code:
  // avoids a clickable link that some mail providers silently pre-fetch
  // and burn before the user ever opens the email).
  async function handleVerifySignupCode(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
  }

  // Step 1 of password reset: email a one-time code (not a link — links get
  // silently pre-fetched and burned by some mail providers' security
  // scanners before the user ever opens them).
  async function handleRequestCode(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage(`Sent a 6-digit code to ${email}.`);
      setMode('forgot-code');
    }
  }

  // Step 2: verify the code, then set the new password.
  async function handleResetWithCode(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    });
    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      router.push('/dashboard');
    }
  }

  const titles = {
    login: 'Log in',
    signup: 'Create your account',
    'signup-code': 'Enter your code',
    'forgot-email': 'Reset your password',
    'forgot-code': 'Enter your code',
  };

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '90px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <TruckMark size={22} />
        <span className="display" style={{ fontSize: '1.4rem', color: 'var(--gl-green)' }}>Greenlight</span>
      </div>
      <h1 className="display" style={{ fontSize: '1.6rem', marginBottom: 24 }}>{titles[mode]}</h1>

      {message && (
        <p style={{ color: 'var(--gl-green)', marginBottom: 16, fontSize: '0.9rem' }}>{message}</p>
      )}

      {(mode === 'login' || mode === 'signup') && (
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--gl-text-muted)' }}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourfleet.com"
            style={{ marginBottom: 16 }}
          />
          <label htmlFor="password" style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--gl-text-muted)' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            style={{ marginBottom: 16 }}
          />
          <button className="gl-btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginBottom: 16 }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
          {error && (
            <p style={{ color: 'var(--gl-coral)', marginBottom: 16, fontSize: '0.9rem' }}>{error}</p>
          )}
        </form>
      )}

      {mode === 'signup-code' && (
        <form onSubmit={handleVerifySignupCode}>
          <label htmlFor="signupCode" style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--gl-text-muted)' }}>
            6-digit code
          </label>
          <input
            id="signupCode"
            type="text"
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            style={{ marginBottom: 16 }}
          />
          <button className="gl-btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginBottom: 16 }}>
            {loading ? 'Verifying…' : 'Verify and continue'}
          </button>
          {error && (
            <p style={{ color: 'var(--gl-coral)', marginBottom: 16, fontSize: '0.9rem' }}>{error}</p>
          )}
        </form>
      )}

      {mode === 'forgot-email' && (
        <form onSubmit={handleRequestCode}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--gl-text-muted)' }}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourfleet.com"
            style={{ marginBottom: 16 }}
          />
          <button className="gl-btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginBottom: 16 }}>
            {loading ? 'Sending…' : 'Send reset code'}
          </button>
          {error && (
            <p style={{ color: 'var(--gl-coral)', marginBottom: 16, fontSize: '0.9rem' }}>{error}</p>
          )}
        </form>
      )}

      {mode === 'forgot-code' && (
        <form onSubmit={handleResetWithCode}>
          <label htmlFor="code" style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--gl-text-muted)' }}>
            6-digit code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            style={{ marginBottom: 16 }}
          />
          <label htmlFor="newPassword" style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--gl-text-muted)' }}>
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            style={{ marginBottom: 16 }}
          />
          <button className="gl-btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginBottom: 16 }}>
            {loading ? 'Saving…' : 'Set new password'}
          </button>
          {error && (
            <p style={{ color: 'var(--gl-coral)', marginBottom: 16, fontSize: '0.9rem' }}>{error}</p>
          )}
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
        {mode === 'login' && (
          <>
            <button className="gl-btn-ghost" type="button" onClick={() => switchMode('signup')}>
              Need an account? Sign up
            </button>
            <button className="gl-btn-ghost" type="button" onClick={() => switchMode('forgot-email')}>
              Forgot password?
            </button>
          </>
        )}
        {mode !== 'login' && (
          <button className="gl-btn-ghost" type="button" onClick={() => switchMode('login')}>
            Back to log in
          </button>
        )}
      </div>
    </main>
  );
}
