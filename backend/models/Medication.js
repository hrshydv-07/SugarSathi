const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile', required: true },
  name: { type: String, required: true, trim: true }, // e.g. "Metformin 500mg"
  dosage: { type: String, required: true, trim: true }, // "1 tablet"
  timing: { 
    type: String, 
    enum: ['morning', 'afternoon', 'evening', 'night'], 
    default: 'morning' 
  },
  scheduledTime: { type: String, default: '08:00' }, // "08:00", "13:00", "20:00"
  mealRelation: { 
    type: String, 
    enum: ['before_meal', 'after_meal', 'with_meal', 'anytime'], 
    default: 'after_meal' 
  },
  prescribedBy: { type: String, default: 'Clinician prescribed' },
  instructions: { type: String, default: 'Take with full glass of water' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

medicationSchema.index({ patientId: 1, active: 1 });

module.exports = mongoose.model('Medication', medicationSchema);
