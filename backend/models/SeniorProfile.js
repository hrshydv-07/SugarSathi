const mongoose = require('mongoose');

const seniorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 40, max: 120 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
  phoneNumber: { type: String, required: true, trim: true },
  pin: { type: String }, // Hashed PIN for easy senior login
  preferredLanguage: { 
    type: String, 
    enum: ['en', 'hi', 'mr'], 
    default: 'en' 
  },
  diabetesType: { 
    type: String, 
    enum: ['Type 2', 'Type 1', 'Pre-diabetes', 'Gestational', 'Other'], 
    default: 'Type 2' 
  },
  diagnosisYear: { type: Number, default: 2018 },
  
  // Clinician-Configured Glucose Targets (mg/dL) - Safe Defaults
  targetGlucose: {
    fastingMin: { type: Number, default: 80 },
    fastingMax: { type: Number, default: 130 },
    postMealMin: { type: Number, default: 80 },
    postMealMax: { type: Number, default: 180 },
    urgentLowThreshold: { type: Number, default: 54 },
    urgentHighThreshold: { type: Number, default: 300 }
  },

  // Caregiver Link
  caregiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  caregiverName: { type: String, trim: true },
  caregiverPhone: { type: String, trim: true },
  caregiverEmail: { type: String, trim: true },
  caregiverRelation: { type: String, default: 'Family' },

  // Clinician Link
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String, default: 'Dr. S. Rao, MD Diabetologist' },
  doctorPhone: { type: String },
  hospitalName: { type: String, default: 'Apex Senior Health Clinic' },

  // Emergency Contact
  emergencyContact: {
    name: { type: String, default: 'Family Caregiver' },
    phone: { type: String, default: '+91 98765 43210' },
    relation: { type: String, default: 'Daughter' }
  },

  // Quiet Hours (no non-urgent notifications)
  quietHours: {
    enabled: { type: Boolean, default: true },
    startTime: { type: String, default: '22:00' }, // 10:00 PM
    endTime: { type: String, default: '07:00' }    // 7:00 AM
  },

  // Notification Caps & Channels
  notificationSettings: {
    whatsappEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    inAppEnabled: { type: Boolean, default: true },
    maxRemindersPerDay: { type: Number, default: 8 }
  },

  // Privacy & Sharing Consents
  consentSettings: {
    caregiverSharing: { type: Boolean, default: true },
    doctorReportSharing: { type: Boolean, default: true },
    whatsappAlerts: { type: Boolean, default: true },
    voiceDataProcessing: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
  },

  // Demo seed identification
  isDemoProfile: { type: Boolean, default: false },
  demoKey: { type: String }, // 'senior_a', 'senior_b', 'senior_c'

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

seniorProfileSchema.index({ phoneNumber: 1 });
seniorProfileSchema.index({ userId: 1 });

module.exports = mongoose.model('SeniorProfile', seniorProfileSchema);
