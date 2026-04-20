import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import jsPDF from 'jspdf';
import SymptomLibrary from './symptom-library';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const DURATIONS = [
  { value: '1-day', label: '1 day' },
  { value: '2-3-days', label: '2–3 days' },
  { value: '4-7-days', label: '4–7 days' },
  { value: '1-2-weeks', label: '1–2 weeks' },
  { value: 'more-than-2-weeks', label: 'More than 2 weeks' },
];

const SEVERITY_LABELS = [
  'Minimal', 'Mild', 'Mild–moderate', 'Moderate', 'Moderate–high',
  'High', 'Severe', 'Very severe', 'Extreme', 'Critical',
];

const ANALYZING_MESSAGES = [
  'Reviewing symptom patterns',
  'Checking urgency signals',
  'Preparing care guidance',
];

const TOTAL_STEPS = 5;

const friendlyError = (msg) => {
  const s = String(msg || '').toLowerCase();
  if (s.includes('free-models-per-day') || s.includes('rate limit exceeded') || s.includes('openrouter'))
    return 'Your free OpenRouter limit has been reached. Please try again later.';
  if (s.includes('timed out'))
    return 'The request timed out. Please try again.';
  return msg || 'Unable to analyze symptoms right now.';
};

// ── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ step, total }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-8 space-y-2">
      <div className="flex justify-between text-xs font-medium text-teal-600 dark:text-teal-300">
        <span>Step {step} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-teal-50 dark:bg-teal-950/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StepHeading({ title, sub }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-teal-700 dark:text-teal-300">{title}</h3>
      {sub && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

function NavButtons({ step, total, canAdvance, loading, onPrev, onNext, onSubmit }) {
  return (
    <div className="mt-8 flex justify-between border-t border-teal-100 pt-6 dark:border-teal-900/40">
      <button
        disabled={step === 1 || loading}
        onClick={onPrev}
        className="rounded-lg border border-teal-200 px-5 py-2.5 text-sm text-teal-700 transition hover:bg-teal-50 disabled:opacity-30 dark:border-teal-900/50 dark:text-teal-300 dark:hover:bg-teal-950/30"
      >
        Previous
      </button>

      {step < total ? (
        <button
          disabled={!canAdvance || loading}
          onClick={onNext}
          className="rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-2.5 text-sm text-white transition hover:from-teal-500 hover:to-emerald-400 disabled:opacity-30"
        >
          Next
        </button>
      ) : (
        <button
          disabled={loading}
          onClick={onSubmit}
          className="rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-2.5 text-sm text-white transition hover:from-teal-500 hover:to-emerald-400 disabled:opacity-30"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Analyzing…
            </span>
          ) : 'Get assessment'}
        </button>
      )}
    </div>
  );
}

function LoadingState({ messageIndex }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 h-6 w-6 animate-spin rounded-full border-2 border-teal-100 border-t-teal-600 dark:border-teal-900/50 dark:border-t-teal-300" />
      <p className="text-sm text-teal-700/70 dark:text-teal-300/80">
        {ANALYZING_MESSAGES[messageIndex]}…
      </p>
    </div>
  );
}

function ReviewCard({ label, value, wide }) {
  return (
    <div className={`rounded-lg bg-teal-50 px-4 py-3 dark:bg-teal-950/20 ${wide ? 'col-span-2' : ''}`}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-teal-700/70 dark:text-teal-300/70">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-200">{value || '—'}</p>
    </div>
  );
}

// ── PDF export ───────────────────────────────────────────────────────────────

