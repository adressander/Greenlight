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
