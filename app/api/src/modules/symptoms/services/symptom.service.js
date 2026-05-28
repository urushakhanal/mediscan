const config = require('../../../config/env');

const createHttpError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeSeverityLabel = (severity) => {
    if (severity >= 9) return 'critical';
    if (severity >= 7) return 'high';
    if (severity >= 5) return 'moderate';
    return 'low';
};

const getNormalizedSymptomText = (payload) => [
    ...(Array.isArray(payload.symptoms) ? payload.symptoms : []),
    payload.reliefFactors || '',
].join(' ').toLowerCase();

const hasAnyPattern = (text, patterns) => patterns.some((pattern) => pattern.test(text));

const buildFallbackPossibleConditions = (payload) => {
    const symptoms = getNormalizedSymptomText(payload);
    const conditions = [];

    if (/(cough|sore throat|runny nose|congestion|fever|fatigue|body aches)/.test(symptoms)) {
        conditions.push({
            name: 'Viral upper respiratory infection',
            confidence: 62,
            reason: 'The symptoms include common respiratory or flu-like features.',
        });
    }

    if (/(stomach|abdominal|nausea|vomiting|diarrhea|indigestion|cramping)/.test(symptoms)) {
        conditions.push({
            name: 'Gastrointestinal irritation or infection',
            confidence: 60,
            reason: 'The symptoms suggest a possible digestive tract issue.',
        });
    }

    if (/(headache|migraine|dizzy|dizziness|lightheaded)/.test(symptoms)) {
        conditions.push({
            name: 'Headache or migraine syndrome',
            confidence: 58,
            reason: 'The symptoms include common headache-related descriptors.',
        });
    }

    if (/(rash|itch|hives|swelling|redness|allergic)/.test(symptoms)) {
        conditions.push({
            name: 'Allergic or inflammatory skin reaction',
            confidence: 57,
            reason: 'The symptoms include skin or allergy-related findings.',
        });
    }

    if (conditions.length === 0) {
        conditions.push({
            name: 'General viral illness or nonspecific inflammation',
            confidence: 48,
            reason: 'The available symptom details are nonspecific, so only broad possibilities can be suggested.',
        });
    }

    return conditions.slice(0, 3);
};

const buildFallbackTriage = (payload) => {
    const symptomText = getNormalizedSymptomText(payload);
    const severeSymptoms = [
        /chest pain/,
        /trouble breathing/,
        /shortness of breath/,
        /difficulty breathing/,
        /blue lips/,
        /severe bleeding/,
        /loss of consciousness/,
        /fainting/,
        /seizure/,
        /stroke/,
        /one-sided weakness/,
        /facial droop/,
        /confusion/,
        /anaphylaxis/,
        /suicidal/,
    ];
    const urgentSymptoms = [
        /high fever/,
        /fever/,
        /severe pain/,
        /worsening/,
        /persistent vomiting/,
        /dehydration/,
        /blood in/,
        /cannot keep fluids down/,
        /severe weakness/,
    ];

    if (hasAnyPattern(symptomText, severeSymptoms)) {
        return {
            triageLevel: 'emergency',
            urgencyMessage: 'Seek emergency care now if these symptoms are current or worsening.',
            summary: 'The reported symptoms include possible emergency warning signs, so urgent in-person evaluation is recommended.',
        };
    }

    if (payload.severity >= 8 || hasAnyPattern(symptomText, urgentSymptoms)) {
        return {
            triageLevel: 'urgent',
            urgencyMessage: 'Prompt urgent care evaluation is recommended.',
            summary: 'The symptoms sound significant enough that you should be assessed promptly by a clinician.',
        };
    }

    if (payload.severity >= 5 || payload.duration === '1-2-weeks' || payload.duration === 'more-than-2-weeks') {
        return {
            triageLevel: 'clinic',
            urgencyMessage: 'A clinic visit is recommended soon.',
            summary: 'The symptoms appear persistent or moderately concerning, so a routine clinical assessment is appropriate.',
        };
    }

    return {
        triageLevel: 'self-care',
        urgencyMessage: 'Self-care may be reasonable if symptoms stay mild and do not worsen.',
        summary: 'The symptoms sound mild, but you should monitor closely for any worsening or new warning signs.',
    };
};

const buildFallbackAssessment = (payload) => {
    const triage = buildFallbackTriage(payload);

    return {
        ...triage,
        possibleConditions: buildFallbackPossibleConditions(payload),
        careTips: [
            'Rest and stay well hydrated.',
            'Monitor your symptoms and temperature if relevant.',
            'Avoid heavy activity until you feel better.',
            'Use simple symptom relief measures that you normally tolerate safely.',
            'Arrange medical review if symptoms worsen or do not improve.',
        ],
        otcOptions: [
            'Acetaminophen or ibuprofen if you normally can take them safely.',
            'Oral rehydration fluids if you may be dehydrated.',
            'Saline or other simple local symptom relief measures if relevant.',
        ],
        advice: 'This is a conservative fallback assessment because the AI provider is temporarily unavailable. A clinician can give the most accurate guidance.',
        immediateCare: 'Go to emergency care immediately if you develop chest pain, trouble breathing, confusion, fainting, severe bleeding, or rapidly worsening symptoms.',
        followUpAdvice: 'If symptoms persist, worsen, or new symptoms appear, arrange a clinician review as soon as possible.',
        disclaimer: 'This fallback is informational only and does not replace professional medical care or emergency evaluation.',
    };
};

const isProviderCapacityError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    return error?.statusCode === 429
        || error?.providerStatus === 429
        || message.includes('service tier capacity exceeded')
        || message.includes('rate limit')
        || message.includes('too many requests');
};