function exportToPDF(analysis) {
  if (!analysis?.assessment) return;
  const { assessment: r, source, model } = analysis;
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const footerHeight = 36;

  let y = 56;

  const colors = {
    text: [15, 23, 42],          // slate-900
    muted: [100, 116, 139],      // slate-500
    subtle: [148, 163, 184],     // slate-400
    border: [226, 232, 240],     // slate-200
    softBg: [248, 250, 252],     // slate-50
    primary: [37, 99, 235],      // blue-600
    danger: [220, 38, 38],       // red-600
    success: [22, 163, 74],      // green-600
    warning: [217, 119, 6],      // amber-600
    white: [255, 255, 255],
  };

  const spacing = {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  };

  const setTextColor = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setDrawColor = (rgb) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setFillColor = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);

  const safeText = (value, fallback = 'Not provided') =>
    String(value ?? '').trim() || fallback;

  const safeArray = (value) =>
    Array.isArray(value) && value.length ? value : [];

  const ensureSpace = (neededHeight = 40) => {
    if (y + neededHeight > pageHeight - footerHeight - 24) {
      doc.addPage();
      y = 56;
      drawPageHeader(false);
    }
  };

  const drawDivider = (spaceTop = 0, spaceBottom = spacing.md) => {
    y += spaceTop;
    ensureSpace(10);
    setDrawColor(colors.border);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += spaceBottom;
  };

  const drawPageHeader = (isFirstPage = false) => {
    if (!isFirstPage) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setTextColor(colors.subtle);
      doc.text('Health Assessment Report', margin, 28);
      drawDivider(0, spacing.lg);
    }
  };

  const drawFooter = () => {
    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);

      setDrawColor(colors.border);
      doc.setLineWidth(0.8);
      doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setTextColor(colors.subtle);

      doc.text('Generated by MediScan', margin, pageHeight - 14);
      doc.text(`${page} / ${totalPages}`, pageWidth - margin, pageHeight - 14, {
        align: 'right',
      });
    }
  };

  const drawReportHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    setTextColor(colors.text);
    doc.text('Health Assessment Report', margin, y);

    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setTextColor(colors.muted);

    const generatedOn = new Date().toLocaleString();
    const sourceText = `${source || 'Unknown source'}${model ? ` (${model})` : ''}`;

    doc.text(`Generated: ${generatedOn}`, margin, y);
    doc.text(`Source: ${sourceText}`, pageWidth - margin, y, { align: 'right' });

    y += spacing.lg;
    drawDivider(0, spacing.lg);
  };

  const drawSectionTitle = (title) => {
    ensureSpace(32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    setTextColor(colors.text);
    doc.text(title, margin, y);

    y += spacing.xs;

    setDrawColor(colors.border);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += spacing.md;
  };

  const drawKeyValueRow = (label, value, options = {}) => {
    const { accent = null } = options;
    const labelWidth = 140;
    const valueWidth = contentWidth - labelWidth;
    const valueLines = doc.splitTextToSize(safeText(value), valueWidth);
    const rowHeight = Math.max(18, valueLines.length * 13);

    ensureSpace(rowHeight + 8);

    if (accent) {
      setFillColor(accent);
      doc.roundedRect(margin, y - 10, 3, rowHeight + 6, 2, 2, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setTextColor(colors.muted);
    doc.text(label.toUpperCase(), margin + (accent ? 10 : 0), y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTextColor(colors.text);
    doc.text(valueLines, margin + labelWidth, y);

    y += rowHeight + spacing.sm;
  };

  const drawSummaryCard = (title, body, options = {}) => {
    const { accent = colors.primary } = options;
    const text = safeText(body, 'Not available.');
    const lines = doc.splitTextToSize(text, contentWidth - 32);
    const cardHeight = Math.max(74, lines.length * 14 + 34);

    ensureSpace(cardHeight + 12);

    setFillColor(colors.white);
    setDrawColor(colors.border);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 12, 12, 'FD');

    setFillColor(accent);
    doc.roundedRect(margin, y, 5, cardHeight, 12, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setTextColor(colors.text);
    doc.text(title, margin + 18, y + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setTextColor(colors.muted);
    doc.text(lines, margin + 18, y + 40);

    y += cardHeight + spacing.lg;
  };

  const drawBulletList = (title, items, accent = colors.success) => {
    drawSectionTitle(title);

    const list = safeArray(items);
    if (!list.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      setTextColor(colors.muted);
      doc.text('Not available.', margin, y);
      y += spacing.lg;
      return;
    }

    list.forEach((item) => {
      const lines = doc.splitTextToSize(String(item), contentWidth - 24);
      const itemHeight = Math.max(18, lines.length * 13);

      ensureSpace(itemHeight + 8);

      setFillColor(accent);
      doc.circle(margin + 5, y - 4, 2.2, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      setTextColor(colors.text);
      doc.text(lines, margin + 16, y);

      y += itemHeight + spacing.sm;
    });

    y += spacing.sm;
  };

  const drawConditionCard = (condition) => {
    const name = safeText(condition?.name, 'Unspecified condition');
    const reason = safeText(condition?.reason, 'No explanation provided.');
    const reasonLines = doc.splitTextToSize(reason, contentWidth - 32);
    const cardHeight = Math.max(72, reasonLines.length * 13 + 34);

    ensureSpace(cardHeight + 12);

    setFillColor(colors.white);
    setDrawColor(colors.border);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 12, 12, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setTextColor(colors.text);
    doc.text(name, margin + 18, y + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    setTextColor(colors.muted);
    doc.text(reasonLines, margin + 18, y + 40);

    y += cardHeight + spacing.md;
  };

  const drawParagraphSection = (title, body) => {
    drawSectionTitle(title);

    const text = safeText(body, 'Not available.');
    const lines = doc.splitTextToSize(text, contentWidth);

    ensureSpace(lines.length * 13 + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setTextColor(colors.text);
    doc.text(lines, margin, y);

    y += lines.length * 13 + spacing.lg;
  };

  const drawSubmittedSymptoms = () => {
    drawSectionTitle('Submitted Information');

    drawKeyValueRow(
      'Symptoms',
      safeArray(r.symptomSummary?.symptoms).join(', ') || 'Not provided',
      { accent: colors.primary }
    );

    drawKeyValueRow(
      'Duration',
      r.symptomSummary?.duration || 'Not provided'
    );

    drawKeyValueRow(
      'Severity',
      `${r.symptomSummary?.severity || 'Not provided'}/10`
    );

    drawKeyValueRow(
      'Relief factors',
      r.symptomSummary?.reliefFactors || 'Not provided'
    );

    y += spacing.sm;
  };

  const drawAssessmentOverview = () => {
    drawSectionTitle('Assessment Overview');

    drawKeyValueRow('Triage level', r.triageLevel || 'Not provided', {
      accent: colors.danger,
    });

    drawKeyValueRow('Urgency', r.urgencyMessage || 'Not provided', {
      accent: colors.warning,
    });

    y += spacing.sm;
  };

  const drawPossibleConditions = () => {
    drawSectionTitle('Possible Conditions');

    const conditions = safeArray(r.possibleConditions).slice(0, 3);

    if (!conditions.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      setTextColor(colors.muted);
      doc.text('No possible conditions were provided.', margin, y);
      y += spacing.lg;
      return;
    }

    conditions.forEach(drawConditionCard);
    y += spacing.sm;
  };

  // Start rendering
  drawReportHeader();
  drawAssessmentOverview();
  drawSummaryCard('Clinical Summary', r.summary, { accent: colors.primary });
  drawSubmittedSymptoms();
  drawPossibleConditions();
  drawBulletList('Care Tips', r.careTips, colors.success);
  drawBulletList('OTC Options', r.otcOptions, colors.warning);
  drawParagraphSection('Advice', r.advice);
  drawParagraphSection('When to Seek Immediate Care', r.immediateCare);

  // Disclaimer block
  ensureSpace(80);
  drawSectionTitle('Important Disclaimer');

  const disclaimerText = safeText(r.disclaimer, 'No disclaimer provided.');
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 24);
  const disclaimerHeight = Math.max(60, disclaimerLines.length * 13 + 24);

  setFillColor(colors.softBg);
  setDrawColor(colors.border);
  doc.roundedRect(margin, y, contentWidth, disclaimerHeight, 10, 10, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTextColor(colors.muted);
  doc.text(disclaimerLines, margin + 12, y + 20);

  y += disclaimerHeight + spacing.lg;

  drawFooter();
  doc.save('mediscan-report.pdf');
}

// ── Result modal ─────────────────────────────────────────────────────────────

function ResultModal({ analysis, onClose }) {
  const r = analysis.assessment;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {r.triageLevel}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        <Section label="Urgency" text={r.urgencyMessage} />
        <Section label="Summary" text={r.summary} />

        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Possible conditions</p>
        <div className="mb-4 space-y-2">
          {(r.possibleConditions || []).map((c, i) => (
            <div key={i} className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-800 dark:text-white">{c.name}</span>
                <span className="text-xs text-slate-400">{c.confidence}%</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.reason}</p>
            </div>
          ))}
        </div>

        <BulletSection label="Care tips" items={r.careTips} />
        <BulletSection label="OTC options" items={r.otcOptions} />
        <Section label="Advice" text={r.advice} />
        <Section label="When to seek immediate care" text={r.immediateCare} />

        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          {r.disclaimer}
        </p>

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="rounded-lg border border-teal-200 px-4 py-2 text-sm text-teal-600 transition hover:bg-teal-50 dark:border-teal-900/50 dark:text-teal-400 dark:hover:bg-teal-950/30">
            Close
          </button>
          <button onClick={() => exportToPDF(analysis)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300">
            Export PDF
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({ label, text }) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-200">{text}</p>
    </div>
  );
}

function BulletSection({ label, items = [] }) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-700 before:mr-2 before:content-['·'] dark:text-slate-200">{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SymptomChecker({ embedded = false }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ symptoms: [], duration: '', severity: 5, reliefFactors: '' });
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!loading) { setMsgIdx(0); return; }
    const id = setInterval(() => setMsgIdx(i => (i + 1) % ANALYZING_MESSAGES.length), 1400);
    return () => clearInterval(id);
  }, [loading]);

  const canAdvance = useCallback(() => {
    if (step === 1) return form.symptoms.length > 0;
    if (step === 2) return !!form.duration;
    return true;
  }, [step, form]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/symptoms/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.errors?.[0] || data?.message || `Error ${res.status}`);
      setAnalysis(data);
      setShowResult(true);
    } catch (e) {
      setError(friendlyError(e.message));
    } finally {
      setLoading(false);
    }
  };

  const outer = embedded
    ? 'w-full'
    : 'min-h-[calc(100vh-4rem)] bg-teal-50/40 dark:bg-slate-950 flex items-center justify-center p-6';

  const card = embedded
    ? 'w-full'
    : 'w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-teal-100 dark:border-teal-900/40 p-8';

  return (
    <div className={outer}>
      <div className={card}>
        <h2 className="mb-6 text-center text-xl font-medium text-teal-700 dark:text-teal-300">
          Symptom checker
        </h2>

        <ProgressBar step={step} total={TOTAL_STEPS} />

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <LoadingState messageIndex={msgIdx} />
        ) : (
          <>
            {step === 1 && (
              <div>
                <StepHeading title="What symptoms are you feeling?" sub="Select all that apply." />
                <SymptomLibrary
                  selectedSymptoms={form.symptoms}
                  onToggleSymptom={(s) =>
                    setForm(p => ({
                      ...p,
                      symptoms: p.symptoms.includes(s)
                        ? p.symptoms.filter(x => x !== s)
                        : [...p.symptoms, s],
                    }))
                  }
                  compact
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <StepHeading title="How long have you had these symptoms?" />
                <div className="space-y-2">
                  {DURATIONS.map(d => (
                    <label
                      key={d.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition
                        ${form.duration === d.value
                          ? 'border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/30 dark:text-teal-200'
                          : 'border-teal-100 hover:border-teal-300 dark:border-teal-900/50 dark:hover:border-teal-700'
                        }`}
                    >
                      <input
                        type="radio"
                        className="accent-teal-600 dark:accent-teal-300"
                        checked={form.duration === d.value}
                        onChange={() => setForm(p => ({ ...p, duration: d.value }))}
                      />
                      <span className="text-slate-700 dark:text-slate-200">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <StepHeading title="How severe are your symptoms?" sub="1 = minimal, 10 = critical." />
                <div className="mb-3 flex items-baseline gap-3">
                  <span className="text-3xl font-medium text-teal-700 dark:text-teal-300">{form.severity}</span>
                  <span className="text-sm text-slate-500">{SEVERITY_LABELS[form.severity - 1]}</span>
                </div>
                <input
                  type="range" min="1" max="10" step="1"
                  value={form.severity}
                  onChange={e => setForm(p => ({ ...p, severity: Number(e.target.value) }))}
                  className="w-full accent-teal-600 dark:accent-teal-300"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>Minimal</span><span>Critical</span>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <StepHeading title="Anything that helps or worsens it?" sub="Optional — rest, food, position, medication, etc." />
                <textarea
                  rows={4}
                  value={form.reliefFactors}
                  onChange={e => setForm(p => ({ ...p, reliefFactors: e.target.value }))}
                  placeholder="e.g. rest helps, worse after eating…"
                  className="w-full rounded-lg border border-teal-100 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none dark:border-teal-900/50 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
              </div>
            )}

            {step === 5 && (
              <div>
                <StepHeading title="Review your answers" sub="Check everything looks right." />
                <div className="grid grid-cols-2 gap-2">
                  <ReviewCard label="Symptoms" value={form.symptoms.join(', ') || 'None'} wide />
                  <ReviewCard label="Duration" value={DURATIONS.find(d => d.value === form.duration)?.label} />
                  <ReviewCard label="Severity" value={`${form.severity}/10 — ${SEVERITY_LABELS[form.severity - 1]}`} />
                  <ReviewCard label="Relief factors" value={form.reliefFactors || 'Not provided'} wide />
                </div>
              </div>
            )}

            <NavButtons
              step={step}
              total={TOTAL_STEPS}
              canAdvance={canAdvance()}
              loading={loading}
              onPrev={() => setStep(s => s - 1)}
              onNext={() => setStep(s => s + 1)}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </div>

      <AnimatePresence>
        {showResult && analysis?.assessment && (
          <ResultModal analysis={analysis} onClose={() => setShowResult(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
