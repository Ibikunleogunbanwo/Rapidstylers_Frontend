import { formatAdminTime, adminDay, formatMoney } from './adminFormat';
it('formats the server stamp shapes with a month name and the business time zone', () => {
  expect(formatAdminTime('10 12, 2026 03:43:54')).toBe('11 Oct 2026, 9:43 PM MDT');
  expect(formatAdminTime('2026-10-12 15:05:00')).toBe('12 Oct 2026, 9:05 AM MDT');
  expect(formatAdminTime('2026-12-01T18:00:00Z')).toBe('1 Dec 2026, 11:00 AM MST');
  expect(formatAdminTime('10 12, 2026')).toBe('12 Oct 2026');
  expect(formatAdminTime('2026-10-12')).toBe('12 Oct 2026');
});
it('leaves unknown values readable', () => {
  expect(formatAdminTime(null)).toBe('-');
  expect(formatAdminTime('yesterday')).toBe('yesterday');
});
it('puts a stamp on its business-zone day', () => {
  expect(adminDay('2026-10-12 02:36:57')).toBe('2026-10-11');
  expect(adminDay('10 12, 2026')).toBe('2026-10-12');
});
it('formats Canadian dollars', () => {
  expect(formatMoney('80')).toBe('$80.00');
  expect(formatMoney(null)).toBe('-');
});
