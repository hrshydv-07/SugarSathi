const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SeniorProfile = require('../models/SeniorProfile');
const Caregiver = require('../models/Caregiver');
const GlucoseReading = require('../models/GlucoseReading');
const Reminder = require('../models/Reminder');
const SymptomLog = require('../models/SymptomLog');
const ActivityLog = require('../models/ActivityLog');
const RiskEvent = require('../models/RiskEvent');
const Notification = require('../models/Notification');
const { calculateGlucoseTrends } = require('../services/riskEngine');
const { sendWhatsAppNotification, getRecentNotifications } = require('../services/whatsappService');
const { authenticateCaregiver, optionalAuth } = require('../middleware/auth');
const mockStore = require('../services/mockDataStore');

const isMongo = () => mongoose.connection.readyState === 1;

/**
 * Get Caregiver Profile
 * GET /api/caregivers/me
 */
router.get('/me', optionalAuth, async (req, res) => {
  try {
    if (!isMongo()) {
      return res.json({
        status: 'ok',
        caregiver: {
          _id: 'mock_caregiver_priya',
          name: 'Priya Patel',
          email: 'priya.caregiver@diacare.local',
          role: 'family',
          relationToPatient: 'Daughter',
          contact: '+91 98765 43210'
        },
        patients: mockStore.seniors
      });
    }

    let caregiver = null;
    if (req.user?.id) {
      caregiver = await Caregiver.findById(req.user.id);
    }
    if (!caregiver) {
      caregiver = await Caregiver.findOne();
    }
    const patients = await SeniorProfile.find();
    res.json({ status: 'ok', caregiver, patients });
  } catch (err) {
    res.json({
      status: 'ok',
      caregiver: {
        _id: 'mock_caregiver_priya',
        name: 'Priya Patel',
        email: 'priya.caregiver@diacare.local',
        role: 'family'
      },
      patients: mockStore.seniors
    });
  }
});

/**
 * Get All Linked Patients
 * GET /api/caregivers/patients
 */
router.get('/patients', async (req, res) => {
  try {
    if (!isMongo()) {
      return res.json({ status: 'ok', patients: mockStore.seniors });
    }
    const patients = await SeniorProfile.find().sort({ createdAt: -1 });
    res.json({ status: 'ok', patients });
  } catch (err) {
    res.json({ status: 'ok', patients: mockStore.seniors });
  }
});

/**
 * Comprehensive Patient Overview for Caregiver Dashboard
 * GET /api/caregivers/patient/:patientId/summary
 */
