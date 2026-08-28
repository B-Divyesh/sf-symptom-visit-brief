import type { DateFilter, Observation, Summary } from './types';

export const severityLabel = (value: number): string => {
  if (value <= 3) return 'Mild';
  if (value <= 6) return 'Moderate';
  return 'High';
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

export const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso));

export const localDate = (date = new Date()): string => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const localTime = (date = new Date()): string =>
  date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export const filterObservations = (
  observations: Observation[],
  filter: DateFilter
): Observation[] => {
  const query = filter.query.trim().toLocaleLowerCase();
  return observations
    .filter((entry) => {
      const date = entry.occurredAt.slice(0, 10);
      return (
        (!filter.from || date >= filter.from) &&
        (!filter.to || date <= filter.to) &&
        (!query || `${entry.symptom} ${entry.context}`.toLocaleLowerCase().includes(query))
      );
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
};

export const summarize = (entries: Observation[]): Summary => {
  if (!entries.length) {
    return {
      count: 0,
      days: 0,
      averageSeverity: 0,
      totalDuration: 0,
      trend: 'not-enough-data',
      photoCount: 0
    };
  }
  const chronological = [...entries].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const midpoint = Math.ceil(chronological.length / 2);
  const first = chronological.slice(0, midpoint);
  const second = chronological.slice(midpoint);
  const average = (items: Observation[]) =>
    items.reduce((total, item) => total + item.severity, 0) / items.length;
  let trend: Summary['trend'] = 'not-enough-data';
  if (second.length) {
    const difference = average(second) - average(first);
    trend = Math.abs(difference) < 0.5 ? 'steady' : difference > 0 ? 'rose' : 'fell';
  }
  return {
    count: entries.length,
    days: new Set(entries.map((entry) => entry.occurredAt.slice(0, 10))).size,
    averageSeverity: Number(average(entries).toFixed(1)),
    totalDuration: entries.reduce((total, entry) => total + entry.durationMinutes, 0),
    trend,
    photoCount: entries.filter((entry) => entry.photoDataUrl).length
  };
};

const csvCell = (value: string | number): string => `"${String(value).replaceAll('"', '""')}"`;

export const toCsv = (entries: Observation[]): string => {
  const rows = [
    ['Date and time', 'Symptom', 'Severity (1–10)', 'Duration (minutes)', 'Context', 'Photo attached'],
    ...[...entries]
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
      .map((entry) => [
        entry.occurredAt,
        entry.symptom,
        entry.severity,
        entry.durationMinutes,
        entry.context,
        entry.photoDataUrl ? 'Yes' : 'No'
      ])
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
};

export const trendSentence = (summary: Summary): string => {
  if (summary.trend === 'not-enough-data') return 'Add at least two observations to compare the period.';
  return `Average severity ${summary.trend} between the first and second half of this period.`;
};

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character] ?? character);
