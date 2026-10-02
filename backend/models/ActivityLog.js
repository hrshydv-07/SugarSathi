const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile', required: true },
  type: { 
    type: String, 
    enum: ['walking', 'yoga', 'stretching', 'light_exercise', 'gardening', 'other'], 
    default: 'walking' 
  },
  durationMinutes: { type: Number, default: 20 },
  steps: { type: Number, default: 1500 },
  intensity: { type: String, enum: ['gentle', 'moderate', 'vigorous'], default: 'gentle' },
  notes: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now }
});

activityLogSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
