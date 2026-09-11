'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data.session) {
      // Email confirmation is off — already logged in.
      router.push('/dashboard');
    } else {
      setMessage('Account created. Check your email for a confirmation link, then log in below.');
      setMode('login');
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a link to set your password.');
    }
  }

  const titles = {
    login: 'Log in',
    signup: 'Create your account',
    forgot: 'Reset your password',
  };

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '90px 24px' }}>
      <div className="display" style={{ fontSize: '1.4rem', marginBottom: 8 }}>
        Greenlight
      </div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 24 }}>{titles[mode]}</h1>

      {message && (
        <p style={{ color: 'var(--signal-green-bright)', marginBottom: 16, fontSize: '0.9rem' }}>{message}</p>
      )}

      <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgotPassword}>
        <label htmlFor="email" style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--paper-dim)' }}>
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

        {mode !== 'forgot' && (
          <>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--paper-dim)' }}>
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
          </>
        )}

        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginBottom: 16 }}>
          {loading
            ? 'Please wait…'
            : mode === 'login'
            ? 'Log in'
            : mode === 'signup'
            ? 'Create account'
            : 'Send reset link'}
        </button>

        {error && (
          <p style={{ color: 'var(--alert-red)', marginBottom: 16, fontSize: '0.9rem' }}>{error}</p>
        )}
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
        {mode === 'login' && (
          <>
            <button className="btn-secondary" type="button" onClick={() => { setMode('signup'); setError(null); setMessage(null); }}>
              Need an account? Sign up
            </button>
            <button className="btn-secondary" type="button" onClick={() => { setMode('forgot'); setError(null); setMessage(null); }}>
              Forgot password?
            </button>
          </>
        )}
        {mode !== 'login' && (
          <button className="btn-secondary" type="button" onClick={() => { setMode('login'); setError(null); setMessage(null); }}>
            Back to log in
          </button>
        )}
      </div>
    </main>
  );
}
