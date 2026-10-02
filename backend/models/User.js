const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, sparse: true },
  phoneNumber: { type: String, trim: true, sparse: true },
  role: { 
    type: String, 
    enum: ['SENIOR', 'CAREGIVER', 'DOCTOR', 'ADMIN'], 
    default: 'SENIOR' 
  },
  pin: { type: String }, // Hashed 4-digit PIN for seniors
  password: { type: String }, // Hashed password for caregiver/doctor
  preferredLanguage: { 
    type: String, 
    enum: ['en', 'hi', 'mr'], 
    default: 'en' 
  },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

module.exports = mongoose.model('User', userSchema);
