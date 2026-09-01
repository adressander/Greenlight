'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { KIND_LABELS } from '../../lib/deadlines';

const ALL_KINDS = ['UCR', 'IFTA', 'IRP', 'INSURANCE', 'MEDICAL'];

export default function AddTruckForm({ onClose, onCreated }) {
  const [nickname, setNickname] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [dates, setDates] = useState({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    const { data: truck, error } = await supabase
      .from('trucks')
      .insert({ nickname, mc_number: mcNumber, user_id: userData.user.id })
      .select()
      .single();

    if (!error && truck) {
      const rows = ALL_KINDS.filter((k) => dates[k]).map((k) => ({
        truck_id: truck.id,
        kind: k,
        due_date: dates[k],
      }));
      if (rows.length > 0) {
        await supabase.from('deadlines').insert(rows);
      }
    }

    setSaving(false);
    onCreated();
  }

  return (
    <div className="card" style={{ marginTop: 8 }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: 18 }}>Add a truck</h2>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--paper-dim)', marginBottom: 6 }}>
          Nickname (e.g. "Truck 4471")
        </label>
        <input
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--paper-dim)', marginBottom: 6 }}>
          MC number (optional)
        </label>
        <input
          value={mcNumber}
          onChange={(e) => setMcNumber(e.target.value)}
          style={{ marginBottom: 18 }}
        />

        <div style={{ fontSize: '0.85rem', color: 'var(--paper-dim)', marginBottom: 10 }}>
          Add the dates you already know. You can add the rest later.
        </div>

        {ALL_KINDS.map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ flex: 1, fontSize: '0.9rem' }}>{KIND_LABELS[k]}</span>
            <input
              type="date"
              value={dates[k] || ''}
              onChange={(e) => setDates({ ...dates, [k]: e.target.value })}
              style={{ width: 170 }}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save truck'}
          </button>
          <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
