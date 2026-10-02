const express = require('express');
const router = express.Router();
const SeniorProfile = require('../models/SeniorProfile');
const Reminder = require('../models/Reminder');
const GlucoseReading = require('../models/GlucoseReading');
const { sendWhatsAppNotification } = require('../services/whatsappService');
const { getDiabetesAIReply } = require('../services/aiService');
const { evaluateGlucoseRisk } = require('../services/riskEngine');
require('dotenv').config();

// Webhook verification endpoint (Meta Graph API)
router.get('/incoming', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'diacare_verify_token_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ [WhatsApp Webhook] Verification successful');
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: 'Verification token mismatch' });
});

// Incoming message handler
router.post('/incoming', async (req, res) => {
  try {
    const body = req.body;
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) {
      return res.status(200).send('EVENT_RECEIVED');
    }

    const fromNumber = message.from; // Sender phone number
    const textBody = (message.text?.body || '').trim();

    console.log(`📱 [WhatsApp Incoming] From: ${fromNumber} | Text: "${textBody}"`);

    // Find senior by phone
    const senior = await SeniorProfile.findOne({
      $or: [
        { phoneNumber: new RegExp(fromNumber.slice(-10)) },
        { caregiverPhone: new RegExp(fromNumber.slice(-10)) }
      ]
    }) || await SeniorProfile.findOne();

    if (!senior) {
      return res.status(200).send('OK');
    }

    const lower = textBody.toLowerCase();

    // 1. If senior replied "DONE" or "TAKEN", mark pending medication as taken
    if (lower === 'done' || lower === 'taken' || lower.includes('दवा ले ली') || lower.includes('औषध घेतले')) {
      const pendingMed = await Reminder.findOne({
        patientId: senior._id,
        type: 'medication',
        acknowledged: false
      }).sort({ scheduledTime: 1 });

      if (pendingMed) {
        pendingMed.status = 'TAKEN';
        pendingMed.acknowledged = true;
        pendingMed.acknowledgedAt = new Date();
        await pendingMed.save();

        await sendWhatsAppNotification({
          toNumber: fromNumber,
          messageBody: `Wonderful, ${senior.name.split(' ')[0]}! 💊 Recorded ${pendingMed.title} as taken. Proud of your daily care routine! 🌸`,
          patientId: senior._id,
          triggerReason: 'daily_summary'
        });
        return res.status(200).send('OK');
      }
    }

    // 2. If message contains a number (likely glucose logging)
    const numberMatches = textBody.match(/\b\d{2,3}\b/);
    if (numberMatches) {
      const val = Number(numberMatches[0]);
      if (val >= 40 && val <= 600) {
        const risk = evaluateGlucoseRisk({ value: val, patientProfile: senior });
        await GlucoseReading.create({
          patientId: senior._id,
          value: val,
          source: 'voice',
          mealContext: lower.includes('fasting') ? 'fasting' : 'after_meal',
          riskAssessment: {
            level: risk.level,
            reason: risk.reason,
            suggestedAction: risk.suggestedAction,
            escalationRequired: risk.escalationRequired
          }
        });

        await sendWhatsAppNotification({
          toNumber: fromNumber,
          messageBody: `Blood sugar ${val} mg/dL recorded. Status: ${risk.level}.\n${risk.reason}\nNext step: ${risk.suggestedAction}`,
          patientId: senior._id,
          triggerReason: 'daily_summary'
        });
        return res.status(200).send('OK');
      }
    }

    // 3. Fall back to AI companion
    const reply = await getDiabetesAIReply({
      userMessage: textBody,
      patientId: senior._id,
      language: senior.preferredLanguage
    });

    await sendWhatsAppNotification({
      toNumber: fromNumber,
      messageBody: reply,
      patientId: senior._id,
      triggerReason: 'daily_summary'
    });

    res.status(200).send('OK');
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    res.status(500).send('ERROR');
  }
});

module.exports = router;