const buildPrompt = (payload) => {
    const symptomList = payload.symptoms.join(', ');

    return [
        'You are a conservative healthcare triage assistant.',
        'Do not provide a definitive diagnosis.',
        'Use safety-first language.',
        'Return valid JSON only. Do not wrap the response in markdown.',
        'The JSON must match this exact shape:',
        '{',
        '  "triageLevel": "self-care | clinic | urgent | emergency",',
        '  "urgencyMessage": "short string",',
        '  "summary": "short paragraph",',
        '  "possibleConditions": [',
        '    { "name": "string", "confidence": 0-100 number, "reason": "string" }',
        '  ],',
        '  "careTips": ["string"],',
        '  "otcOptions": ["string"],',
        '  "advice": "string",',
        '  "immediateCare": "string",',
        '  "followUpAdvice": "string",',
        '  "disclaimer": "string"',
        '}',
        '',
        'Rules:',
        '- Keep possibleConditions to maximum 3 items.',
        '- Keep careTips to maximum 5 items.',
        '- Keep otcOptions to maximum 4 items.',
        '- If symptoms sound dangerous, set triageLevel to "urgent" or "emergency".',
        '- Never prescribe prescription medicines.',
        '- Include a clear disclaimer that this is informational only.',
        '',
        `Symptoms: ${symptomList}`,
        `Duration: ${payload.duration}`,
        `Severity (1-10): ${payload.severity} (${normalizeSeverityLabel(payload.severity)})`,
        `Relief factors: ${payload.reliefFactors || 'None provided'}`,
    ].join('\n');
};

const stripCodeFence = (value) => String(value || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

const normalizePossibleConditions = (value) => {
    if (!Array.isArray(value) || value.length === 0) {
        throw createHttpError('AI response did not include possible conditions.', 502);
    }

    return value
        .slice(0, 3)
        .map((item) => ({
            name: String(item?.name || '').trim() || 'Unspecified condition',
            confidence: Math.max(0, Math.min(100, Number(item?.confidence) || 0)),
            reason: String(item?.reason || '').trim() || 'No reason provided.',
        }));
};

const normalizeStringArray = (value, maxItems, fallbackMessage) => {
    const items = Array.isArray(value)
        ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, maxItems)
        : [];

    if (items.length === 0) {
        return [fallbackMessage];
    }

    return items;
};

const normalizeAssessment = (parsed, payload) => {
    const triageLevel = String(parsed?.triageLevel || '').trim().toLowerCase();
    const allowedTriageLevels = ['self-care', 'clinic', 'urgent', 'emergency'];

    if (!allowedTriageLevels.includes(triageLevel)) {
        throw createHttpError('AI response returned an invalid triage level.', 502);
    }

    return {
        triageLevel,
        urgencyMessage: String(parsed?.urgencyMessage || '').trim() || 'Clinical review is recommended.',
        summary: String(parsed?.summary || '').trim() || 'No summary provided.',
        possibleConditions: normalizePossibleConditions(parsed?.possibleConditions),
        careTips: normalizeStringArray(parsed?.careTips, 5, 'No self-care tips provided.'),
        otcOptions: normalizeStringArray(parsed?.otcOptions, 4, 'No OTC options provided.'),
        advice: String(parsed?.advice || '').trim() || 'Please consult a clinician for further guidance.',
        immediateCare: String(parsed?.immediateCare || '').trim() || 'Seek immediate care if symptoms rapidly worsen.',
        followUpAdvice: String(parsed?.followUpAdvice || '').trim() || 'Follow up with a clinician if symptoms persist or worsen.',
        disclaimer: String(parsed?.disclaimer || '').trim() || 'This tool is informational only and does not replace professional diagnosis or emergency care.',
        symptomSummary: {
            symptoms: payload.symptoms,
            duration: payload.duration,
            severity: payload.severity,
            reliefFactors: payload.reliefFactors,
            severeSymptomsPresent: payload.severity >= 7,
        },
    };
};

const requestMistralAssessment = async (payload) => {
    if (!config.mistralApiKey) {
        throw createHttpError('AI provider is not configured.', 503);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

    try {
        const response = await fetch(`${config.mistralBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.mistralApiKey}`,
            },
            body: JSON.stringify({
                model: config.mistralModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a conservative healthcare triage assistant that returns valid JSON only.',
                    },
                    {
                        role: 'user',
                        content: buildPrompt(payload),
                    },
                ],
                temperature: 0.2,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            const providerMessage = errorBody.trim() || `Provider returned status ${response.status}.`;
            const error = createHttpError(
                `Mistral symptom checker request failed: ${providerMessage}`,
                response.status === 429 ? 429 : 502,
            );
            error.providerStatus = response.status;
            error.providerMessage = providerMessage;
            throw error;
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            throw createHttpError('Mistral symptom checker returned an empty response.', 502);
        }

        let parsed;
        try {
            parsed = JSON.parse(stripCodeFence(content));
        } catch {
            throw createHttpError('Mistral symptom checker returned an invalid response format.', 502);
        }

        return normalizeAssessment(parsed, payload);
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw createHttpError('Mistral symptom checker timed out. Please try again.', 504);
        }

        if (isProviderCapacityError(error)) {
            return {
                source: 'rules-fallback',
                model: config.mistralModel,
                assessment: buildFallbackAssessment(payload),
            };
        }

        if (error?.statusCode) {
            throw error;
        }

        throw createHttpError('Mistral symptom checker is unavailable right now.', 502);
    } finally {
        clearTimeout(timeout);
    }
};

const analyzeSymptoms = async (payload) => {
    const assessment = await requestMistralAssessment(payload);

    return {
        source: 'mistral',
        model: config.mistralModel,
        assessment,
    };
};

module.exports = {
    analyzeSymptoms,
};
