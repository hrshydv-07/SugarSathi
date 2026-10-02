const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile', required: true },
  recipientType: { 
    type: String, 
    enum: ['senior', 'caregiver', 'doctor'], 
    default: 'caregiver' 
  },
  recipientName: { type: String },
  recipientContact: { type: String },
  channel: { 
    type: String, 
    enum: ['whatsapp', 'sms', 'in_app'], 
    default: 'whatsapp' 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  triggerReason: { 
    type: String, 
    enum: ['missed_medicine', 'urgent_glucose', 'high_glucose', 'symptom_alert', 'daily_summary', 'manual_escalation'], 
    default: 'missed_medicine' 
  },
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'failed', 'mock_sent'], 
    default: 'mock_sent' 
  },
  providerResponse: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

notificationSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
