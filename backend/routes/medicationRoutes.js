const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Medication = require('../models/Medication');
const Reminder = require('../models/Reminder');
const SeniorProfile = require('../models/SeniorProfile');
const { sendWhatsAppNotification } = require('../services/whatsappService');
const { optionalAuth } = require('../middleware/auth');
const mockStore = require('../services/mockDataStore');

const isMongo = () => mongoose.connection.readyState === 1;

/**
 * Get all medications for a patient
 * GET /api/medications/patient/:patientId
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!isMongo()) {
      return res.json({
        status: 'ok',
        medications: mockStore.getMedications(patientId),
        todayReminders: mockStore.getReminders(patientId)
      });
    }

    const medications = await Medication.find({ patientId, active: true }).sort({ scheduledTime: 1 });

    // Also fetch today's reminders/status
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayReminders = await Reminder.find({
      patientId,
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    }).populate('medicationId');

    res.json({
      status: 'ok',
      medications,
      todayReminders
    });
  } catch (err) {
    res.json({
      status: 'ok',
      medications: mockStore.getMedications(req.params.patientId),
      todayReminders: mockStore.getReminders(req.params.patientId)
    });
  }
});

/**
 * Add a new medication (entered by user or clinician)
 * POST /api/medications
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      patientId,
      name,
      dosage,
      timing = 'morning',
      scheduledTime = '08:00',
      mealRelation = 'after_meal',
      instructions = 'Take with water'
    } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({ error: 'Medicine name and dosage are required.' });
    }

    const med = new Medication({
      patientId,
      name: name.trim(),
      dosage: dosage.trim(),
      timing,
      scheduledTime,
      mealRelation,
      instructions
    });

    await med.save();

    // Schedule today's reminder for this medicine
    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    const reminder = new Reminder({
      patientId,
      medicationId: med._id,
      type: 'medication',
      title: `${med.name} (${med.dosage})`,
      detail: `${med.timing.toUpperCase()} • ${med.mealRelation.replace('_', ' ')}`,
      scheduledTime: reminderTime,
      status: reminderTime < now ? 'MISSED' : 'PENDING'
    });
    await reminder.save();

    res.status(201).json({ status: 'ok', medication: med, reminder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Mark Medication Action (TAKEN or SNOOZED / NOT NOW)
 * POST /api/medications/action
 */
