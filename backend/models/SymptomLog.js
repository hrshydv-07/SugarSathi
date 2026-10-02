const mongoose = require('mongoose');

const symptomLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile', required: true },
  symptoms: [{ 
    type: String, 
    enum: [
      'Feeling okay', 
      'Weakness', 
      'Dizziness', 
      'Sweating', 
      'Shaking', 
      'Unusual thirst', 
      'Frequent urination', 
      'Nausea', 
      'Blurred vision', 
      'Confusion',
      'Other'
    ] 
  }],
  severity: { 
    type: String, 
    enum: ['mild', 'moderate', 'severe'], 
    default: 'mild' 
  },
  notes: { type: String, trim: true },
  emergencyAlertTriggered: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

symptomLogSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('SymptomLog', symptomLogSchema);
