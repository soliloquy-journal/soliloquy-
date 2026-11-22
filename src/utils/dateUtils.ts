export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatMonthYear(year: number, monthIndex: number): string {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateRange(startKey: string, endKey: string): string {
  const s = fromDateKey(startKey);
  const e = fromDateKey(endKey);
  const sStr = s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const eStr = e.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${sStr} – ${eStr}`;
}

export function getLast7DaysKeys(referenceDate = new Date()): { dateKey: string; dayShort: string; dayNum: string }[] {
  const result: { dateKey: string; dayShort: string; dayNum: string }[] = [];
  // Build Monday -> Sunday week or rolling 7 days ending today?
  // Screenshot shows Mo Tu We Th Fr Sa Su with Su = Nov 22 (Today) — rolling 7 days ending today!
  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
    result.push({
      dateKey: toDateKey(d),
      dayShort,
      dayNum: String(d.getDate()),
    });
  }
  return result;
}

export function getCalendarGrid(year: number, monthIndex: number): (string | null)[] {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  // Monday-first grid (0 = Mon ... 6 = Sun)
  const jsDay = firstDay.getDay();
  const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;
  const cells: (string | null)[] = [];
  for (let i = 0; i < mondayOffset; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(toDateKey(new Date(year, monthIndex, d)));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function formatRelativeSaved(iso: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 15) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
