'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
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
        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Saving…' : 'Save password'}
        </button>
        {error && (
          <p style={{ color: 'var(--alert-red)', marginTop: 12, fontSize: '0.9rem' }}>{error}</p>
        )}
      </form>
    </main>
  );
}
