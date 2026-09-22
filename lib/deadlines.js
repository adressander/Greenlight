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

export function daysUntil(dueDateStr) {
  const due = new Date(dueDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

export function statusFor(days) {
  if (days <= 15) return 'red';
  if (days <= 60) return 'yellow';
  return 'green';
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
