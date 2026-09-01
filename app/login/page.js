'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '90px 24px' }}>
      <div className="display" style={{ fontSize: '1.4rem', marginBottom: 8 }}>
        Greenlight
      </div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 24 }}>
        {sent ? 'Check your email' : 'Log in or sign up'}
      </h1>

      {sent ? (
        <p style={{ color: 'var(--paper-dim)' }}>
          We sent a login link to <strong>{email}</strong>. Open it on this
          device to get into your dashboard — no password needed.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
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
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Sending link…' : 'Send me a login link'}
          </button>
          {error && (
            <p style={{ color: 'var(--alert-red)', marginTop: 12, fontSize: '0.9rem' }}>{error}</p>
          )}
        </form>
      )}
    </main>
  );
}
