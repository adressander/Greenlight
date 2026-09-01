'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SmsSettings() {
  const [phone, setPhone] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('profiles')
        .select('phone, sms_opt_in')
        .eq('id', userData.user.id)
        .single();
      if (data) {
        setPhone(data.phone || '');
        setOptIn(data.sms_opt_in || false);
      }
      setLoaded(true);
    })();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('profiles').upsert({
      id: userData.user.id,
      phone,
      sms_opt_in: optIn,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!loaded) return null;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: '1rem' }}>Text alerts</h2>
        {saved && <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--signal-green-bright)' }}>Saved</span>}
      </div>
      <form onSubmit={handleSave} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="tel"
          placeholder="+1 555 555 5555"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: 'var(--paper-dim)' }}>
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            style={{ width: 'auto' }}
          />
          Text me before a deadline
        </label>
        <button className="btn-secondary" type="submit">Save</button>
      </form>
    </div>
  );
}
