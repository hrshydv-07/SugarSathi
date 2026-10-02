const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile', required: true, unique: true },
  caregiverSharing: { type: Boolean, default: true },
  doctorSharing: { type: Boolean, default: true },
  whatsappAlerts: { type: Boolean, default: true },
  voiceProcessingConsent: { type: Boolean, default: true },
  emergencyContactAutoNotify: { type: Boolean, default: true },
  dataRetentionMonths: { type: Number, default: 24 },
  lastConsentedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'patient' }
});

module.exports = mongoose.model('Consent', consentSchema);
