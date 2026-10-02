const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  specialization: { type: String, default: 'Consultant Diabetologist & Geriatric Care' },
  medicalRegNumber: { type: String, default: 'MCI-84729-D' },
  clinicName: { type: String, default: 'Apex Senior Diabetes Clinic' },
  contactPhone: { type: String },
  patientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', doctorSchema);
