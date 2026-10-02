const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SeniorProfile = require('../models/SeniorProfile');
const GlucoseReading = require('../models/GlucoseReading');
const Medication = require('../models/Medication');
const Reminder = require('../models/Reminder');
const SymptomLog = require('../models/SymptomLog');
const MealLog = require('../models/MealLog');
const ActivityLog = require('../models/ActivityLog');
const RiskEvent = require('../models/RiskEvent');
const { evaluateGlucoseRisk } = require('../services/riskEngine');
const { sendWhatsAppNotification } = require('../services/whatsappService');
const { optionalAuth } = require('../middleware/auth');
const mockStore = require('../services/mockDataStore');

const isMongo = () => mongoose.connection.readyState === 1;

/**
 * Get Senior Profile
 * GET /api/seniors/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongo()) {
      const senior = mockStore.getSenior(id);
      return res.json({ status: 'ok', senior });
    }

    let senior = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      senior = await SeniorProfile.findById(id);
    }
    if (!senior) {
      senior = await SeniorProfile.findOne();
    }
    if (!senior) {
      const fallback = mockStore.getSenior(id);
      return res.json({ status: 'ok', senior: fallback });
    }
    res.json({ status: 'ok', senior });
  } catch (err) {
    const fallback = mockStore.getSenior(req.params.id);
    res.json({ status: 'ok', senior: fallback });
  }
});

/**
 * Update Senior Profile & Consents
 * PATCH /api/seniors/:id
 */
router.patch('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date();

    const senior = await SeniorProfile.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!senior) {
      return res.status(404).json({ error: 'Senior profile not found.' });
    }

    res.json({ status: 'ok', senior });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Senior Home Screen Bundle
 * GET /api/seniors/:id/today
 * 
 * Provides:
 * - Greeting with Name
 * - Latest Blood Sugar & Status
 * - Next Medication & Today's Schedule
 * - Today's 5 Core Tasks checklist
 * - Emergency Contact
 */