router.get('/patient/:patientId/summary', async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!isMongo()) {
      const senior = mockStore.getSenior(patientId);
      const readings7d = mockStore.getReadings(patientId, 7);
      const trends = calculateGlucoseTrends(readings7d, senior.targetGlucose);

      return res.json({
        status: 'ok',
        patient: {
          id: senior._id,
          name: senior.name,
          age: senior.age,
          diabetesType: senior.diabetesType,
          diagnosisYear: senior.diagnosisYear,
          preferredLanguage: senior.preferredLanguage,
          targetRange: senior.targetGlucose,
          emergencyContact: senior.emergencyContact,
          quietHours: senior.quietHours,
          consentSettings: senior.consentSettings
        },
        todayStatus: {
          latestGlucose: mockStore.readings[0] || null,
          adherenceRate: 86,
          totalMedsScheduled: 14,
          takenCount: 12,
          missedCount: 2,
          activeAlertsCount: 1
        },
        trends,
        readings: readings7d,
        riskAlerts: [
          {
            _id: 'mock_alert_1',
            level: 'HIGH',
            glucoseValue: 280,
            mealContext: 'after_meal',
            reason: 'Reading 280 mg/dL is above configured target maximum (180 mg/dL)',
            suggestedAction: 'Follow clinician diabetes plan and hydrate.',
            timestamp: new Date(Date.now() - 7200000),
            resolved: false
          }
        ],
        symptoms: mockStore.symptoms,
        activities: mockStore.activities,
        notifications: mockStore.notifications
      });
    }

    let senior = null;
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      senior = await SeniorProfile.findById(patientId);
    }
    if (!senior) {
      senior = await SeniorProfile.findOne({ demoKey: patientId }) || await SeniorProfile.findOne();
    }
    if (!senior) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);

    // 1. Latest Glucose & 7-day readings
    const readings7d = await GlucoseReading.find({
      patientId: senior._id,
      timestamp: { $gte: d7 }
    }).sort({ timestamp: -1 });
    const latestGlucose = readings7d[0] || null;

    // 2. Trends
    const trends = calculateGlucoseTrends(readings7d, senior.targetGlucose);

    // 3. Medication adherence
    const reminders7d = await Reminder.find({
      patientId: senior._id,
      type: 'medication',
      scheduledTime: { $gte: d7, $lte: new Date() }
    });
    const totalScheduled = reminders7d.length;
    const takenCount = reminders7d.filter(r => r.status === 'TAKEN' || r.acknowledged).length;
    const missedCount = reminders7d.filter(r => r.status === 'MISSED').length;
    const adherenceRate = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 100;

    // 4. Risk events & alerts
    const riskAlerts = await RiskEvent.find({
      patientId: senior._id
    }).sort({ timestamp: -1 }).limit(10);

    // 5. Recent Symptoms
    const symptoms = await SymptomLog.find({
      patientId: senior._id
    }).sort({ timestamp: -1 }).limit(5);

    // 6. Recent Activity
    const activities = await ActivityLog.find({
      patientId: senior._id
    }).sort({ timestamp: -1 }).limit(5);

    // 7. Recent WhatsApp / Notification logs
    const notifications = await Notification.find({
      patientId: senior._id
    }).sort({ timestamp: -1 }).limit(10);

    res.json({
      status: 'ok',
      patient: {
        id: senior._id,
        name: senior.name,
        age: senior.age,
        diabetesType: senior.diabetesType,
        diagnosisYear: senior.diagnosisYear,
        preferredLanguage: senior.preferredLanguage,
        targetRange: senior.targetGlucose,
        emergencyContact: senior.emergencyContact,
        quietHours: senior.quietHours,
        consentSettings: senior.consentSettings
      },
      todayStatus: {
        latestGlucose,
        adherenceRate,
        totalMedsScheduled: totalScheduled,
        takenCount,
        missedCount,
        activeAlertsCount: riskAlerts.filter(a => !a.resolved).length
      },
      trends,
      readings: readings7d.slice(0, 15),
      riskAlerts,
      symptoms,
      activities,
      notifications
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get Notifications Feed for Caregiver
 * GET /api/caregivers/notifications/:patientId
 */
router.get('/notifications/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const dbNotifs = await Notification.find({ patientId }).sort({ timestamp: -1 }).limit(20);
    const inMemoryNotifs = getRecentNotifications(patientId);

    // Combine unique
    const seenIds = new Set();
    const combined = [];
    for (const n of [...inMemoryNotifs, ...dbNotifs]) {
      const key = n.id || String(n._id);
      if (!seenIds.has(key)) {
        seenIds.add(key);
        combined.push(n);
      }
    }

    res.json({ status: 'ok', notifications: combined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Send Test Caregiver Alert
 * POST /api/caregivers/test-alert
 */
router.post('/test-alert', async (req, res) => {
  try {
    const { patientId, customMessage } = req.body;
    const senior = await SeniorProfile.findById(patientId) || await SeniorProfile.findOne();

    const message = customMessage || 
      `🔔 DiaCare Senior Test Alert\nThis is a test notification confirming your connected care line for ${senior?.name || 'Senior'}.`;

    const result = await sendWhatsAppNotification({
      toNumber: senior?.caregiverPhone || '+919876543210',
      messageBody: message,
      patientId: senior?._id,
      recipientType: 'caregiver',
      recipientName: senior?.caregiverName || 'Caregiver',
      triggerReason: 'daily_summary'
    });

    res.json({ status: 'ok', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
