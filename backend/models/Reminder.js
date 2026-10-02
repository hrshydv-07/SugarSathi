const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile', required: true },
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication' },
  type: { 
    type: String, 
    enum: ['medication', 'glucose_check', 'meal', 'walking', 'hydration', 'symptom_check', 'appointment', 'other'], 
    required: true 
  },
  title: { type: String, required: true },
  detail: { type: String },
  scheduledTime: { type: Date, required: true },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['PENDING', 'TAKEN', 'SNOOZED', 'MISSED'], 
    default: 'PENDING' 
  },
  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: { type: Date },
  
  // Escalation stages
  firstReminderSent: { type: Boolean, default: false },
  secondReminderSent: { type: Boolean, default: false },
  caregiverEscalated: { type: Boolean, default: false },
  caregiverEscalatedAt: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

reminderSchema.index({ patientId: 1, scheduledTime: 1 });
reminderSchema.index({ status: 1, scheduledTime: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);