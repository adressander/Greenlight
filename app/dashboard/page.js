'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { daysUntil, statusFor, progressPercent, CYCLE_DAYS, KIND_LABELS } from '../../lib/deadlines';
import Link from 'next/link';
import AddTruckForm from './AddTruckForm';
import { TruckMark, icons, KIND_ICONS } from '../components/icons';

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
      <main style={{ padding: 60, textAlign: 'center', color: 'var(--gl-text-muted)' }}>
        Loading your dashboard…
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TruckMark size={26} />
          <span className="display" style={{ fontSize: '1.3rem', color: 'var(--gl-green)' }}>Greenlight</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/dashboard/settings"><button className="gl-btn-ghost">Settings</button></Link>
          <button className="gl-btn-ghost" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 18px' }}>
        <h1 className="display" style={{ fontSize: '1.4rem' }}>Your trucks</h1>
        <button className="gl-btn-primary" onClick={() => setShowAddTruck(true)}>+ Add a truck</button>
      </div>

      {trucks.length === 0 && !showAddTruck && (
        <div className="gl-panel" style={{ textAlign: 'center', color: 'var(--gl-text-muted)' }}>
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

  const sortedDeadlines = truck.deadlines.slice().sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date));

  return (
    <div className="gl-card" style={{ marginBottom: 20 }}>
      <div className="gl-card-header">
        <div className="gl-icon-badge-lg">
          <TruckMark size={20} />
        </div>
        <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--gl-text-muted)', fontWeight: 600 }}>
          {truck.nickname}{truck.mc_number ? ` — MC ${truck.mc_number}` : ''}
        </div>
      </div>

      {sortedDeadlines.map((d, i) => {
        const days = daysUntil(d.due_date);
        const status = statusFor(days);
        return (
          <DeadlineRow
            key={d.id}
            label={KIND_LABELS[d.kind]}
            daysLeft={days}
            icon={icons[KIND_ICONS[d.kind]]}
            status={status}
            cycleDays={CYCLE_DAYS[d.kind]}
            isFirst={i === 0}
            onRenew={(newDate) => onMarkRenewed(d.id, newDate)}
          />
        );
      })}

      <div style={{ padding: '0 30px 24px' }}>
        {missingKinds.length > 0 && (
          <MissingKindAdder truckId={truck.id} kinds={missingKinds} onAdded={() => window.location.reload()} />
        )}
      </div>
    </div>
  );
}

function DeadlineRow({ label, daysLeft, icon, status, cycleDays, isFirst, onRenew }) {
  const [editing, setEditing] = useState(false);
  const [newDate, setNewDate] = useState('');
  const color = `var(--gl-${status})`;
  const tint = `var(--gl-${status}-tint)`;
  const pct = progressPercent(daysLeft, cycleDays);

  return (
    <div
      style={{
        padding: '12px 30px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderTop: isFirst ? 'none' : '1.5px dashed var(--gl-card-border)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: '#fff',
          border: `1.5px solid ${tint}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color,
        }}
      >
        {icon(color)}
      </div>
      <div style={{ flexGrow: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{label}</span>
          {!editing && (
            <span style={{ fontWeight: 700, fontSize: 13, color }}>
              {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
            </span>
          )}
        </div>
        {editing ? (
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            style={{ width: 170, marginTop: 8 }}
          />
        ) : (
          <div style={{ height: 6, borderRadius: 999, background: '#E9F5EC', marginTop: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
          </div>
        )}
      </div>
      {editing ? (
        <button
          className="gl-btn-mini"
          onClick={() => {
            if (newDate) {
              onRenew(newDate);
              setEditing(false);
            }
          }}
        >
          Save
        </button>
      ) : (
        <button className="gl-btn-mini" onClick={() => setEditing(true)}>Mark renewed</button>
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
      <button className="gl-btn-ghost" onClick={() => setOpen(true)}>
        + Track another deadline
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <select value={kind} onChange={(e) => setKind(e.target.value)}>
        {kinds.map((k) => (
          <option key={k} value={k}>{KIND_LABELS[k]}</option>
        ))}
      </select>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 160 }} />
      <button className="gl-btn-primary" onClick={handleAdd}>Add</button>
    </div>
  );
}
