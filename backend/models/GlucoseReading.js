const mongoose = require('mongoose');

const glucoseReadingSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile', required: true },
  value: { type: Number, required: true }, // in mg/dL
  unit: { type: String, enum: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
  mealContext: { 
    type: String, 
    enum: ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random'], 
    default: 'fasting' 
  },
  timestamp: { type: Date, default: Date.now },
  source: { 
    type: String, 
    enum: ['voice', 'manual', 'glucometer_demo'], 
    default: 'manual' 
  },
  notes: { type: String, trim: true },
  symptoms: [{ type: String }],
  
  // Deterministic Risk Assessment Result
  riskAssessment: {
    level: { 
      type: String, 
      enum: ['NORMAL', 'ATTENTION', 'HIGH', 'URGENT'], 
      default: 'NORMAL' 
    },
    reason: { type: String },
    supportingData: { type: String },
    suggestedAction: { type: String },
    escalationRequired: { type: Boolean, default: false },
    escalationSent: { type: Boolean, default: false }
  },

  createdAt: { type: Date, default: Date.now }
});

glucoseReadingSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('GlucoseReading', glucoseReadingSchema);
