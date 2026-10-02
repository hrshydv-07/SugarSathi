const express = require('express');
const router = express.Router();
const SeniorProfile = require('../models/SeniorProfile');
const { seedDatabase } = require('../seed');

/**
 * Get Available Demo Profiles
 * GET /api/demo/profiles
 */
router.get('/profiles', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const mockStore = require('../services/mockDataStore');

    let seniors = [];
    if (mongoose.connection.readyState === 1) {
      try {
        seniors = await SeniorProfile.find({ isDemoProfile: true });
      } catch (err) {
        console.warn('MongoDB query failed, using mock profiles:', err.message);
      }
    }

    const profiles = [
      {
        key: 'senior_a',
        id: seniors[0]?._id || 'mock_senior_a',
        name: 'Ramesh Patel',
        age: 68,
        conditions: 'Type 2 Diabetes + Hypertension',
        preferredLanguage: 'hi',
        languageLabel: 'Hindi (हिन्दी)',
        pin: '1234',
        phone: '+91 98765 11111',
        caregiver: 'Priya Patel (Daughter)',
        demoScenario: 'Speaks "Mera sugar 280 hai", gets deterministic elevated alert & explanation, simulates missed medicine with caregiver WhatsApp escalation.'
      },
      {
        key: 'senior_b',
        id: seniors[1]?._id || 'mock_senior_b',
        name: 'Kamalabai Deshmukh',
        age: 72,
        conditions: 'Type 2 Diabetes (Insulin dependent)',
        preferredLanguage: 'mr',
        languageLabel: 'Marathi (मराठी)',
        pin: '1234',
        phone: '+91 98765 22222',
        caregiver: 'Rajesh Deshmukh (Son)',
        demoScenario: 'Speaks "माझी साखर ६५ आहे", triggers mild hypoglycemia safety protocol (carbs + 15 min recheck).'
      },
      {
        key: 'senior_c',
        id: seniors[2]?._id || 'mock_senior_c',
        name: 'George Thomas',
        age: 65,
        conditions: 'Type 2 Diabetes (Lifestyle & Oral)',
        preferredLanguage: 'en',
        languageLabel: 'English',
        pin: '1234',
        phone: '+91 98765 33333',
        caregiver: 'Mary Thomas (Spouse)',
        demoScenario: 'Speaks "My sugar is 125 fasting", gets In-Target positive feedback and weekly adherence summary.'
      }
    ];

    res.json({
      status: 'ok',
      profiles,
      database: mongoose.connection.readyState === 1 ? 'connected' : 'mock_demo_store',
      caregiverAccount: {
        email: 'priya.caregiver@diacare.local',
        password: 'demo123',
        role: 'Caregiver'
      },
      doctorAccount: {
        email: 'dr.rao@apexhealth.in',
        password: 'demo123',
        role: 'Doctor'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Reset / Re-seed Demo Database on Demand
 * POST /api/demo/reset
 */
router.post('/reset', async (req, res) => {
  try {
    const result = await seedDatabase();
    res.json({
      status: 'ok',
      message: 'DiaCare Senior demo dataset re-initialized successfully.',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