router.get('/:id/today', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongo()) {
      const senior = mockStore.getSenior(id);
      const hour = new Date().getHours();
      let greeting = 'Good Morning';
      if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
      else if (hour >= 17) greeting = 'Good Evening';

      const latestGlucose = mockStore.readings[0] || null;
      const todayReminders = mockStore.reminders;
      const nextMedicineReminder = todayReminders.find(r => r.status === 'pending') || null;

      const tasks = [
        {
          id: 'task_medicine',
          title: 'Take Scheduled Medicines',
          completed: todayReminders.every(r => r.status === 'taken'),
          detail: nextMedicineReminder ? `Next: ${nextMedicineReminder.medicationName}` : 'All doses completed',
          actionRoute: '/patient/medicines'
        },
        {
          id: 'task_glucose',
          title: 'Check Blood Glucose',
          completed: Boolean(latestGlucose),
          detail: latestGlucose ? `Latest: ${latestGlucose.value} mg/dL` : 'Not recorded yet today',
          actionRoute: '/patient/glucose'
        },
        {
          id: 'task_meal',
          title: 'Log Balanced Meal',
          completed: mockStore.meals.length > 0,
          detail: 'Indian diabetes meal guidance',
          actionRoute: '/patient/meals'
        },
        {
          id: 'task_walk',
          title: 'Gentle Walk / Activity',
          completed: mockStore.activities.length > 0,
          detail: '15-20 min light walk',
          actionRoute: '/patient/activity'
        },
        {
          id: 'task_symptom',
          title: 'Daily Symptom Check',
          completed: mockStore.symptoms.length > 0,
          detail: 'How are you feeling today?',
          actionRoute: '/patient/symptoms'
        }
      ];

      return res.json({
        status: 'ok',
        greeting: `${greeting}, ${senior.name.split(' ')[0]}`,
        senior: {
          id: senior._id,
          name: senior.name,
          age: senior.age,
          preferredLanguage: senior.preferredLanguage,
          targetGlucose: senior.targetGlucose,
          emergencyContact: senior.emergencyContact
        },
        latestGlucose,
        nextMedicineReminder,
        todayReminders,
        tasks
      });
    }

    let senior = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      senior = await SeniorProfile.findById(id);
    }
    if (!senior) {
      senior = await SeniorProfile.findOne();
    }
    if (!senior) {
      senior = mockStore.getSenior(id);
    }

    // 1. Time-aware greeting
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17) greeting = 'Good Evening';

    // 2. Latest Glucose Reading
    const latestGlucose = await GlucoseReading.findOne({ patientId: senior._id }).sort({ timestamp: -1 });

    // 3. Today's Reminders and Next Medicine
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayReminders = await Reminder.find({
      patientId: senior._id,
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ scheduledTime: 1 });

    // Next pending medicine
    const nextMedicineReminder = todayReminders.find(r => r.type === 'medication' && !r.acknowledged) || null;

    // 4. Today's Tasks Summary
    const glucoseCheckedToday = await GlucoseReading.exists({
      patientId: senior._id,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    const symptomLoggedToday = await SymptomLog.exists({
      patientId: senior._id,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    const activityLoggedToday = await ActivityLog.exists({
      patientId: senior._id,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    const mealLoggedToday = await MealLog.exists({
      patientId: senior._id,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    const tasks = [
      {
        id: 'task_medicine',
        title: 'Take Scheduled Medicines',
        completed: todayReminders.filter(r => r.type === 'medication').length > 0 && 
                   todayReminders.filter(r => r.type === 'medication').every(r => r.acknowledged),
        detail: nextMedicineReminder ? `Next: ${nextMedicineReminder.title}` : 'All doses completed',
        actionRoute: '/patient/medicines'
      },
      {
        id: 'task_glucose',
        title: 'Check Blood Glucose',
        completed: Boolean(glucoseCheckedToday),
        detail: latestGlucose ? `Latest: ${latestGlucose.value} mg/dL` : 'Not recorded yet today',
        actionRoute: '/patient/glucose'
      },
      {
        id: 'task_meal',
        title: 'Log Balanced Meal',
        completed: Boolean(mealLoggedToday),
        detail: 'Indian diabetes meal guidance',
        actionRoute: '/patient/meals'
      },
      {
        id: 'task_walk',
        title: 'Gentle Walk / Activity',
        completed: Boolean(activityLoggedToday),
        detail: '15-20 min light walk',
        actionRoute: '/patient/activity'
      },
      {
        id: 'task_symptom',
        title: 'Daily Symptom Check',
        completed: Boolean(symptomLoggedToday),
        detail: 'How are you feeling today?',
        actionRoute: '/patient/symptoms'
      }
    ];

    res.json({
      status: 'ok',
      greeting: `${greeting}, ${senior.name.split(' ')[0]}`,
      senior: {
        id: senior._id,
        name: senior.name,
        age: senior.age,
        preferredLanguage: senior.preferredLanguage,
        targetGlucose: senior.targetGlucose,
        emergencyContact: senior.emergencyContact
      },
      latestGlucose,
      nextMedicineReminder,
      todayReminders,
      tasks
    });
  } catch (err) {
    const senior = mockStore.getSenior(req.params.id);
    return res.json({
      status: 'ok',
      greeting: `Welcome, ${senior.name.split(' ')[0]}`,
      senior: {
        id: senior._id,
        name: senior.name,
        age: senior.age,
        preferredLanguage: senior.preferredLanguage,
        targetGlucose: senior.targetGlucose,
        emergencyContact: senior.emergencyContact
      },
      latestGlucose: mockStore.readings[0] || null,
      nextMedicineReminder: mockStore.reminders[1] || null,
      todayReminders: mockStore.reminders,
      tasks: [
        { id: 'task_medicine', title: 'Take Scheduled Medicines', completed: false, detail: 'Metformin 500mg', actionRoute: '/patient/medicines' },
        { id: 'task_glucose', title: 'Check Blood Glucose', completed: true, detail: 'Latest: 280 mg/dL', actionRoute: '/patient/glucose' },
        { id: 'task_meal', title: 'Log Balanced Meal', completed: false, detail: 'Indian food guidance', actionRoute: '/patient/meals' },
        { id: 'task_walk', title: 'Gentle Walk / Activity', completed: false, detail: '15-20 min light walk', actionRoute: '/patient/activity' },
        { id: 'task_symptom', title: 'Daily Symptom Check', completed: false, detail: 'How are you feeling today?', actionRoute: '/patient/symptoms' }
      ]
    });
  }
});

/**
 * Record Symptom Check-in
 * POST /api/seniors/:id/symptoms
 */
router.post('/:id/symptoms', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { symptoms = [], severity = 'mild', notes = '' } = req.body;

    const senior = await SeniorProfile.findById(id);

    // Identify high-risk hypoglycemia / hyperglycemic distress signs
    const redFlagSymptoms = symptoms.filter(s => 
      ['Sweating', 'Shaking', 'Dizziness', 'Weakness', 'Confusion', 'Blurred vision'].includes(s)
    );

    const isEmergency = severity === 'severe' || redFlagSymptoms.length >= 2;

    const log = new SymptomLog({
      patientId: id,
      symptoms,
      severity,
      notes,
      emergencyAlertTriggered: isEmergency
    });
    await log.save();

    // Trigger caregiver escalation if severe distress signs
    if (isEmergency && senior?.consentSettings?.caregiverSharing) {
      const alertMsg = `⚠️ DiaCare Alert: Symptom Check\n\n` +
        `Patient: ${senior.name}\n` +
        `Reported Symptoms: ${symptoms.join(', ')}\n` +
        `Severity: ${severity.toUpperCase()}\n` +
        `Please check in on them immediately.`;

      await sendWhatsAppNotification({
        toNumber: senior.caregiverPhone || senior.emergencyContact?.phone || '+919876543210',
        messageBody: alertMsg,
        patientId: senior._id,
        recipientType: 'caregiver',
        recipientName: senior.caregiverName || 'Caregiver',
        triggerReason: 'symptom_alert'
      });
    }

    res.status(201).json({
      status: 'ok',
      symptomLog: log,
      isEmergency,
      advice: isEmergency 
        ? 'Please sit down safely, have a glass of water, and inform someone nearby. Your caregiver has been notified.' 
        : 'Thank you for checking in. Keep resting and stay hydrated.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Log Meal with Indian Food Guidance
 * POST /api/seniors/:id/meals
 */
router.post('/:id/meals', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { mealType, foodItems, description, estimatedCarbsLevel, isFastingDay, fastingNote } = req.body;

    const meal = new MealLog({
      patientId: id,
      mealType,
      foodItems,
      description,
      estimatedCarbsLevel,
      isFastingDay,
      fastingNote
    });

    await meal.save();

    res.status(201).json({
      status: 'ok',
      meal,
      guidanceNote: 'General educational guidance. Remember to stay hydrated and pair carbohydrates with protein and fiber.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Log Walking / Activity
 * POST /api/seniors/:id/activity
 */
router.post('/:id/activity', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'walking', durationMinutes = 20, steps = 1500, notes = '' } = req.body;

    const activity = new ActivityLog({
      patientId: id,
      type,
      durationMinutes: Number(durationMinutes),
      steps: Number(steps),
      notes
    });

    await activity.save();

    res.status(201).json({
      status: 'ok',
      activity,
      message: 'Great job staying active! Regular gentle walking helps maintain steady glucose levels.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Emergency Button Trigger
 * POST /api/seniors/:id/emergency
 */
router.post('/:id/emergency', async (req, res) => {
  try {
    const { id } = req.params;
    const senior = await SeniorProfile.findById(id);

    if (!senior) {
      return res.status(404).json({ error: 'Senior profile not found.' });
    }

    const recipientPhone = senior.emergencyContact?.phone || senior.caregiverPhone || '+919876543210';
    const alertMessage = `🚨 URGENT DIACARE EMERGENCY ALERT\n\n` +
      `${senior.name} has pressed the Emergency Help button on their DiaCare Senior app.\n` +
      `Timestamp: ${new Date().toLocaleTimeString()}\n` +
      `Please contact them immediately at ${senior.phoneNumber}.`;

    const dispatchResult = await sendWhatsAppNotification({
      toNumber: recipientPhone,
      messageBody: alertMessage,
      patientId: senior._id,
      recipientType: 'caregiver',
      recipientName: senior.emergencyContact?.name || senior.caregiverName || 'Emergency Contact',
      triggerReason: 'urgent_glucose'
    });

    res.json({
      status: 'ok',
      message: 'Emergency notification dispatched to your family / caregiver contact.',
      emergencyContact: senior.emergencyContact,
      dispatchResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Patient-Friendly Weekly Summary
 * GET /api/seniors/:id/summary
 */
router.get('/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;

    const senior = await SeniorProfile.findById(id);
    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);

    const readings7d = await GlucoseReading.find({ patientId: id, timestamp: { $gte: d7 } });
    const reminders7d = await Reminder.find({ patientId: id, type: 'medication', scheduledTime: { $gte: d7 } });
    const activities7d = await ActivityLog.find({ patientId: id, timestamp: { $gte: d7 } });
    const riskEvents7d = await RiskEvent.find({ patientId: id, timestamp: { $gte: d7 } });

    const totalReadings = readings7d.length;
    const totalMeds = reminders7d.length;
    const takenMeds = reminders7d.filter(r => r.status === 'TAKEN' || r.acknowledged).length;
    const medAdherence = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 100;
    const activityDays = activities7d.length;

    // Multilingual summary texts
    let summaryText = {
      title: 'Your Week at a Glance',
      sugarSummary: `${totalReadings} blood sugar readings recorded this week.`,
      medSummary: `${medAdherence}% of scheduled medicines confirmed taken.`,
      activitySummary: `${activityDays} days of healthy walking logged.`,
      safetyNote: riskEvents7d.length > 0 
        ? `${riskEvents7d.length} alerts were flagged and shared with your caregiver.` 
        : 'All readings were steady with no severe alerts this week.'
    };

    if (lang === 'hi') {
      summaryText = {
        title: 'इस सप्ताह का आपका स्वास्थ्य सारांश',
        sugarSummary: `इस सप्ताह ${totalReadings} ब्लड शुगर रीडिंग दर्ज की गईं।`,
        medSummary: `${medAdherence}% निर्धारित दवाएं समय पर ली गईं।`,
        activitySummary: `${activityDays} दिन नियमित टहलने की गतिविधि दर्ज की गई।`,
        safetyNote: riskEvents7d.length > 0 
          ? `${riskEvents7d.length} अलर्ट आपके देखभालकर्ता के साथ साझा किए गए।` 
          : 'इस सप्ताह सभी रीडिंग सामान्य और स्थिर रहीं।'
      };
    } else if (lang === 'mr') {
      summaryText = {
        title: 'तुमचा आठवड्याचा आरोग्य सारांश',
        sugarSummary: `या आठवड्यात ${totalReadings} रक्तातील साखर नोंदी केल्या.`,
        medSummary: `${medAdherence}% ठरलेली औषधे वेळेवर घेतली.`,
        activitySummary: `${activityDays} दिवस नियमित चालण्याचा व्यायाम नोंदवला.`,
        safetyNote: riskEvents7d.length > 0 
          ? `${riskEvents7d.length} इशारे काळजीवाहू व्यक्तीला पाठवले गेले.` 
          : 'या आठवड्यात सर्व नोंदी सुरक्षित आणि स्थिर राहिल्या.'
      };
    }

    res.json({
      status: 'ok',
      summary: summaryText,
      metrics: {
        totalReadings,
        medAdherence,
        activityDays,
        alertCount: riskEvents7d.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Offline Sync Queue Endpoint (Phase 19)
 * POST /api/seniors/:id/sync-offline
 */
router.post('/:id/sync-offline', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { queuedItems = [] } = req.body;

    console.log(`🔄 [Offline Sync] Processing ${queuedItems.length} queued records for Senior ${id}`);
    const syncedResults = [];

    for (const item of queuedItems) {
      if (item.type === 'glucose') {
        const risk = evaluateGlucoseRisk({
          value: item.value,
          mealContext: item.mealContext || 'fasting'
        });

        const reading = await GlucoseReading.create({
          patientId: id,
          value: item.value,
          mealContext: item.mealContext,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          source: 'manual',
          notes: item.notes || '(Recorded Offline)',
          riskAssessment: {
            level: risk.level,
            reason: risk.reason,
            suggestedAction: risk.suggestedAction,
            escalationRequired: risk.escalationRequired
          }
        });
        syncedResults.push({ type: 'glucose', id: reading._id, offlineId: item.offlineId });
      } else if (item.type === 'medication_action') {
        if (item.reminderId && mongoose.Types.ObjectId.isValid(item.reminderId)) {
          await Reminder.findByIdAndUpdate(item.reminderId, {
            status: item.action === 'TAKEN' ? 'TAKEN' : 'SNOOZED',
            acknowledged: item.action === 'TAKEN',
            acknowledgedAt: new Date(item.timestamp || Date.now())
          });
          syncedResults.push({ type: 'medication_action', id: item.reminderId, offlineId: item.offlineId });
        }
      } else if (item.type === 'symptom') {
        const log = await SymptomLog.create({
          patientId: id,
          symptoms: item.symptoms || [],
          severity: item.severity || 'mild',
          notes: item.notes || '(Recorded Offline)',
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
        });
        syncedResults.push({ type: 'symptom', id: log._id, offlineId: item.offlineId });
      }
    }

    res.json({
      status: 'ok',
      syncedCount: syncedResults.length,
      syncedResults
    });
  } catch (err) {
    console.error('Offline sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
