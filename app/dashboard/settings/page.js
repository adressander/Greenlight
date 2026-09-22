'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { ALERT_THRESHOLDS, DAILY_ALERT_THRESHOLD } from '../../../lib/deadlines';
import { TruckMark } from '../../components/icons';

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/login');
      } else {
        setSession(data.session);
        setLoading(false);
      }
    });
  }, [router]);

  if (!session || loading) {
    return (
      <main style={{ padding: 60, textAlign: 'center', color: 'var(--gl-text-muted)' }}>
        Loading settings…
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TruckMark size={26} />
          <span className="display" style={{ fontSize: '1.3rem', color: 'var(--gl-green)' }}>Greenlight</span>
        </div>
        <Link href="/dashboard"><button className="gl-btn-ghost">Back to dashboard</button></Link>
      </div>

      <h1 className="display" style={{ fontSize: '1.4rem', marginBottom: 24 }}>Settings</h1>

      <AccountInfo session={session} />
      <BusinessInfo />
      <PhoneNumbers />
      <ReminderSchedule />
      <Billing />
    </main>
  );
}

function Section({ title, children }) {
  return (
    <div className="gl-panel" style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );
}

function AccountInfo({ session }) {
  return (
    <Section title="Account">
      <div style={{ fontSize: '0.9rem', color: 'var(--gl-text-muted)' }}>Email</div>
      <div className="mono" style={{ marginBottom: 4 }}>{session.user.email}</div>
    </Section>
  );
}

function BusinessInfo() {
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('profiles')
        .select('business_name, business_address, business_phone')
        .eq('id', userData.user.id)
        .single();
      if (data) {
        setBusinessName(data.business_name || '');
        setBusinessAddress(data.business_address || '');
        setBusinessPhone(data.business_phone || '');
      }
      setLoaded(true);
    })();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('profiles').upsert({
      id: userData.user.id,
      business_name: businessName,
      business_address: businessAddress,
      business_phone: businessPhone,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!loaded) return null;

  return (
    <Section title="Business information">
      <form onSubmit={handleSave}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gl-text-muted)', marginBottom: 6 }}>
          Business name
        </label>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Your Fleet LLC"
          style={{ marginBottom: 14 }}
        />
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gl-text-muted)', marginBottom: 6 }}>
          Business address
        </label>
        <input
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          placeholder="123 Freight Way, Dallas, TX"
          style={{ marginBottom: 14 }}
        />
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gl-text-muted)', marginBottom: 6 }}>
          Business phone
        </label>
        <input
          value={businessPhone}
          onChange={(e) => setBusinessPhone(e.target.value)}
          placeholder="+1 555 555 5555"
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="gl-btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--gl-green)' }}>Saved</span>}
        </div>
      </form>
    </Section>
  );
}

function PhoneNumbers() {
  const [phones, setPhones] = useState([]);
  const [newPhone, setNewPhone] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPhones();
  }, []);

  async function loadPhones() {
    const { data } = await supabase
      .from('alert_phones')
      .select('id, phone, label')
      .order('created_at', { ascending: true });
    setPhones(data || []);
    setLoaded(true);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newPhone) return;
    setSaving(true);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('alert_phones').insert({
      user_id: userData.user.id,
      phone: newPhone,
      label: newLabel || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setNewPhone('');
      setNewLabel('');
      loadPhones();
    }
  }

  async function handleRemove(id) {
    await supabase.from('alert_phones').delete().eq('id', id);
    loadPhones();
  }

  if (!loaded) return null;

  return (
    <Section title="Text alert numbers">
      <p style={{ fontSize: '0.85rem', color: 'var(--gl-text-muted)', marginBottom: 14 }}>
        Every number below gets every deadline reminder text.
      </p>

      {phones.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: '1px solid var(--gl-card-border)' }}>
          <span className="mono" style={{ flex: 1 }}>{p.phone}{p.label ? ` — ${p.label}` : ''}</span>
          <button className="gl-btn-ghost" onClick={() => handleRemove(p.id)}>Remove</button>
        </div>
      ))}

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: phones.length > 0 ? 16 : 0 }}>
        <input
          type="tel"
          placeholder="+1 555 555 5555"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          style={{ maxWidth: 200 }}
        />
        <input
          type="text"
          placeholder="Label (optional)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          style={{ maxWidth: 160 }}
        />
        <button className="gl-btn-primary" type="submit" disabled={saving}>
          {saving ? 'Adding…' : '+ Add number'}
        </button>
      </form>
      {error && <p style={{ color: 'var(--gl-coral)', marginTop: 12, fontSize: '0.9rem' }}>{error}</p>}
    </Section>
  );
}

