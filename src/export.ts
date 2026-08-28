import type { Observation, Summary } from './types';
import { formatDuration, trendSentence } from './domain';

interface BriefOptions {
  entries: Observation[];
  summary: Summary;
  from: string;
  to: string;
  displayName: string;
  briefTitle: string;
}

export const exportPdf = async (options: BriefOptions): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const margin = 44;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const title = options.briefTitle.trim() || 'Symptom visit brief';
  const period = options.from || options.to
    ? `${options.from || 'First record'} to ${options.to || 'Most recent'}`
    : 'All recorded observations';

  pdf.setTextColor(24, 37, 34);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(21);
  pdf.text(title, margin, 54);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(83, 97, 93);
  pdf.text(`${options.displayName ? `${options.displayName} · ` : ''}${period}`, margin, 73);
  pdf.text('Prepared from private, self-recorded observations. Not a diagnosis.', margin, 89);

  pdf.setDrawColor(0, 107, 99);
  pdf.setLineWidth(2);
  pdf.line(margin, 103, margin + width, 103);
  pdf.setTextColor(24, 37, 34);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(`${options.summary.count} observations`, margin, 127);
  pdf.text(`${options.summary.days} days`, margin + 130, 127);
  pdf.text(`${options.summary.averageSeverity || '—'} / 10 average severity`, margin + 225, 127);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text(trendSentence(options.summary), margin, 145);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('DATE & TIME', margin, 174);
  pdf.text('OBSERVATION', margin + 116, 174);
  pdf.text('SEVERITY', margin + 300, 174);
  pdf.text('DURATION', margin + 375, 174);
  pdf.setDrawColor(215, 208, 194);
  pdf.setLineWidth(0.6);
  pdf.line(margin, 181, margin + width, 181);

  let y = 201;
  const rows = [...options.entries].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const maximumRows = 12;
  for (const entry of rows.slice(0, maximumRows)) {
    const date = new Date(entry.occurredAt);
    const dateText = `${date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })} ${date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}`;
    const symptomLines = pdf.splitTextToSize(entry.symptom, 172).slice(0, 2) as string[];
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(24, 37, 34);
    pdf.text(dateText, margin, y);
    pdf.setFont('helvetica', 'bold');
    pdf.text(symptomLines, margin + 116, y);
    pdf.text(`${entry.severity} / 10`, margin + 300, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatDuration(entry.durationMinutes), margin + 375, y);
    if (entry.context) {
      const context = pdf.splitTextToSize(entry.context, width - 116).slice(0, 2) as string[];
      pdf.setTextColor(83, 97, 93);
      pdf.text(context, margin + 116, y + 13);
    }
    if (entry.photoDataUrl) pdf.text('Photo kept in local record', margin + 375, y + 13);
    y += 47;
    pdf.setDrawColor(226, 221, 210);
    pdf.line(margin, y - 13, margin + width, y - 13);
  }
  if (rows.length > maximumRows) {
    pdf.setTextColor(83, 97, 93);
    pdf.setFontSize(9);
    pdf.text(`${rows.length - maximumRows} additional observations are in the companion CSV.`, margin, y + 5);
  }
  pdf.setTextColor(83, 97, 93);
  pdf.setFontSize(8.5);
  pdf.text('Generated locally by Symptom Visit Brief · symptom-visit-brief.sociobot.in', margin, 808);
  pdf.save(`symptom-visit-brief-${options.from || 'all'}-${options.to || 'records'}.pdf`);
};