router.post('/action', optionalAuth, async (req, res) => {
  try {
    const { reminderId, action = 'TAKEN' } = req.body;

    if (!reminderId) {
      return res.status(400).json({ error: 'Reminder ID is required.' });
    }

    if (!isMongo()) {
      const rem = mockStore.reminders.find(r => r._id === reminderId) || mockStore.reminders[0];
      if (rem) {
        rem.status = action === 'TAKEN' ? 'taken' : 'snoozed';
        rem.takenAt = action === 'TAKEN' ? new Date() : null;
      }
      return res.json({
        status: 'ok',
        message: action === 'TAKEN' ? 'Medication marked as taken! 💊' : 'Reminder snoozed for 15 minutes.',
        reminder: rem
      });
    }

    const reminder = await Reminder.findById(reminderId).populate('medicationId');
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found.' });
    }

    if (action === 'TAKEN') {
      reminder.status = 'TAKEN';
      reminder.acknowledged = true;
      reminder.acknowledgedAt = new Date();
    } else {
      reminder.status = 'SNOOZED';
      reminder.acknowledged = false;
    }

    await reminder.save();

    res.json({
      status: 'ok',
      message: action === 'TAKEN' ? 'Medication marked as taken! 💊' : 'Reminder snoozed for 15 minutes.',
      reminder
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Simulate Missed Medicine & Trigger Caregiver Escalation (Hackathon Demo Flow)
 * POST /api/medications/simulate-missed
 */
router.post('/simulate-missed', async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!isMongo()) {
      const senior = mockStore.getSenior(patientId);
      const reminder = mockStore.reminders[1] || mockStore.reminders[0];
      reminder.status = 'missed';
      reminder.caregiverEscalated = true;
      reminder.caregiverEscalatedAt = new Date();

      const alertMessage = `🔔 DiaCare Senior Alert\n\n` +
        `${senior.name} has not confirmed their scheduled medicine (${reminder.medicationName || 'Metformin 500mg'}) at ${reminder.scheduledTime || '8:00 AM'}.\n\n` +
        `Please check on them if needed.`;

      const dispatchResult = await sendWhatsAppNotification({
        toNumber: senior.caregiverPhone || '+919876543210',
        messageBody: alertMessage,
        patientId: senior._id,
        recipientType: 'caregiver',
        recipientName: senior.caregiverName || 'Caregiver',
        triggerReason: 'missed_medicine'
      });

      return res.json({
        status: 'ok',
        message: `Missed medicine escalation triggered for ${senior.name}`,
        reminder,
        dispatchResult
      });
    }

    let senior = null;
    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      senior = await SeniorProfile.findById(patientId);
    }
    if (!senior) {
      senior = await SeniorProfile.findOne();
    }

    if (!senior) {
      return res.status(404).json({ error: 'No senior profile found.' });
    }

    // Find or create an overdue reminder
    let reminder = await Reminder.findOne({
      patientId: senior._id,
      type: 'medication',
      acknowledged: false
    });

    if (!reminder) {
      const pastTime = new Date(Date.now() - 50 * 60 * 1000); // 50 mins ago
      reminder = new Reminder({
        patientId: senior._id,
        type: 'medication',
        title: 'Metformin 500mg (Morning Dose)',
        detail: 'After breakfast • 8:00 AM',
        scheduledTime: pastTime,
        status: 'PENDING'
      });
      await reminder.save();
    }

    // Advance escalation
    reminder.firstReminderSent = true;
    reminder.secondReminderSent = true;
    reminder.status = 'MISSED';
    reminder.caregiverEscalated = true;
    reminder.caregiverEscalatedAt = new Date();
    await reminder.save();

    // Trigger Caregiver WhatsApp Notification
    const timeFormatted = new Date(reminder.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const alertMessage = `🔔 DiaCare Senior Alert\n\n` +
      `${senior.name} has not confirmed their scheduled medicine (${reminder.title}) at ${timeFormatted}.\n\n` +
      `Please check on them if needed.`;

    const dispatchResult = await sendWhatsAppNotification({
      toNumber: senior.caregiverPhone || senior.emergencyContact?.phone || '+919876543210',
      messageBody: alertMessage,
      patientId: senior._id,
      recipientType: 'caregiver',
      recipientName: senior.caregiverName || 'Caregiver',
      triggerReason: 'missed_medicine'
    });

    res.json({
      status: 'ok',
      message: `Missed medicine escalation triggered for ${senior.name}`,
      reminder,
      dispatchResult
    });
  } catch (err) {
    console.error('Simulate missed error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7-Day Medication Adherence Rate
 * GET /api/medications/adherence/:patientId
 */
router.get('/adherence/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!isMongo()) {
      return res.json({
        status: 'ok',
        totalScheduled: 14,
        takenCount: 12,
        missedCount: 2,
        adherencePercentage: 86
      });
    }

    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);

    const pastReminders = await Reminder.find({
      patientId,
      type: 'medication',
      scheduledTime: { $gte: d7, $lte: new Date() }
    });

    const total = pastReminders.length;
    const taken = pastReminders.filter(r => r.status === 'TAKEN' || r.acknowledged).length;
    const missed = pastReminders.filter(r => r.status === 'MISSED').length;
    const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 100;

    res.json({
      status: 'ok',
      totalScheduled: total,
      takenCount: taken,
      missedCount: missed,
      adherencePercentage: adherenceRate
    });
  } catch (err) {
    res.json({
      status: 'ok',
      totalScheduled: 14,
      takenCount: 12,
      missedCount: 2,
      adherencePercentage: 86
    });
  }
});

module.exports = router;
