export const KIND_LABELS = {
  UCR: 'UCR Registration',
  IFTA: 'IFTA Filing',
  IRP: 'IRP Renewal',
  INSURANCE: 'Cargo Insurance',
  MEDICAL: 'DOT Medical Card',
};

export const ALERT_THRESHOLDS = [90, 60, 30, 15];

export function daysUntil(dueDateStr) {
  const due = new Date(dueDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

export function statusFor(days) {
  if (days <= 3) return 'red';
  if (days <= 21) return 'yellow';
  return 'green';
}
