/**
 * Server timestamps for admin screens.
 *
 * The backend stamps rows with the server clock and no zone, in a few shapes
 * ("10 12, 2026 03:43:54", "2026-10-12 03:43:54", "10 12, 2026", ISO). The API
 * container runs on UTC (docker-compose sets no TZ), so a zoneless stamp is read
 * as UTC and shown in the business zone with its abbreviation, e.g.
 * "11 Oct 2026, 9:43 PM MDT". Unknown shapes are shown unchanged.
 */
export const ADMIN_TIME_ZONE = 'America/Edmonton';

const pad = value => String(value).padStart(2, '0');

const toDate = value => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : { date: value, dateOnly: false };
  if (Array.isArray(value)) {
    // Jackson's default LocalDateTime shape: [yyyy, M, d, H, m, s].
    const [y, mo, d, h = 0, mi = 0, s = 0] = value;
    return { date: new Date(Date.UTC(y, mo - 1, d, h, mi, s)), dateOnly: value.length <= 3 };
  }
  const text = String(value).trim();
  let match = /^(\d{2}) (\d{2}), (\d{4})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(text);
  if (match) {
    const [, mo, d, y, h, mi, s] = match;
    return { date: new Date(`${y}-${mo}-${d}T${h || '00'}:${mi || '00'}:${s || '00'}Z`), dateOnly: h === undefined };
  }
  match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(text);
  if (match) {
    const [, y, mo, d, h, mi, s, fraction = '', zone] = match;
    if (h === undefined) return { date: new Date(`${y}-${mo}-${d}T00:00:00Z`), dateOnly: true };
    return { date: new Date(`${y}-${mo}-${d}T${h}:${mi}:${s || '00'}${fraction}${zone || 'Z'}`), dateOnly: false };
  }
  return null;
};

/** "11 Oct 2026, 9:43 PM MDT"; date-only values become "12 Oct 2026". */
export const formatAdminTime = value => {
  const parsed = toDate(value);
  if (!parsed || Number.isNaN(parsed.date.getTime())) return value ? String(value) : '-';
  if (parsed.dateOnly) {
    return parsed.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ADMIN_TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short',
  }).formatToParts(parsed.date).reduce((all, part) => ({ ...all, [part.type]: part.value }), {});
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ${parts.dayPeriod} ${parts.timeZoneName}`;
};

/** The calendar day (yyyy-MM-dd, business zone) a timestamp falls on, for date filters. */
export const adminDay = value => {
  const parsed = toDate(value);
  if (!parsed || Number.isNaN(parsed.date.getTime())) return '';
  if (parsed.dateOnly) return parsed.date.toISOString().slice(0, 10);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: ADMIN_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(parsed.date).reduce((all, part) => ({ ...all, [part.type]: part.value }), {});
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

export const formatMoney = (value, currency = 'CAD') => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString('en-CA', { style: 'currency', currency });
};

/** Digits only, so "(639) 384-0942" and "6393840942" match each other in search. */
export const digitsOf = value => String(value || '').replace(/\D/g, '');
