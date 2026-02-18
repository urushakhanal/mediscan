import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

const symptomsList = [
  "Fever", "Cough", "Headache", "Sore throat", "Runny nose", "Body aches",
  "Fatigue", "Nausea", "Dizziness", "Chest pain", "Shortness of breath",
  "Loss of taste/smell", "Stomach pain", "Diarrhea", "Rash"
];

const durations = [
  { value: "1-day", label: "1 day" },
  { value: "2-3-days", label: "2–3 days" },
  { value: "4-7-days", label: "4–7 days" },
  { value: "1-2-weeks", label: "1–2 weeks" },
  { value: "more-than-2-weeks", label: "More than 2 weeks" },
];

const severityEmojis = ["😊", "🙂", "😐", "😕", "😟", "😰", "😨", "😱", "🤒", "🤕"];
const severityLabels = ["Minimal", "Mild", "Mild-Moderate", "Moderate", "Moderate-High", "High", "Severe", "Very Severe", "Extreme", "Critical"];

const SymptomChecker = ({ embedded = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [particles, setParticles] = useState([]);

  const [formData, setFormData] = useState({
    symptoms: [],
    duration: "",
    severity: 5,
    reliefFactors: ""
  });

  const [diagnosisResult, setDiagnosisResult] = useState("");

  /* ---------------- Particles ---------------- */
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

  /* ---------------- Helpers ---------------- */
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
    if (currentStep === 2) return formData.duration;
    return true;
  };

  /* ---------------- Mock Diagnosis ---------------- */
  const generateDiagnosis = () => {
    const common = formData.symptoms.join(", ");

    return `
1. Viral Infection (Common Cold / Flu)

2.
- Get enough rest and stay hydrated
- Avoid cold drinks
- Monitor fever regularly

3.
- Paracetamol for fever
- ORS for hydration
- Steam inhalation

4. If symptoms worsen or persist beyond 3–4 days, consult a doctor.

Symptoms noted: ${common}
`;
  };

  const handleSubmit = () => {
    const result = generateDiagnosis();
    setDiagnosisResult(result);
    setShowModal(true);
  };

  /* ---------------- Extract Sections ---------------- */
  const extractSectionLines = (text, start, end) => {
    const lines = text.split("\n");
    const s = lines.findIndex(l => l.startsWith(start));
    const e = lines.findIndex(l => l.startsWith(end));
    if (s === -1) return [];
    return lines.slice(s + 1, e !== -1 ? e : undefined)
      .filter(l => l.trim().startsWith("-"))
      .map(l => l.replace("-", "").trim());
  };

  const diagnosisText =
    diagnosisResult.split("\n").find(l => l.startsWith("1."))?.replace("1.", "").trim();

  const healthTips = extractSectionLines(diagnosisResult, "2.", "3.");
  const medicines = extractSectionLines(diagnosisResult, "3.", "4.");
  const adviceText =
    diagnosisResult.split("\n").find(l => l.startsWith("4."))?.replace("4.", "").trim();

  const totalSteps = 5;
  const progress = Math.round((currentStep / totalSteps) * 100);

  /* ---------------- Export ---------------- */
  const handleExport = () => {
    const content = `AI Health Report\n\nDiagnosis:\n${diagnosisText}\n\nTips:\n${healthTips.join("\n")}\n\nRemedies:\n${medicines.join("\n")}\n\nAdvice:\n${adviceText}`;
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "health-report.txt";
    link.click();
  };

  /* ---------------- UI ---------------- */
  const wrapperClass = embedded
    ? "relative w-full"
    : "relative min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center";
  const cardClass = embedded
    ? "w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    : "w-full max-w-4xl bg-white dark:bg-slate-800 p-6 rounded-xl shadow";

  return (
    <div className={wrapperClass}>

      {/* particles */}
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
        <h2 className="text-2xl font-bold text-center">Smart Symptom Checker</h2>
        <div className="mt-4 mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-slate-300 dark:bg-slate-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* STEP 1 */}
        {currentStep === 1 && (
          <>
            <h3 className="font-semibold mb-3">Select Symptoms</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {symptomsList.map(s => (
                <label key={s} className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={formData.symptoms.includes(s)}
                    onChange={() => handleCheckbox(s)}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <>
            <h3 className="font-semibold mb-3">Duration</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {durations.map(d => (
                <label key={d.value} className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200">
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

        {/* STEP 3 */}
        {currentStep === 3 && (
          <>
            <h3 className="font-semibold mb-3">Severity</h3>
            <div className="rounded-lg border border-slate-200 px-4 py-4 dark:border-slate-700">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.severity}
                onChange={e => setFormData(p => ({ ...p, severity: +e.target.value }))}
                className="w-full"
              />
              <div className="text-center mt-4">
                <span className="text-3xl">{severityEmojis[formData.severity - 1]}</span>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {severityLabels[formData.severity - 1]}
                </p>
              </div>
            </div>
          </>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Relief factors</h3>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="What helps or worsens the symptoms?"
              onChange={e => setFormData(p => ({ ...p, reliefFactors: e.target.value }))}
            />
          </div>
        )}

        {/* STEP 5 */}
        {currentStep === 5 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Symptoms</p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {formData.symptoms.length ? formData.symptoms.join(", ") : "None selected"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Duration</p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">{formData.duration || "Not set"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 sm:col-span-2">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Severity</p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {severityLabels[formData.severity - 1]}
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
          <Button
            variant="outline"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(s => s - 1)}
          >
            Previous
          </Button>
          {currentStep < 5 ? (
            <Button disabled={!isStepValid()} onClick={() => setCurrentStep(s => s + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit}>Get Diagnosis</Button>
          )}
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4">
            <motion.div className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-3xl w-full">
              <h3 className="text-xl font-bold mb-4">Diagnosis</h3>
              <p><b>{diagnosisText}</b></p>

              <h4 className="mt-4 font-semibold">Health Tips</h4>
              <ul className="list-disc ml-5">
                {healthTips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>

              <h4 className="mt-4 font-semibold">Remedies</h4>
              <ul className="list-disc ml-5">
                {medicines.map((m, i) => <li key={i}>{m}</li>)}
              </ul>

              <p className="mt-4"><b>Advice:</b> {adviceText}</p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowModal(false)}>Close</Button>
                <Button onClick={handleExport}>Export</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SymptomChecker;
