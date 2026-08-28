import { describe, expect, it } from 'vitest';
import { filterObservations, formatDuration, severityLabel, summarize, toCsv } from '../src/domain';
import type { Observation } from '../src/types';

const entry = (id: string, occurredAt: string, severity: number, symptom = 'Headache'): Observation => ({
  id,
  occurredAt,
  severity,
  symptom,
  durationMinutes: 45,
  context: id === '2' ? 'After lunch, while walking' : '',
  createdAt: occurredAt,
  updatedAt: occurredAt
});

describe('observation domain', () => {
  it('labels severity without implying a diagnosis', () => {
    expect(severityLabel(2)).toBe('Mild');
    expect(severityLabel(5)).toBe('Moderate');
    expect(severityLabel(9)).toBe('High');
  });

  it('formats useful durations', () => {
    expect(formatDuration(25)).toBe('25 min');
    expect(formatDuration(120)).toBe('2 hr');
    expect(formatDuration(135)).toBe('2 hr 15 min');
  });

  it('filters inclusively by date and searches context', () => {
    const entries = [entry('1', '2026-08-20T08:00:00.000Z', 3), entry('2', '2026-08-23T12:00:00.000Z', 7, 'Cramping')];
    expect(filterObservations(entries, { from: '2026-08-21', to: '2026-08-24', query: 'lunch' })).toEqual([entries[1]]);
  });

  it('summarizes counts and a factual trend', () => {
    const summary = summarize([
      entry('1', '2026-08-20T08:00:00.000Z', 2),
      entry('2', '2026-08-21T08:00:00.000Z', 4),
      entry('3', '2026-08-22T08:00:00.000Z', 8),
      entry('4', '2026-08-23T08:00:00.000Z', 9)
    ]);
    expect(summary).toMatchObject({ count: 4, days: 4, averageSeverity: 5.8, trend: 'rose', totalDuration: 180 });
  });

  it('escapes quotes in complete CSV output', () => {
    const csv = toCsv([{ ...entry('1', '2026-08-20T08:00:00.000Z', 4), context: 'After "late" lunch' }]);
    expect(csv).toContain('"After ""late"" lunch"');
    expect(csv.split('\r\n')).toHaveLength(2);
  });
});
