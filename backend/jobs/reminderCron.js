const cron = require('node-cron');
const SeniorProfile = require('../models/SeniorProfile');
const Reminder = require('../models/Reminder');
const Medication = require('../models/Medication');
const { sendWhatsAppNotification } = require('../services/whatsappService');

/**
 * Checks whether current time falls within patient's configured quiet hours.
 */
function isWithinQuietHours(senior) {
  if (!senior.quietHours || !senior.quietHours.enabled) return false;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = (senior.quietHours.startTime || '22:00').split(':').map(Number);
  const [endH, endM] = (senior.quietHours.endTime || '07:00').split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    // Overnight window (e.g., 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Evaluates pending diabetes reminders, triggers reminders and escalates to caregiver if missed.
 */
async function processDiabetesReminders() {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    return; // Skip cron tick when database is not connected
  }

  const now = new Date();
  console.log(`⏰ [Reminder Engine] Evaluating scheduled reminders at ${now.toLocaleTimeString()}`);

  try {
    const seniors = await SeniorProfile.find();
    
    for (const senior of seniors) {
      // Find today's reminders that are pending
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const reminders = await Reminder.find({
        patientId: senior._id,
        scheduledTime: { $gte: startOfDay, $lte: endOfDay },
        acknowledged: false
      });

      for (const reminder of reminders) {
        const scheduledTime = new Date(reminder.scheduledTime);
        const minutesDiff = Math.floor((now - scheduledTime) / (1000 * 60));

        // Skip future reminders
        if (minutesDiff < 0) continue;

        const quiet = isWithinQuietHours(senior);

        // Stage 1: Initial Reminder (0 to 15 min after scheduled time)
        if (minutesDiff >= 0 && !reminder.firstReminderSent) {
          if (!quiet) {
            console.log(`📢 [Reminder Stage 1] Sending initial reminder to ${senior.name}: ${reminder.title}`);
            reminder.firstReminderSent = true;
            await reminder.save();
          }
        }

        // Stage 2: Second Gentle Follow-up (15 to 45 min after scheduled time)
        else if (minutesDiff >= 15 && minutesDiff < 45 && !reminder.secondReminderSent) {
          if (!quiet) {
            console.log(`📢 [Reminder Stage 2] Sending second follow-up to ${senior.name}: ${reminder.title}`);
            reminder.secondReminderSent = true;
            await reminder.save();
          }
        }

        // Stage 3: Caregiver Escalation (>45 min overdue and still unacknowledged)
        else if (minutesDiff >= 45 && !reminder.caregiverEscalated) {
          reminder.status = 'MISSED';
          reminder.caregiverEscalated = true;
          reminder.caregiverEscalatedAt = now;
          await reminder.save();

          // Dispatch caregiver WhatsApp alert if consent is active
          if (senior.consentSettings?.caregiverSharing && senior.consentSettings?.whatsappAlerts) {
            const timeStr = scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const message = `🔔 DiaCare Senior Alert\n\n${senior.name} has not confirmed their scheduled ${reminder.title} (${reminder.detail || 'medication'}) scheduled for ${timeStr}.\n\nPlease check in with them to ensure their health routine is maintained.`;

            await sendWhatsAppNotification({
              toNumber: senior.caregiverPhone || senior.emergencyContact?.phone || '+919876543210',
              messageBody: message,
              patientId: senior._id,
              recipientType: 'caregiver',
              recipientName: senior.caregiverName || 'Caregiver',
              triggerReason: 'missed_medicine'
            });
            console.log(`🚨 [Caregiver Escalation] Missed dose alert sent for ${senior.name}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ [Reminder Engine] Error processing reminders:', err.message);
  }
}

/**
 * Initializes cron jobs for periodic reminder checks.
 */
function initReminderCron() {
  // Check every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    processDiabetesReminders();
  });
  console.log('✅ [Cron] Diabetes reminder & escalation worker scheduled (every 5 minutes).');
}

module.exports = {
  initReminderCron,
  processDiabetesReminders,
  isWithinQuietHours
};