function ReminderSchedule() {
  const [customized, setCustomized] = useState(false);
  const [thresholds, setThresholds] = useState(ALERT_THRESHOLDS.join(', '));
  const [dailyThreshold, setDailyThreshold] = useState(String(DAILY_ALERT_THRESHOLD));
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('profiles')
        .select('alert_thresholds, daily_alert_threshold')
        .eq('id', userData.user.id)
        .single();
      if (data?.alert_thresholds || data?.daily_alert_threshold != null) {
        setCustomized(true);
        if (data.alert_thresholds) setThresholds(data.alert_thresholds);
        if (data.daily_alert_threshold != null) setDailyThreshold(String(data.daily_alert_threshold));
      }
      setLoaded(true);
    })();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError(null);

    if (!customized) {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('profiles').upsert({
        id: userData.user.id,
        alert_thresholds: null,
        daily_alert_threshold: null,
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    const parsedThresholds = thresholds
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    const parsedDaily = Number(dailyThreshold);

    if (parsedThresholds.length === 0) {
      setError('Enter at least one valid number of days, separated by commas.');
      return;
    }
    if (!Number.isFinite(parsedDaily) || parsedDaily < 0) {
      setError('Daily reminder start must be a non-negative number of days.');
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('profiles').upsert({
      id: userData.user.id,
      alert_thresholds: parsedThresholds.join(','),
      daily_alert_threshold: parsedDaily,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!loaded) return null;

  return (
    <Section title="Reminder schedule">
      <p style={{ fontSize: '0.85rem', color: 'var(--gl-text-muted)', marginBottom: 14 }}>
        By default, every account gets a one-time text at{' '}
        <strong>{ALERT_THRESHOLDS.join(', ')} days</strong> before a deadline, then a text{' '}
        <strong>every day starting {DAILY_ALERT_THRESHOLD} days out</strong> (through overdue).
      </p>

      <form onSubmit={handleSave}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={customized}
            onChange={(e) => setCustomized(e.target.checked)}
            style={{ width: 'auto' }}
          />
          Use a custom schedule for this account
        </label>

        {customized && (
          <>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gl-text-muted)', marginBottom: 6 }}>
              One-time alerts at (days before due, comma-separated)
            </label>
            <input
              value={thresholds}
              onChange={(e) => setThresholds(e.target.value)}
              placeholder="90, 60, 30, 15"
              style={{ marginBottom: 14 }}
            />
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gl-text-muted)', marginBottom: 6 }}>
              Start daily reminders at (days before due)
            </label>
            <input
              value={dailyThreshold}
              onChange={(e) => setDailyThreshold(e.target.value)}
              placeholder="5"
              style={{ marginBottom: 16, maxWidth: 120 }}
            />
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="gl-btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--gl-green)' }}>Saved</span>}
        </div>
        {error && <p style={{ color: 'var(--gl-coral)', marginTop: 12, fontSize: '0.9rem' }}>{error}</p>}
      </form>
    </Section>
  );
}

function Billing() {
  return (
    <Section title="Billing">
      <p style={{ fontSize: '0.85rem', color: 'var(--gl-text-muted)' }}>
        Billing isn't set up yet — this app is currently free while in testing.
      </p>
    </Section>
  );
}
