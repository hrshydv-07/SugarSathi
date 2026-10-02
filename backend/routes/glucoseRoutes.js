const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GlucoseReading = require('../models/GlucoseReading');
const SeniorProfile = require('../models/SeniorProfile');
const RiskEvent = require('../models/RiskEvent');
const { evaluateGlucoseRisk, calculateGlucoseTrends } = require('../services/riskEngine');
const { sendWhatsAppNotification } = require('../services/whatsappService');
const { optionalAuth } = require('../middleware/auth');
const mockStore = require('../services/mockDataStore');

const isMongo = () => mongoose.connection.readyState === 1;

/**
 * Helper to convert Devanagari numerals to standard Western digits
 */
function convertDevanagariNumerals(str) {
  if (!str) return '';
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let result = str;
  devanagariDigits.forEach((d, i) => {
    result = result.split(d).join(String(i));
  });
  return result;
}

/**
 * Voice Transcription Parser for Blood Glucose
 * POST /api/glucose/parse-voice
 * 
 * Supports:
 * - English: "My sugar is 245", "fasting 110", "blood sugar 180 after dinner"
 * - Hindi: "मेरा शुगर 245 है", "शुगर 280", "फास्टिंग 105", "खाने के बाद 190"
 * - Marathi: "माझी साखर २४५ आहे", "साखर २८०", "जेवणानंतर २००"
 */
