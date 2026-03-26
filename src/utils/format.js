export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatKgCo2(value) {
  return `${formatNumber(value, 2)} kg CO₂e`;
}

export function statusTone(status) {
  const value = String(status || '').toLowerCase();
  if (['confirmed', 'ready', 'active', 'reviewed', 'complete', 'auto-mapped confirmed', 'ok'].includes(value)) return 'good';
  if (['provisional', 'needs review', 'preview only', 'warning', 'auto-mapped provisional', 'draft'].includes(value)) return 'warn';
  if (['missing', 'missing factor', 'incomplete', 'blocking error', 'error', 'not configured', 'unit mismatch'].includes(value)) return 'bad';
  return 'info';
}

export function percentage(value) {
  return `${formatNumber(value, 0)}%`;
}
