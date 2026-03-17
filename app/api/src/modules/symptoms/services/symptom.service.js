const config = require('../../../config/env');

const durationWeight = {
    '1-day': 1,
    '2-3-days': 2,
    '4-7-days': 3,
    '1-2-weeks': 4,
    'more-than-2-weeks': 5,
};

const knowledgeBase = [
    {
        name: 'Viral upper respiratory infection',
        triggers: ['Fever', 'Cough', 'Sore throat', 'Runny nose', 'Body aches', 'Fatigue'],
        tips: ['Rest and hydrate well.', 'Monitor body temperature every 6-8 hours.'],
        otc: ['Paracetamol for fever/pain', 'Warm fluids and steam inhalation'],
    },
    {
        name: 'Migraine or tension headache',
        triggers: ['Headache', 'Nausea', 'Dizziness', 'Loss of taste/smell'],
        tips: ['Reduce screen exposure and rest in a quiet room.', 'Maintain regular hydration.'],
        otc: ['Paracetamol or ibuprofen if tolerated'],
    },
    {
        name: 'Gastrointestinal irritation',
        triggers: ['Stomach pain', 'Diarrhea', 'Nausea'],
        tips: ['Use oral rehydration solution.', 'Prefer bland, low-fat meals.'],
        otc: ['ORS packets', 'Electrolyte fluids'],
    },
    {
        name: 'Possible lower respiratory concern',
        triggers: ['Shortness of breath', 'Chest pain', 'Cough', 'Fever'],
        tips: ['Avoid exertion until assessed.', 'Track breathing difficulty over time.'],
        otc: ['Do not self-medicate severe breathing symptoms'],
    },
    {
        name: 'Dermatologic reaction',
        triggers: ['Rash', 'Fever', 'Body aches'],
        tips: ['Keep the affected area clean and dry.', 'Avoid new skincare products temporarily.'],
        otc: ['Antihistamine if mild itching and no red flags'],
    },
];

const normalizeSeverityLabel = (severity) => {
    if (severity >= 9) return 'critical';
    if (severity >= 7) return 'high';
    if (severity >= 5) return 'moderate';
    return 'low';
};

const includesAny = (symptoms, required) => required.some((item) => symptoms.includes(item));

const evaluateTriage = ({ symptoms, duration, severity }) => {
    const hasChestPain = symptoms.includes('Chest pain');
    const hasBreathShortness = symptoms.includes('Shortness of breath');
    const hasFever = symptoms.includes('Fever');
    const hasDizziness = symptoms.includes('Dizziness');

    if ((hasChestPain && hasBreathShortness) || severity >= 9) {
        return {
            triageLevel: 'emergency',
            urgencyMessage: 'Seek emergency care immediately.',
        };
    }

    if (
        severity >= 7 ||
        duration === 'more-than-2-weeks' ||
        (hasFever && hasBreathShortness) ||
        (hasChestPain && hasDizziness)
    ) {
        return {
            triageLevel: 'urgent',
            urgencyMessage: 'Arrange same-day urgent medical review.',
        };
    }

    if (severity >= 4 || durationWeight[duration] >= 3) {
        return {
            triageLevel: 'clinic',
            urgencyMessage: 'Book a clinic appointment within 24-48 hours.',
        };
    }

    return {
        triageLevel: 'self-care',
        urgencyMessage: 'Try monitored home care and observe symptoms closely.',
    };
};

