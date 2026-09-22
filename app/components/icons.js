export function TruckMark({ size = 26, color = 'var(--gl-green)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M2 8h11v7H2z" />
      <path d="M13 11h4l3 3v1h-7z" />
      <circle cx="6" cy="17" r="2" fill="var(--gl-bg)" stroke={color} strokeWidth="1.6" />
      <circle cx="17" cy="17" r="2" fill="var(--gl-bg)" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

// One icon per deadline type, rounded stroke to match the friendly
// direction. Swap `color` per row based on urgency.
export const icons = {
  registration: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M10 12h6M10 16h6" />
    </svg>
  ),
  idCard: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="3" /><circle cx="9" cy="12" r="1.8" />
      <path d="M6.5 16c0-1.4 1-2.4 2.5-2.4S11.5 14.6 11.5 16M14.5 10.5h4M14.5 14h4" />
    </svg>
  ),
  filing: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18l-2.2-1.4L14 21l-1.8-1.4L10.4 21l-1.8-1.4L6 21z" /><path d="M9 8.5h6M9 12.5h6" />
    </svg>
  ),
  plate: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6.5" width="18" height="11" rx="3" /><path d="M7 10h2.5M7 14h2.5M12.5 10h4.5M12.5 14h3" />
    </svg>
  ),
  shield: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 5-3.3 7.8-7 9-3.7-1.2-7-4-7-9V6z" />
    </svg>
  ),
};

// Maps each deadline `kind` (from lib/deadlines.js) to its icon. Pick the
// closest visual match here if new deadline kinds are added later, rather
// than inventing a new icon style.
export const KIND_ICONS = {
  UCR: 'registration',
  MEDICAL: 'idCard',
  IFTA: 'filing',
  IRP: 'plate',
  INSURANCE: 'shield',
};
