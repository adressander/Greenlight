export const KIND_LABELS = {
  UCR: 'UCR Registration',
  IFTA: 'IFTA Filing',
  IRP: 'IRP Renewal',
  INSURANCE: 'Cargo Insurance',
  MEDICAL: 'DOT Medical Card',
};

export const ALERT_THRESHOLDS = [90, 60, 30, 15];

// From this many days out (inclusive), send a reminder every day the
// cron job runs, instead of only once per ALERT_THRESHOLDS crossing.
export const DAILY_ALERT_THRESHOLD = 5;

// Typical renewal cycle length per deadline type, used to scale the
// dashboard's progress bar so e.g. a quarterly IFTA filing and an annual
// IRP renewal don't look equally "urgent" at the same day count.
export const CYCLE_DAYS = {
  UCR: 365,      // annual
  MEDICAL: 730,  // biennial
  IFTA: 90,      // quarterly
  IRP: 365,      // annual
  INSURANCE: 365, // annual
};

export function daysUntil(dueDateStr) {
  const due = new Date(dueDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

export function statusFor(days) {
  if (days <= 7) return 'coral';
  if (days <= 30) return 'amber';
  return 'green';
}

// Progress bar fills as the deadline approaches, scaled to the item's
// actual renewal cycle (falls back to a flat 90-day window if unknown).
export function progressPercent(daysLeft, cycleDays = 90) {
  const clamped = Math.min(Math.max(daysLeft, 0), cycleDays);
  return Math.round(100 - (clamped / cycleDays) * 100);
}

// An account's profile row can override the default reminder schedule via
// alert_thresholds ("90,60,30,15") and daily_alert_threshold. Null/empty
// falls back to the app defaults above.
export function resolveAlertThresholds(profile) {
  const raw = profile?.alert_thresholds;
  if (raw) {
    const parsed = raw
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (parsed.length > 0) {
      return [...new Set(parsed)].sort((a, b) => b - a);
    }
  }
  return ALERT_THRESHOLDS;
}

export function resolveDailyAlertThreshold(profile) {
  const raw = profile?.daily_alert_threshold;
  return Number.isFinite(raw) ? raw : DAILY_ALERT_THRESHOLD;
}
