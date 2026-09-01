'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { daysUntil, statusFor, KIND_LABELS } from '../../lib/deadlines';
import AddTruckForm from './AddTruckForm';
import SmsSettings from './SmsSettings';

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTruck, setShowAddTruck] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/login');
      } else {
        setSession(data.session);
      }
    });
  }, [router]);

  useEffect(() => {
    if (session) loadTrucks();
  }, [session]);

  async function loadTrucks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('trucks')
      .select('id, nickname, mc_number, deadlines(id, kind, due_date)')
      .order('created_at', { ascending: true });
    if (!error) setTrucks(data || []);
    setLoading(false);
  }

  async function markRenewed(deadlineId, newDate) {
    await supabase
      .from('deadlines')
      .update({ due_date: newDate, alerted_thresholds: '' })
      .eq('id', deadlineId);
    loadTrucks();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (!session || loading) {
    return (
      <main style={{ padding: 60, textAlign: 'center', color: 'var(--paper-dim)' }}>
        Loading your dashboard…
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
        <div className="display" style={{ fontSize: '1.3rem' }}>Greenlight</div>
        <button className="btn-secondary" onClick={handleSignOut}>Sign out</button>
      </div>

      <SmsSettings />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 18px' }}>
        <h1 style={{ fontSize: '1.4rem' }}>Your trucks</h1>
        <button className="btn-primary" onClick={() => setShowAddTruck(true)}>+ Add a truck</button>
      </div>

      {trucks.length === 0 && !showAddTruck && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--paper-dim)' }}>
          No trucks yet. Add one to start tracking its deadlines.
        </div>
      )}

      {trucks.map((truck) => (
        <TruckCard key={truck.id} truck={truck} onMarkRenewed={markRenewed} onRefresh={loadTrucks} />
      ))}

      {showAddTruck && (
        <AddTruckForm
          onClose={() => setShowAddTruck(false)}
          onCreated={() => {
            setShowAddTruck(false);
            loadTrucks();
          }}
        />
      )}
    </main>
  );
}

function TruckCard({ truck, onMarkRenewed }) {
  const missingKinds = ['UCR', 'IFTA', 'IRP', 'INSURANCE', 'MEDICAL'].filter(
    (k) => !truck.deadlines.some((d) => d.kind === k)
  );

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--steel)', marginBottom: 14 }}>
        {truck.nickname}{truck.mc_number ? ` — MC ${truck.mc_number}` : ''}
      </div>

      {truck.deadlines
        .slice()
        .sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))
        .map((d) => {
          const days = daysUntil(d.due_date);
          const status = statusFor(days);
          return (
            <DeadlineRow
              key={d.id}
              label={KIND_LABELS[d.kind]}
              days={days}
              status={status}
              onRenew={(newDate) => onMarkRenewed(d.id, newDate)}
            />
          );
        })}

      {missingKinds.length > 0 && (
        <MissingKindAdder truckId={truck.id} kinds={missingKinds} onAdded={() => window.location.reload()} />
      )}
    </div>
  );
}

function DeadlineRow({ label, days, status, onRenew }) {
  const [editing, setEditing] = useState(false);
  const [newDate, setNewDate] = useState('');
  const colorVar = status === 'red' ? 'var(--alert-red)' : status === 'yellow' ? 'var(--safety-yellow)' : 'var(--signal-green-bright)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--hairline)' }}>
      <span className={`pip pip-${status}`} />
      <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem' }}>{label}</span>
      {editing ? (
        <>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            style={{ width: 160 }}
          />
          <button
            className="btn-primary"
            onClick={() => {
              if (newDate) {
                onRenew(newDate);
                setEditing(false);
              }
            }}
          >
            Save
          </button>
        </>
      ) : (
        <>
          <span className="mono" style={{ color: colorVar, fontSize: '0.85rem' }}>
            {days < 0 ? `${Math.abs(days)} DAYS OVERDUE` : `${days} DAYS`}
          </span>
          <button className="btn-secondary" onClick={() => setEditing(true)}>Mark renewed</button>
        </>
      )}
    </div>
  );
}

function MissingKindAdder({ truckId, kinds, onAdded }) {
  const [kind, setKind] = useState(kinds[0]);
  const [date, setDate] = useState('');
  const [open, setOpen] = useState(false);

  async function handleAdd() {
    if (!date) return;
    await supabase.from('deadlines').insert({ truck_id: truckId, kind, due_date: date });
    onAdded();
  }

  if (!open) {
    return (
      <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => setOpen(true)}>
        + Track another deadline
      </button>
    );
  }

  return (
    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ padding: 10, background: 'var(--asphalt)', color: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 4 }}>
        {kinds.map((k) => (
          <option key={k} value={k}>{KIND_LABELS[k]}</option>
        ))}
      </select>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 160 }} />
      <button className="btn-primary" onClick={handleAdd}>Add</button>
    </div>
  );
}
