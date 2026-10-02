const mongoose = require('mongoose');

const riskEventSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile', required: true },
  glucoseReadingId: { type: mongoose.Schema.Types.ObjectId, ref: 'GlucoseReading' },
  level: { 
    type: String, 
    enum: ['NORMAL', 'ATTENTION', 'HIGH', 'URGENT'], 
    required: true 
  },
  glucoseValue: { type: Number },
  mealContext: { type: String },
  reason: { type: String, required: true },
  supportingData: { type: String },
  suggestedAction: { type: String, required: true },
  escalationRequired: { type: Boolean, default: false },
  caregiverNotified: { type: Boolean, default: false },
  notificationChannel: { type: String, default: 'whatsapp' },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  timestamp: { type: Date, default: Date.now }
});

riskEventSchema.index({ patientId: 1, level: 1, timestamp: -1 });

module.exports = mongoose.model('RiskEvent', riskEventSchema);
