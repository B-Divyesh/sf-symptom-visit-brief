export interface Observation {
  id: string;
  occurredAt: string;
  symptom: string;
  severity: number;
  durationMinutes: number;
  context: string;
  photoDataUrl?: string;
  photoName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  key: 'app';
  presets: string[];
  displayName: string;
  briefTitle: string;
}

export interface DateFilter {
  from: string;
  to: string;
  query: string;
}

export interface Summary {
  count: number;
  days: number;
  averageSeverity: number;
  totalDuration: number;
  trend: 'rose' | 'fell' | 'steady' | 'not-enough-data';
  photoCount: number;
}
