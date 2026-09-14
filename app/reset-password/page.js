'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // The reset-password email links here directly (not through the shared
  // auth callback route) with a one-time ?code=. Exchanging it here, in the
  // same browser client that originally requested the reset, keeps the PKCE
  // code_verifier and the resulting session in the same place (localStorage).
  useEffect(() => {
    (async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      if (!code) {
        setError('This link is invalid or has expired. Request a new one from the login page.');
        setStatus('error');
        return;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setError('This link is invalid or has expired. Request a new one from the login page.');
        setStatus('error');
      } else {
        setStatus('ready');
      }
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '90px 24px' }}>
      <div className="display" style={{ fontSize: '1.4rem', marginBottom: 8 }}>
        Greenlight
      </div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 24 }}>Set a new password</h1>

      {status === 'loading' && (
        <p style={{ color: 'var(--paper-dim)' }}>Verifying your link…</p>
      )}

      {status === 'error' && (
        <p style={{ color: 'var(--alert-red)' }}>{error}</p>
      )}

      {status === 'ready' && (
        <form onSubmit={handleSubmit}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--paper-dim)' }}>
            New password
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
          <button className="btn-primary" type="submit" disabled={saving} style={{ width: '100%' }}>
            {saving ? 'Saving…' : 'Save password'}
          </button>
          {error && (
            <p style={{ color: 'var(--alert-red)', marginTop: 12, fontSize: '0.9rem' }}>{error}</p>
          )}
        </form>
      )}
    </main>
  );
}
