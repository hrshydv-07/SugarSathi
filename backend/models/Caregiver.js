const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  role: { type: String, enum: ['family', 'nurse', 'caregiver', 'clinician'], default: 'family' },
  relationToPatient: { type: String, default: 'Daughter / Son' },
  contact: { type: String },
  notificationPreference: { type: String, enum: ['whatsapp', 'sms', 'in_app'], default: 'whatsapp' },
  patientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Caregiver', caregiverSchema);