router.post('/parse-voice', (req, res) => {
  try {
    const { transcript = '', language = 'en' } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Voice transcript is required.' });
    }

    const normalized = convertDevanagariNumerals(transcript.trim().toLowerCase());
    console.log(`🎙️ [Voice Parser] Input [${language}]: "${transcript}" -> Normalized: "${normalized}"`);

    // Match numeric glucose values (typically 40 to 600 mg/dL)
    const matches = normalized.match(/\b\d{2,3}\b/g);
    let detectedValue = null;

    if (matches && matches.length > 0) {
      // Find candidate in realistic glucose range (40 - 600)
      const validCandidates = matches
        .map(Number)
        .filter(n => n >= 40 && n <= 600);

      if (validCandidates.length > 0) {
        detectedValue = validCandidates[0];
      }
    }

    // Detect meal context from keywords across English, Hindi, Marathi
    let mealContext = 'random';
    if (
      normalized.includes('fasting') || 
      normalized.includes('empty stomach') || 
      normalized.includes('फास्टिंग') || 
      normalized.includes('खाली पेट') || 
      normalized.includes('उपाशी पोटी')
    ) {
      mealContext = 'fasting';
    } else if (
      normalized.includes('after meal') || 
      normalized.includes('after food') || 
      normalized.includes('after dinner') || 
      normalized.includes('after lunch') || 
      normalized.includes('खाने के बाद') || 
      normalized.includes('जेवणानंतर')
    ) {
      mealContext = 'after_meal';
    } else if (
      normalized.includes('before meal') || 
      normalized.includes('before dinner') || 
      normalized.includes('before lunch') || 
      normalized.includes('खाने से पहले') || 
      normalized.includes('जेवणापूर्वी')
    ) {
      mealContext = 'before_meal';
    } else if (
      normalized.includes('bedtime') || 
      normalized.includes('night') || 
      normalized.includes('सोने से पहले') || 
      normalized.includes('झोपण्यापूर्वी')
    ) {
      mealContext = 'bedtime';
    }

    res.json({
      status: 'ok',
      detectedValue,
      mealContext,
      confidence: detectedValue ? 0.95 : 0.2,
      rawTranscript: transcript,
      confirmationPrompt: detectedValue 
        ? `Confirm blood glucose: ${detectedValue} mg/dL (${mealContext})?` 
        : 'Could not detect a clear glucose number. Please repeat or enter manually.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Log Glucose Reading
 * POST /api/glucose
 * 
 * Runs deterministic safety/risk engine and triggers caregiver escalation when configured.
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      patientId,
      value,
      unit = 'mg/dL',
      mealContext = 'fasting',
      source = 'manual',
      notes = '',
      symptoms = []
    } = req.body;

    const numValue = Number(value);
    if (!numValue || isNaN(numValue) || numValue < 20 || numValue > 800) {
      return res.status(400).json({ error: 'Please enter a valid blood sugar reading between 20 and 800 mg/dL.' });
    }

    let targetPatientId = patientId;
    if (!targetPatientId && req.user?.id) {
      targetPatientId = req.user.id;
    }

    if (!isMongo()) {
      const senior = mockStore.getSenior(targetPatientId);
      const riskAssessment = evaluateGlucoseRisk({
        value: numValue,
        mealContext,
        patientProfile: senior,
        symptoms
      });

      const reading = mockStore.addReading({
        patientId: senior._id,
        value: numValue,
        unit,
        mealContext,
        source,
        notes,
        symptoms,
        riskAssessment: {
          level: riskAssessment.level,
          reason: riskAssessment.reason,
          supportingData: riskAssessment.supportingData,
          suggestedAction: riskAssessment.suggestedAction,
          escalationRequired: riskAssessment.escalationRequired,
          escalationSent: riskAssessment.escalationRequired
        }
      });

      if (riskAssessment.escalationRequired) {
        mockStore.addNotification({
          patientId: senior._id,
          recipientPhone: senior.caregiverPhone,
          recipientName: senior.caregiverName,
          channel: 'whatsapp',
          alertType: 'high_glucose',
          title: 'High Glucose Alert',
          body: `DiaCare Alert: ${senior.name} recorded ${numValue} mg/dL (${mealContext}). Level: ${riskAssessment.level}. Action: ${riskAssessment.suggestedAction}`
        });
      }

      return res.status(201).json({
        status: 'ok',
        reading,
        riskAssessment,
        escalationSent: riskAssessment.escalationRequired,
        explanation: {
          title: riskAssessment.level === 'NORMAL' 
            ? 'Reading In Target Range' 
            : 'Reading Outside Configured Range',
          why: riskAssessment.explanationText,
          nextStep: riskAssessment.suggestedAction,
          configuredRange: riskAssessment.targetRange
        }
      });
    }

    // Load senior profile for clinician targets
    let senior = null;
    if (targetPatientId && mongoose.Types.ObjectId.isValid(targetPatientId)) {
      senior = await SeniorProfile.findById(targetPatientId);
    }
    if (!senior) {
      senior = await SeniorProfile.findOne();
    }

    // 1. Run Deterministic Risk Engine (NO LLM decides risk level)
    const riskAssessment = evaluateGlucoseRisk({
      value: numValue,
      mealContext,
      patientProfile: senior,
      symptoms
    });

    console.log(`🛡️ [Risk Engine] Evaluated ${numValue} mg/dL (${mealContext}) -> Level: ${riskAssessment.level}`);

    // 2. Persist Reading
    const reading = new GlucoseReading({
      patientId: senior?._id || targetPatientId,
      value: numValue,
      unit,
      mealContext,
      source,
      notes,
      symptoms,
      riskAssessment: {
        level: riskAssessment.level,
        reason: riskAssessment.reason,
        supportingData: riskAssessment.supportingData,
        suggestedAction: riskAssessment.suggestedAction,
        escalationRequired: riskAssessment.escalationRequired,
        escalationSent: false
      }
    });

    await reading.save();

    // 3. Log Risk Event for Clinical Review if attention or above
    if (riskAssessment.level !== 'NORMAL' && senior) {
      await RiskEvent.create({
        patientId: senior._id,
        glucoseReadingId: reading._id,
        level: riskAssessment.level,
        glucoseValue: numValue,
        mealContext,
        reason: riskAssessment.reason,
        supportingData: riskAssessment.supportingData,
        suggestedAction: riskAssessment.suggestedAction,
        escalationRequired: riskAssessment.escalationRequired,
        caregiverNotified: false
      });
    }

    // 4. Caregiver Escalation via WhatsApp when configured and required
    let escalationSent = false;
    if (
      riskAssessment.escalationRequired && 
      senior?.consentSettings?.caregiverSharing && 
      senior?.consentSettings?.whatsappAlerts
    ) {
      const recipientPhone = senior.caregiverPhone || senior.emergencyContact?.phone || '+919876543210';
      const alertMsg = `⚠️ DiaCare Alert: High Glucose\n\n` +
        `Patient: ${senior.name}\n` +
        `Reading: ${numValue} mg/dL (${mealContext})\n` +
        `Level: ${riskAssessment.level}\n` +
        `Reason: ${riskAssessment.reason}\n\n` +
        `Action: ${riskAssessment.suggestedAction}\n` +
        `Please check on them.`;

      await sendWhatsAppNotification({
        toNumber: recipientPhone,
        messageBody: alertMsg,
        patientId: senior._id,
        recipientType: 'caregiver',
        recipientName: senior.caregiverName || 'Caregiver',
        triggerReason: riskAssessment.level === 'URGENT' ? 'urgent_glucose' : 'high_glucose'
      });

      escalationSent = true;
      reading.riskAssessment.escalationSent = true;
      await reading.save();
    }

    res.status(201).json({
      status: 'ok',
      reading,
      riskAssessment,
      escalationSent,
      explanation: {
        title: riskAssessment.level === 'NORMAL' 
          ? 'Reading In Target Range' 
          : 'Reading Outside Configured Range',
        why: riskAssessment.explanationText,
        nextStep: riskAssessment.suggestedAction,
        configuredRange: riskAssessment.targetRange
      }
    });
  } catch (err) {
    console.error('Glucose log error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get Glucose History for Patient
 * GET /api/glucose/patient/:patientId
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { days = 30, limit = 50 } = req.query;

    if (!isMongo()) {
      const readings = mockStore.getReadings(patientId, Number(days) || 30);
      return res.json({ status: 'ok', count: readings.length, readings });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const readings = await GlucoseReading.find({
      patientId,
      timestamp: { $gte: startDate }
    })
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({
      status: 'ok',
      count: readings.length,
      readings
    });
  } catch (err) {
    const readings = mockStore.getReadings(req.params.patientId, 30);
    res.json({ status: 'ok', count: readings.length, readings });
  }
});

/**
 * Get 7-Day & 30-Day Trends for Patient
 * GET /api/glucose/trends/:patientId
 */
router.get('/trends/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!isMongo()) {
      const senior = mockStore.getSenior(patientId);
      const readings7d = mockStore.getReadings(patientId, 7);
      const readings30d = mockStore.getReadings(patientId, 30);
      const trends7d = calculateGlucoseTrends(readings7d, senior?.targetGlucose);
      const trends30d = calculateGlucoseTrends(readings30d, senior?.targetGlucose);
      const chartData = readings7d.map(r => ({
        date: new Date(r.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: r.value,
        context: r.mealContext,
        status: r.riskAssessment?.level || 'NORMAL'
      }));

      return res.json({
        status: 'ok',
        senior: {
          id: senior._id,
          name: senior.name,
          targetRange: senior.targetGlucose
        },
        trends7d,
        trends30d,
        chartData
      });
    }

    let senior = null;
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      senior = await SeniorProfile.findById(patientId);
    } else {
      senior = await SeniorProfile.findOne({ demoKey: patientId }) || await SeniorProfile.findOne();
    }
    const resolvedPatientId = senior?._id || patientId;

    // 7-day query
    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const readings7d = await GlucoseReading.find({
      patientId: resolvedPatientId,
      timestamp: { $gte: d7 }
    }).sort({ timestamp: 1 });

    // 30-day query
    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const readings30d = await GlucoseReading.find({
      patientId: resolvedPatientId,
      timestamp: { $gte: d30 }
    }).sort({ timestamp: 1 });

    const trends7d = calculateGlucoseTrends(readings7d, senior?.targetGlucose);
    const trends30d = calculateGlucoseTrends(readings30d, senior?.targetGlucose);

    // Format daily timeline for chart visualization
    const chartData = readings7d.map(r => ({
      date: new Date(r.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: r.value,
      context: r.mealContext,
      status: r.riskAssessment?.level || 'NORMAL'
    }));

    res.json({
      status: 'ok',
      senior: {
        id: senior?._id,
        name: senior?.name,
        targetRange: senior?.targetGlucose
      },
      trends7d,
      trends30d,
      chartData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Explainability Endpoint
 * GET /api/glucose/explain/:readingId
 */
router.get('/explain/:readingId', async (req, res) => {
  try {
    const { readingId } = req.params;

    if (!isMongo()) {
      const reading = mockStore.readings.find(r => r._id === readingId) || mockStore.readings.find(r => r.value === 280) || mockStore.readings[0];
      const senior = mockStore.getSenior(reading?.patientId);
      const evaluation = evaluateGlucoseRisk({
        value: reading.value,
        mealContext: reading.mealContext,
        patientProfile: senior,
        symptoms: reading.symptoms
      });

      return res.json({
        status: 'ok',
        readingValue: reading.value,
        mealContext: reading.mealContext,
        timestamp: reading.timestamp,
        level: evaluation.level,
        explanation: {
          headline: evaluation.level === 'NORMAL' 
            ? 'Your blood sugar is within your healthy target.' 
            : 'Your reading is above your configured range.',
          why: evaluation.explanationText,
          ruleMatched: evaluation.matchedRule,
          targetRangeUsed: evaluation.targetRange,
          nextStep: evaluation.suggestedAction,
          escalationSent: reading.riskAssessment?.escalationSent || false
        }
      });
    }

    const reading = await GlucoseReading.findById(readingId).populate('patientId');

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    const patient = reading.patientId;
    const evaluation = evaluateGlucoseRisk({
      value: reading.value,
      mealContext: reading.mealContext,
      patientProfile: patient,
      symptoms: reading.symptoms
    });

    res.json({
      status: 'ok',
      readingValue: reading.value,
      mealContext: reading.mealContext,
      timestamp: reading.timestamp,
      level: evaluation.level,
      explanation: {
        headline: evaluation.level === 'NORMAL' 
          ? 'Your blood sugar is within your healthy target.' 
          : 'Your reading is above your configured range.',
        why: evaluation.explanationText,
        ruleMatched: evaluation.matchedRule,
        targetRangeUsed: evaluation.targetRange,
        nextStep: evaluation.suggestedAction,
        escalationSent: reading.riskAssessment?.escalationSent || false
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
