import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import { Button } from './ui/button';
import SymptomLibrary from './symptom-library';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const durations = [
  { value: '1-day', label: '1 day' },
  { value: '2-3-days', label: '2-3 days' },
  { value: '4-7-days', label: '4-7 days' },
  { value: '1-2-weeks', label: '1-2 weeks' },
  { value: 'more-than-2-weeks', label: 'More than 2 weeks' },
];

const severityLabels = ['Minimal', 'Mild', 'Mild-Moderate', 'Moderate', 'Moderate-High', 'High', 'Severe', 'Very Severe', 'Extreme', 'Critical'];

const analyzingMessages = [
  'Reviewing symptom patterns',
  'Checking urgency signals',
  'Preparing care guidance',
];

const getFriendlySymptomErrorMessage = message => {
  const normalized = String(message || '').toLowerCase();

  if (
    normalized.includes('free-models-per-day') ||
    normalized.includes('rate limit exceeded') ||
    normalized.includes('openrouter')
  ) {
    return 'Your free OpenRouter limit has been reached. Please try again later or use another configured model.';
  }

  if (normalized.includes('timed out')) {
    return 'The symptom checker took too long to respond. Please try again in a moment.';
  }

  return message || 'Unable to analyze symptoms right now.';
};

const isOpenRouterLimitError = message => {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('free-models-per-day') || normalized.includes('rate limit exceeded');
};

