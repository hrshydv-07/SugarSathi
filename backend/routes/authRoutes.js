const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const SeniorProfile = require('../models/SeniorProfile');
const Caregiver = require('../models/Caregiver');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { signToken, rateLimitLogin } = require('../middleware/auth');

/**
 * Senior Login via PIN and Phone or Name
 * POST /api/auth/senior/login
 */
router.post('/senior/login', rateLimitLogin, async (req, res) => {
  try {
    const { nameOrPhone, pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: '4-digit PIN is required.' });
    }

    const cleanInput = (nameOrPhone || '').trim();
    const cleanPhone = cleanInput.replace(/\D/g, '');

    // Search for senior by phone or name
    const query = {
      $or: [
        { phoneNumber: cleanInput },
        { phoneNumber: cleanPhone },
        { name: new RegExp(`^${cleanInput}$`, 'i') }
      ]
    };

    let senior = await SeniorProfile.findOne(query);

    // If no match found and no input given, pick first demo profile
    if (!senior && (!cleanInput || cleanInput.toLowerCase().includes('demo'))) {
      senior = await SeniorProfile.findOne({ isDemoProfile: true }) || await SeniorProfile.findOne();
    }

    if (!senior) {
      return res.status(401).json({ error: 'Senior profile not found. Please check phone number or name.' });
    }

    // Verify PIN if set
    if (senior.pin) {
      let isPinValid = false;
      if (senior.pin.startsWith('$2a$') || senior.pin.startsWith('$2b$')) {
        isPinValid = await bcrypt.compare(String(pin), senior.pin);
      } else {
        isPinValid = senior.pin === String(pin);
      }

      if (!isPinValid && String(pin) !== '1234') { // Allow 1234 as universal demo pin fallback
        return res.status(401).json({ error: 'Incorrect PIN. Try again or ask your caregiver.' });
      }
    }

    const token = signToken({
      id: senior._id,
      name: senior.name,
      role: 'SENIOR',
      language: senior.preferredLanguage
    });

    res.json({
      status: 'ok',
      token,
      senior: {
        id: senior._id,
        name: senior.name,
        age: senior.age,
        phoneNumber: senior.phoneNumber,
        preferredLanguage: senior.preferredLanguage,
        diabetesType: senior.diabetesType,
        targetGlucose: senior.targetGlucose,
        emergencyContact: senior.emergencyContact,
        caregiverName: senior.caregiverName,
        caregiverPhone: senior.caregiverPhone
      }
    });
  } catch (err) {
    console.error('Senior login error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Senior Registration & Onboarding
 * POST /api/auth/senior/register
 */
router.post('/senior/register', async (req, res) => {
  try {
    const {
      name,
      age,
      phoneNumber,
      pin,
      preferredLanguage,
      diabetesType,
      diagnosisYear,
      targetGlucose,
      caregiverName,
      caregiverPhone,
      caregiverEmail,
      emergencyContact,
      quietHours,
      consentSettings
    } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ error: 'Senior name and phone number are required.' });
    }

    const hashedPin = pin ? await bcrypt.hash(String(pin), 10) : await bcrypt.hash('1234', 10);

    const senior = new SeniorProfile({
      name: name.trim(),
      age: Number(age) || 68,
      phoneNumber: phoneNumber.trim(),
      pin: hashedPin,
      preferredLanguage: preferredLanguage || 'en',
      diabetesType: diabetesType || 'Type 2',
      diagnosisYear: Number(diagnosisYear) || 2018,
      targetGlucose: targetGlucose || {
        fastingMin: 80,
        fastingMax: 130,
        postMealMin: 80,
        postMealMax: 180,
        urgentLowThreshold: 54,
        urgentHighThreshold: 300
      },
      caregiverName,
      caregiverPhone,
      caregiverEmail,
      emergencyContact: emergencyContact || {
        name: caregiverName || 'Family Member',
        phone: caregiverPhone || phoneNumber,
        relation: 'Primary Contact'
      },
      quietHours: quietHours || { enabled: true, startTime: '22:00', endTime: '07:00' },
      consentSettings: consentSettings || {
        caregiverSharing: true,
        doctorReportSharing: true,
        whatsappAlerts: true,
        voiceDataProcessing: true
      }
    });

    await senior.save();

    const token = signToken({
      id: senior._id,
      name: senior.name,
      role: 'SENIOR',
      language: senior.preferredLanguage
    });

    res.status(201).json({
      status: 'ok',
      token,
      senior
    });
  } catch (err) {
    console.error('Senior registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Caregiver Login
 * POST /api/auth/caregiver/login
 */
router.post('/caregiver/login', rateLimitLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let caregiver = await Caregiver.findOne({ email: normalizedEmail });

    // Allow quick demo fallback if caregiver not found
    if (!caregiver && (normalizedEmail.includes('demo') || normalizedEmail.includes('caregiver'))) {
      caregiver = await Caregiver.findOne();
    }

    if (!caregiver) {
      return res.status(401).json({ error: 'Caregiver account not found.' });
    }

    if (caregiver.password && password) {
      const match = await bcrypt.compare(password, caregiver.password);
      if (!match && password !== 'demo123') {
        return res.status(401).json({ error: 'Invalid password.' });
      }
    }

    // Attach linked seniors
    const linkedPatients = await SeniorProfile.find({
      $or: [
        { _id: { $in: caregiver.patientIds || [] } },
        { caregiverEmail: normalizedEmail },
        { isDemoProfile: true }
      ]
    });

    const token = signToken({
      id: caregiver._id,
      name: caregiver.name,
      email: caregiver.email,
      role: 'CAREGIVER'
    });

    res.json({
      status: 'ok',
      token,
      caregiver: {
        id: caregiver._id,
        name: caregiver.name,
        email: caregiver.email,
        role: caregiver.role,
        patients: linkedPatients
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Quick Instant Demo Login for Hackathon
 * POST /api/auth/demo-login
 */
router.post('/demo-login', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const mockStore = require('../services/mockDataStore');
    const isMongoConnected = mongoose.connection.readyState === 1;

    const { role = 'SENIOR', profileKey = 'senior_a' } = req.body;

    if (role === 'CAREGIVER') {
      let caregiver = null;
      let seniors = [];

      if (isMongoConnected) {
        try {
          caregiver = await Caregiver.findOne();
          seniors = await SeniorProfile.find();
        } catch (e) {
          console.warn('Mongo error in caregiver demo login:', e.message);
        }
      }

      if (!caregiver) {
        caregiver = {
          _id: 'mock_caregiver_priya',
          name: 'Priya Patel',
          email: 'priya.caregiver@diacare.local',
          role: 'family',
          relationToPatient: 'Daughter',
          contact: '+91 98765 43210'
        };
        seniors = mockStore.seniors;
      }

      const token = signToken({ id: caregiver._id, name: caregiver.name, role: 'CAREGIVER' });

      return res.json({
        status: 'ok',
        token,
        role: 'CAREGIVER',
        user: caregiver,
        linkedPatients: seniors
      });
    }

    if (role === 'DOCTOR') {
      let doctor = null;
      let seniors = [];

      if (isMongoConnected) {
        try {
          doctor = await Doctor.findOne();
          seniors = await SeniorProfile.find();
        } catch (e) {
          console.warn('Mongo error in doctor demo login:', e.message);
        }
      }

      if (!doctor) {
        doctor = {
          _id: 'mock_doc_1',
          name: 'Dr. S. Rao, MD Diabetologist',
          email: 'dr.rao@apexhealth.in',
          clinicName: 'Apex Senior Health Clinic',
          specialization: 'Consultant Diabetologist & Senior Care Specialist'
        };
        seniors = mockStore.seniors;
      }

      const token = signToken({ id: doctor._id, name: doctor.name, role: 'DOCTOR' });

      return res.json({
        status: 'ok',
        token,
        role: 'DOCTOR',
        user: doctor,
        patients: seniors
      });
    }

    // Default: Senior login
    let senior = null;
    if (isMongoConnected) {
      try {
        senior = await SeniorProfile.findOne({ demoKey: profileKey }) || 
                 await SeniorProfile.findOne({ isDemoProfile: true }) || 
                 await SeniorProfile.findOne();
      } catch (e) {
        console.warn('Mongo error in senior demo login:', e.message);
      }
    }

    if (!senior) {
      senior = mockStore.seniors.find(s => s.demoKey === profileKey) || mockStore.seniors[0];
    }

    const token = signToken({
      id: senior._id,
      name: senior.name,
      role: 'SENIOR',
      language: senior.preferredLanguage
    });

    res.json({
      status: 'ok',
      token,
      role: 'SENIOR',
      senior
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
