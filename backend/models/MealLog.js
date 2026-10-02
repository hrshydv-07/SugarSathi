const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeniorProfile', required: true },
  mealType: { 
    type: String, 
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'festival_fasting'], 
    default: 'breakfast' 
  },
  foodItems: [{ type: String }],
  description: { type: String, trim: true },
  estimatedCarbsLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'unknown'], 
    default: 'medium' 
  },
  isFastingDay: { type: Boolean, default: false },
  fastingNote: { type: String }, // e.g. "Navratri fast - sabudana/nuts guidance"
  timestamp: { type: Date, default: Date.now }
});

mealLogSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('MealLog', mealLogSchema);