const findConditions = ({ symptoms }) => {
    const matches = knowledgeBase
        .map((entry) => {
            const score = entry.triggers.filter((trigger) => symptoms.includes(trigger)).length;
            return { entry, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    if (matches.length === 0) {
        return {
            possibleConditions: [
                {
                    name: 'Nonspecific symptom pattern',
                    confidence: 35,
                    reason: 'Symptoms do not match a strong predefined pattern.',
                },
            ],
            careTips: ['Track symptoms and temperature for 24 hours.', 'Seek care if new severe symptoms appear.'],
            otcOptions: ['Use only basic supportive care unless advised by a clinician'],
        };
    }

    const possibleConditions = matches.map(({ entry, score }) => ({
        name: entry.name,
        confidence: Math.min(95, 40 + score * 15),
        reason: `Matched ${score} reported symptom(s).`,
    }));

    const careTips = [...new Set(matches.flatMap(({ entry }) => entry.tips))].slice(0, 5);
    const otcOptions = [...new Set(matches.flatMap(({ entry }) => entry.otc))].slice(0, 4);

    return { possibleConditions, careTips, otcOptions };
};

const buildPrompt = (payload, baseAssessment) => {
    const symptomList = payload.symptoms.join(', ');
    return [
        'You are generating a patient-friendly explanation for a symptom checker result.',
        'Do not diagnose definitively. Keep safety-first language.',
        'Output plain text only with the following 3 sections and exactly these headers:',
        'Summary:',
        'Advice:',
        'When to seek immediate care:',
        `Symptoms: ${symptomList}`,
        `Duration: ${payload.duration}`,
        `Severity (1-10): ${payload.severity} (${normalizeSeverityLabel(payload.severity)})`,
        `Triage level from rules engine: ${baseAssessment.triageLevel}`,
        `Primary possible condition: ${baseAssessment.possibleConditions[0].name}`,
        `Relief factors: ${payload.reliefFactors || 'None provided'}`,
    ].join('\n');
};

const parseAiSections = (text) => {
    if (!text || typeof text !== 'string') {
        return null;
    }

    const summaryMatch = text.match(/Summary:\s*([\s\S]*?)\nAdvice:/i);
    const adviceMatch = text.match(/Advice:\s*([\s\S]*?)\nWhen to seek immediate care:/i);
    const emergencyMatch = text.match(/When to seek immediate care:\s*([\s\S]*)/i);

    if (!summaryMatch && !adviceMatch && !emergencyMatch) {
        return null;
    }

    return {
        summary: summaryMatch ? summaryMatch[1].trim() : '',
        advice: adviceMatch ? adviceMatch[1].trim() : '',
        immediateCare: emergencyMatch ? emergencyMatch[1].trim() : '',
    };
};

const generateAiExplanation = async (payload, baseAssessment) => {
    if (!config.openRouterApiKey) {
        return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const response = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.openRouterApiKey}`,
                'HTTP-Referer': config.clientUrl,
                'X-Title': config.appName,
            },
            body: JSON.stringify({
                model: config.openRouterModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a conservative healthcare assistant. Never provide definitive diagnosis.',
                    },
                    {
                        role: 'user',
                        content: buildPrompt(payload, baseAssessment),
                    },
                ],
                temperature: 0.3,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        return parseAiSections(content);
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
};

const createFallbackNarrative = (assessment) => {
    return {
        summary: `Pattern suggests ${assessment.possibleConditions[0].name}. This is not a confirmed diagnosis.`,
        advice: assessment.careTips.join(' '),
        immediateCare:
            assessment.triageLevel === 'emergency'
                ? 'Get emergency help right now.'
                : 'Seek immediate help for chest pain, severe breathing issues, confusion, fainting, or rapidly worsening symptoms.',
    };
};

const analyzeSymptoms = async (payload) => {
    const triage = evaluateTriage(payload);
    const conditionData = findConditions(payload);

    const baseAssessment = {
        ...triage,
        ...conditionData,
        followUpAdvice:
            triage.triageLevel === 'self-care'
                ? 'If symptoms persist beyond 48 hours or worsen, arrange a clinician review.'
                : 'Follow triage guidance and consult a licensed clinician for confirmation.',
        disclaimer:
            'This tool is informational only and does not replace professional diagnosis or emergency care.',
    };

    const aiNarrative = await generateAiExplanation(payload, baseAssessment);
    const narrative = aiNarrative || createFallbackNarrative(baseAssessment);

    const severeSymptomsPresent = includesAny(payload.symptoms, ['Chest pain', 'Shortness of breath', 'Dizziness']);

    return {
        source: aiNarrative ? 'ai' : 'rules',
        model: aiNarrative ? config.openRouterModel : null,
        assessment: {
            ...baseAssessment,
            ...narrative,
            symptomSummary: {
                symptoms: payload.symptoms,
                duration: payload.duration,
                severity: payload.severity,
                reliefFactors: payload.reliefFactors,
                severeSymptomsPresent,
            },
        },
    };
};

module.exports = {
    analyzeSymptoms,
};
