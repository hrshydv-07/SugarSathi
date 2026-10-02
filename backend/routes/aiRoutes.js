const express = require('express');
const router = express.Router();
const { getDiabetesAIReply } = require('../services/aiService');
const { optionalAuth } = require('../middleware/auth');

/**
 * Diabetes AI Companion Endpoint
 * POST /api/ai/chat
 */
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, patientId, language = 'en' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const reply = await getDiabetesAIReply({
      userMessage: message,
      patientId: patientId || req.user?.id,
      language
    });

    res.json({
      status: 'ok',
      reply,
      disclaimer: 'Informational only. Never substitutes a clinician prescription.'
    });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