const SymptomChecker = ({ embedded = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [particles, setParticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [analyzingMessageIndex, setAnalyzingMessageIndex] = useState(0);

  const [formData, setFormData] = useState({
    symptoms: [],
    duration: '',
    severity: 5,
    reliefFactors: ''
  });

  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const p = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      dx: (Math.random() - 0.5) * 0.15,
      dy: (Math.random() - 0.5) * 0.15,
      size: Math.random() * 2 + 1
    }));
    setParticles(p);

    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(pt => ({
          ...pt,
          x: (pt.x + pt.dx + 100) % 100,
          y: (pt.y + pt.dy + 100) % 100,
        }))
      );
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading) {
      setAnalyzingMessageIndex(0);
      return undefined;
    }

    const interval = setInterval(() => {
      setAnalyzingMessageIndex(prev => (prev + 1) % analyzingMessages.length);
    }, 1400);

    return () => clearInterval(interval);
  }, [loading]);

  const handleCheckbox = symptom => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const isStepValid = () => {
    if (currentStep === 1) return formData.symptoms.length > 0;
    if (currentStep === 2) return !!formData.duration;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/symptoms/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = data?.errors?.[0] || data?.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      setAnalysis(data);
      setShowModal(true);
    } catch (error) {
      const friendlyMessage = getFriendlySymptomErrorMessage(error.message);
      setSubmitError(friendlyMessage);
      setShowErrorModal(isOpenRouterLimitError(error.message));
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 5;
  const progress = Math.round((currentStep / totalSteps) * 100);

  const handleExport = () => {
    if (!analysis?.assessment) return;

    const report = analysis.assessment;
    const generatedAt = new Date().toLocaleString();
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 42;
    const contentWidth = pageWidth - margin * 2;
    let y = 40;

    const ensureSpace = requiredHeight => {
      if (y + requiredHeight > pageHeight - 40) {
        doc.addPage();
        y = 40;
      }
    };

    const drawWrappedText = (text, x, currentY, width, lineHeight = 16) => {
      const lines = doc.splitTextToSize(String(text || ''), width);
      doc.setTextColor(0, 0, 0);
      doc.text(lines, x, currentY);
      return currentY + lines.length * lineHeight;
    };

    const drawSectionTitle = title => {
      ensureSpace(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(title, margin, y);
      y += 16;
    };

    const drawBulletList = items => {
      const safeItems = items && items.length ? items : ['Not available'];
      safeItems.forEach(item => {
        const lines = doc.splitTextToSize(String(item), contentWidth - 18);
        ensureSpace(lines.length * 16 + 6);
        doc.setTextColor(0, 0, 0);
        doc.text('-', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(lines, margin + 12, y);
        y += lines.length * 16 + 4;
      });
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Symptom Analysis Report', margin, y);
    y += 24;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Source: ${analysis.source}${analysis.model ? ` (${analysis.model})` : ''}`, margin, y);
    y += 16;
    doc.text(`Generated: ${generatedAt}`, margin, y);
    y += 16;
    doc.text(`Triage: ${report.triageLevel}`, margin, y);
    y += 16;
    doc.text(`Urgency: ${report.urgencyMessage}`, margin, y);
    y += 22;

    drawSectionTitle('Submitted Symptoms');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const summaryLines = [
      `Symptoms: ${(report.symptomSummary?.symptoms || []).join(', ') || 'Not provided'}`,
      `Duration: ${report.symptomSummary?.duration || 'Not provided'}`,
      `Severity: ${report.symptomSummary?.severity || 'Not provided'}/10`,
      `Relief factors: ${report.symptomSummary?.reliefFactors || 'Not provided'}`,
    ];
    summaryLines.forEach(line => {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 16;
    });
    y += 8;

    drawSectionTitle('Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    y = drawWrappedText(report.summary || 'No summary available.', margin, y, contentWidth) + 8;

    drawSectionTitle('Possible Conditions');
    (report.possibleConditions || []).slice(0, 3).forEach((item, index) => {
      const reasonLines = doc.splitTextToSize(String(item.reason || 'No reason provided.'), contentWidth - 12);
      ensureSpace(reasonLines.length * 16 + 28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${item.name || 'Unspecified condition'} (${item.confidence || 0}%)`, margin, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      y = drawWrappedText(item.reason || 'No reason provided.', margin + 12, y, contentWidth - 12) + 8;
    });

    drawSectionTitle('Care Tips');
    drawBulletList(report.careTips || []);
    y += 4;

    drawSectionTitle('OTC Options');
    drawBulletList(report.otcOptions || []);
    y += 4;

    drawSectionTitle('Advice');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    y = drawWrappedText(report.advice || 'No advice available.', margin, y, contentWidth) + 10;

    drawSectionTitle('When to Seek Immediate Care');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    y = drawWrappedText(report.immediateCare || 'No emergency guidance available.', margin, y, contentWidth) + 10;

    drawSectionTitle('Disclaimer');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    drawWrappedText(
      report.disclaimer || 'This report is informational only and does not replace professional medical diagnosis or emergency care.',
      margin,
      y,
      contentWidth,
      14
    );

    doc.save('mediscan-ai-analysis.pdf');
  };

  const wrapperClass = embedded
    ? 'relative w-full'
    : 'relative min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center';
  const cardClass = embedded
    ? 'w-full rounded-[1.9rem] border border-slate-200 bg-white px-7 py-8 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.28)] dark:border-slate-700 dark:bg-slate-900'
    : 'w-full max-w-4xl bg-white dark:bg-slate-800 p-6 rounded-xl shadow';

  return (
    <div className={wrapperClass}>
      {!embedded && (
        <div className="absolute inset-0 -z-10 overflow-hidden hidden dark:block">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute bg-cyan-400/10 rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            />
          ))}
        </div>
      )}

      <div className={cardClass}>
        <h2 className="text-center text-3xl font-bold tracking-tight text-teal-600 dark:text-teal-400">Smart Symptom Checker</h2>
        <div className="mt-7 mb-8 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
            <div className="h-full rounded-full bg-slate-300 dark:bg-slate-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {submitError}
          </div>
        )}

        {loading && (
          <div className="mb-5 overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50/80 px-4 py-4 dark:border-cyan-900/60 dark:bg-cyan-950/20">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="absolute h-10 w-10 rounded-full border-2 border-cyan-200 dark:border-cyan-900/60" />
                <span className="absolute h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-cyan-600 border-r-cyan-400 dark:border-t-cyan-300 dark:border-r-cyan-500" />
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-600 dark:bg-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Analyzing your symptoms</p>
                <p className="mt-1 text-sm text-cyan-800 dark:text-cyan-200">
                  {analyzingMessages[analyzingMessageIndex]}...
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {[0, 1, 2].map((item) => (
                <span
                  key={item}
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-cyan-100 dark:bg-cyan-950/50"
                >
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                    style={{
                      width: item < analyzingMessageIndex ? '100%' : item === analyzingMessageIndex ? '65%' : '18%',
                    }}
                  />
                </span>
              ))}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <h3 className="mb-2 font-semibold">Select Symptoms</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              Choose the symptoms you are feeling right now.
            </p>
            <SymptomLibrary
              selectedSymptoms={formData.symptoms}
              onToggleSymptom={handleCheckbox}
              compact
            />
          </div>
        )}

        {currentStep === 2 && (
          <>
            <h3 className="mb-4 text-xl font-semibold text-slate-950 dark:text-white">Duration</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {durations.map(d => (
                <label key={d.value} className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200">
                  <input
                    type="radio"
                    className="mt-1 h-4 w-4"
                    checked={formData.duration === d.value}
                    onChange={() => setFormData(p => ({ ...p, duration: d.value }))}
                  />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h3 className="font-semibold mb-3">Severity</h3>
            <div className="rounded-lg border border-slate-200 px-4 py-4 dark:border-slate-700">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.severity}
                onChange={e => setFormData(p => ({ ...p, severity: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-center mt-4">
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {severityLabels[formData.severity - 1]}
                </p>
              </div>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Relief factors</h3>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="What helps or worsens the symptoms?"
              value={formData.reliefFactors}
              onChange={e => setFormData(p => ({ ...p, reliefFactors: e.target.value }))}
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Symptoms</p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {formData.symptoms.length ? formData.symptoms.join(', ') : 'None selected'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Duration</p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">{formData.duration || 'Not set'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 sm:col-span-2">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Severity</p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">{severityLabels[formData.severity - 1]}</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 dark:border-slate-700 sm:flex-row">
          <Button variant="outline" disabled={currentStep === 1 || loading} onClick={() => setCurrentStep(s => s - 1)} className="rounded-2xl border-slate-200 px-5 py-3 text-slate-900 dark:border-slate-700 dark:text-slate-100">
            Previous
          </Button>
          {currentStep < 5 ? (
            <Button disabled={!isStepValid() || loading} onClick={() => setCurrentStep(s => s + 1)} className="rounded-2xl bg-sky-300 px-5 py-3 text-white hover:bg-sky-400 disabled:bg-slate-200 disabled:text-slate-500">
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-sky-300 px-5 py-3 text-white hover:bg-sky-400 disabled:bg-slate-200 disabled:text-slate-500">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analyzing...
                </span>
              ) : 'Get Diagnosis'}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showErrorModal && submitError && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <motion.div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">OpenRouter Limit Reached</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{submitError}</p>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowErrorModal(false)}
                  className="rounded-2xl bg-sky-300 px-5 py-3 text-white hover:bg-sky-400"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showModal && analysis?.assessment && (
          <motion.div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
            <motion.div className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-2">Assessment Result</h3>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">
                Source: {analysis.source}{analysis.model ? ` (${analysis.model})` : ''}
              </p>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 mb-4">
                <p><b>Triage:</b> {analysis.assessment.triageLevel}</p>
                <p><b>Urgency:</b> {analysis.assessment.urgencyMessage}</p>
              </div>

              <h4 className="font-semibold">Summary</h4>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{analysis.assessment.summary}</p>

              <h4 className="mt-4 font-semibold">Possible Conditions</h4>
              <ul className="list-disc ml-5 text-sm space-y-1">
                {(analysis.assessment.possibleConditions || []).map((item, index) => (
                  <li key={`${item.name}-${index}`}>
                    <b>{item.name}</b> ({item.confidence}%): {item.reason}
                  </li>
                ))}
              </ul>

              <h4 className="mt-4 font-semibold">Care Tips</h4>
              <ul className="list-disc ml-5 text-sm space-y-1">
                {(analysis.assessment.careTips || []).map((tip, index) => <li key={`tip-${index}`}>{tip}</li>)}
              </ul>

              <h4 className="mt-4 font-semibold">OTC Options</h4>
              <ul className="list-disc ml-5 text-sm space-y-1">
                {(analysis.assessment.otcOptions || []).map((otc, index) => <li key={`otc-${index}`}>{otc}</li>)}
              </ul>

              <h4 className="mt-4 font-semibold">Advice</h4>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{analysis.assessment.advice}</p>

              <h4 className="mt-4 font-semibold">When to seek immediate care</h4>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{analysis.assessment.immediateCare}</p>

              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                {analysis.assessment.disclaimer}
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowModal(false)}>Close</Button>
                <Button onClick={handleExport}>Export PDF</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SymptomChecker;
