const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const SeniorProfile = require('./models/SeniorProfile');
const Caregiver = require('./models/Caregiver');
const Doctor = require('./models/Doctor');
const Medication = require('./models/Medication');
const Reminder = require('./models/Reminder');
const GlucoseReading = require('./models/GlucoseReading');
const SymptomLog = require('./models/SymptomLog');
const MealLog = require('./models/MealLog');
const ActivityLog = require('./models/ActivityLog');
const RiskEvent = require('./models/RiskEvent');
const Notification = require('./models/Notification');
const { evaluateGlucoseRisk } = require('./services/riskEngine');

async function seedDatabase() {
  console.log('🌱 Starting DiaCare Senior synthetic dataset initialization...');

  try {
    // 1. Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      SeniorProfile.deleteMany({}),
      Caregiver.deleteMany({}),
      Doctor.deleteMany({}),
      Medication.deleteMany({}),
      Reminder.deleteMany({}),
      GlucoseReading.deleteMany({}),
      SymptomLog.deleteMany({}),
      MealLog.deleteMany({}),
      ActivityLog.deleteMany({}),
      RiskEvent.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🧹 Purged existing collections.');

    const defaultHashedPin = await bcrypt.hash('1234', 10);
    const defaultHashedPw = await bcrypt.hash('demo123', 10);

    // 2. Create Doctors
    const doctor = await Doctor.create({
      name: 'Dr. S. Rao, MD (Diabetology & Geriatric Medicine)',
      email: 'dr.rao@apexhealth.in',
      specialization: 'Consultant Diabetologist & Senior Care Specialist',
      medicalRegNumber: 'MCI-84729-D',
      clinicName: 'Apex Senior Diabetes Clinic, Mumbai',
      contactPhone: '+91 98200 11223'
    });

    // 3. Create Caregivers
    const caregiverPriya = await Caregiver.create({
      name: 'Priya Patel',
      email: 'priya.caregiver@diacare.local',
      password: defaultHashedPw,
      role: 'family',
      relationToPatient: 'Daughter',
      contact: '+91 98765 43210',
      notificationPreference: 'whatsapp'
    });

    const caregiverRajesh = await Caregiver.create({
      name: 'Rajesh Deshmukh',
      email: 'rajesh.deshmukh@diacare.local',
      password: defaultHashedPw,
      role: 'family',
      relationToPatient: 'Son',
      contact: '+91 98111 22334',
      notificationPreference: 'whatsapp'
    });

    // 4. Create 3 Synthetic Senior Profiles (Phase 23)
    // Profile A: Ramesh Patel (Hindi, 68yo, T2D + Hypertension)
    const seniorA = await SeniorProfile.create({
      name: 'Ramesh Patel',
      age: 68,
      gender: 'Male',
      phoneNumber: '+91 98765 11111',
      pin: defaultHashedPin,
      preferredLanguage: 'hi',
      diabetesType: 'Type 2',
      diagnosisYear: 2017,
      targetGlucose: {
        fastingMin: 80,
        fastingMax: 130,
        postMealMin: 80,
        postMealMax: 180,
        urgentLowThreshold: 54,
        urgentHighThreshold: 300
      },
      caregiverId: caregiverPriya._id,
      caregiverName: 'Priya Patel',
      caregiverPhone: '+91 98765 43210',
      caregiverEmail: 'priya.caregiver@diacare.local',
      caregiverRelation: 'Daughter',
      doctorId: doctor._id,
      doctorName: doctor.name,
      emergencyContact: {
        name: 'Priya Patel (Daughter)',
        phone: '+91 98765 43210',
        relation: 'Primary Family Contact'
      },
      quietHours: { enabled: true, startTime: '22:00', endTime: '07:00' },
      notificationSettings: { whatsappEnabled: true, inAppEnabled: true, maxRemindersPerDay: 6 },
      consentSettings: {
        caregiverSharing: true,
        doctorReportSharing: true,
        whatsappAlerts: true,
        voiceDataProcessing: true
      },
      isDemoProfile: true,
      demoKey: 'senior_a'
    });

    // Profile B: Kamalabai Deshmukh (Marathi, 72yo, T2D)
    const seniorB = await SeniorProfile.create({
      name: 'Kamalabai Deshmukh',
      age: 72,
      gender: 'Female',
      phoneNumber: '+91 98765 22222',
      pin: defaultHashedPin,
      preferredLanguage: 'mr',
      diabetesType: 'Type 2',
      diagnosisYear: 2014,
      targetGlucose: {
        fastingMin: 85,
        fastingMax: 135,
        postMealMin: 85,
        postMealMax: 185,
        urgentLowThreshold: 54,
        urgentHighThreshold: 290
      },
      caregiverId: caregiverRajesh._id,
      caregiverName: 'Rajesh Deshmukh',
      caregiverPhone: '+91 98111 22334',
      caregiverEmail: 'rajesh.deshmukh@diacare.local',
      caregiverRelation: 'Son',
      doctorId: doctor._id,
      doctorName: doctor.name,
      emergencyContact: {
        name: 'Rajesh Deshmukh (Son)',
        phone: '+91 98111 22334',
        relation: 'Primary Caregiver'
      },
      quietHours: { enabled: true, startTime: '21:30', endTime: '06:30' },
      consentSettings: {
        caregiverSharing: true,
        doctorReportSharing: true,
        whatsappAlerts: true,
        voiceDataProcessing: true
      },
      isDemoProfile: true,
      demoKey: 'senior_b'
    });

    // Profile C: George Thomas (English, 65yo, Mild T2D)
    const seniorC = await SeniorProfile.create({
      name: 'George Thomas',
      age: 65,
      gender: 'Male',
      phoneNumber: '+91 98765 33333',
      pin: defaultHashedPin,
      preferredLanguage: 'en',
      diabetesType: 'Type 2',
      diagnosisYear: 2021,
      targetGlucose: {
        fastingMin: 80,
        fastingMax: 130,
        postMealMin: 80,
        postMealMax: 180,
        urgentLowThreshold: 54,
        urgentHighThreshold: 300
      },
      caregiverName: 'Mary Thomas',
      caregiverPhone: '+91 98222 33445',
      caregiverEmail: 'mary.thomas@diacare.local',
      caregiverRelation: 'Spouse',
      doctorId: doctor._id,
      doctorName: doctor.name,
      emergencyContact: {
        name: 'Mary Thomas (Spouse)',
        phone: '+91 98222 33445',
        relation: 'Spouse'
      },
      quietHours: { enabled: true, startTime: '22:30', endTime: '07:00' },
      consentSettings: {
        caregiverSharing: true,
        doctorReportSharing: true,
        whatsappAlerts: true,
        voiceDataProcessing: true
      },
      isDemoProfile: true,
      demoKey: 'senior_c'
    });

    // Link patients to caregivers
    caregiverPriya.patientIds = [seniorA._id];
    await caregiverPriya.save();
    caregiverRajesh.patientIds = [seniorB._id];
    await caregiverRajesh.save();

    doctor.patientIds = [seniorA._id, seniorB._id, seniorC._id];
    await doctor.save();

    console.log('✅ Created 3 Synthetic Senior Profiles (Ramesh, Kamalabai, George).');

    // 5. Seed Medications for Senior A (Ramesh)
    const med1 = await Medication.create({
      patientId: seniorA._id,
      name: 'Metformin 500mg',
      dosage: '1 tablet',
      timing: 'morning',
      scheduledTime: '08:00',
      mealRelation: 'after_meal',
      instructions: 'Take immediately after breakfast with a full glass of water'
    });

    const med2 = await Medication.create({
      patientId: seniorA._id,
      name: 'Glimepiride 1mg',
      dosage: '1 tablet',
      timing: 'morning',
      scheduledTime: '08:00',
      mealRelation: 'before_meal',
      instructions: 'Take 15 minutes before morning breakfast'
    });

    const med3 = await Medication.create({
      patientId: seniorA._id,
      name: 'Telmisartan 40mg',
      dosage: '1 tablet',
      timing: 'evening',
      scheduledTime: '20:00',
      mealRelation: 'after_meal',
      instructions: 'Blood pressure control after dinner'
    });

    // Seed Medications for Senior B (Kamalabai)
    await Medication.create({
      patientId: seniorB._id,
      name: 'Teneligliptin 20mg',
      dosage: '1 tablet',
      timing: 'morning',
      scheduledTime: '08:30',
      mealRelation: 'after_meal',
      instructions: 'Take with morning warm water'
    });
    await Medication.create({
      patientId: seniorB._id,
      name: 'Lantus Insulin',
      dosage: '14 Units SubQ',
      timing: 'night',
      scheduledTime: '21:00',
      mealRelation: 'anytime',
      instructions: 'Subcutaneous injection before sleep'
    });

    // Seed Medications for Senior C (George)
    await Medication.create({
      patientId: seniorC._id,
      name: 'Metformin 500mg ER',
      dosage: '1 tablet',
      timing: 'morning',
      scheduledTime: '08:00',
      mealRelation: 'after_meal',
      instructions: 'Take with morning oats or breakfast'
    });

    console.log('✅ Created prescribed medications.');

    // 6. Generate 14 Days of Realistic Glucose Readings for Senior A
    const now = new Date();
    const readingPlansA = [
      { daysAgo: 13, value: 112, ctx: 'fasting' },
      { daysAgo: 13, value: 168, ctx: 'after_meal' },
      { daysAgo: 12, value: 118, ctx: 'fasting' },
      { daysAgo: 12, value: 172, ctx: 'after_meal' },
      { daysAgo: 11, value: 105, ctx: 'fasting' },
      { daysAgo: 11, value: 158, ctx: 'after_meal' },
      { daysAgo: 10, value: 122, ctx: 'fasting' },
      { daysAgo: 10, value: 184, ctx: 'after_meal' },
      { daysAgo: 9, value: 115, ctx: 'fasting' },
      { daysAgo: 9, value: 164, ctx: 'after_meal' },
      { daysAgo: 8, value: 108, ctx: 'fasting' },
      { daysAgo: 8, value: 175, ctx: 'after_meal' },
      { daysAgo: 7, value: 126, ctx: 'fasting' },
      { daysAgo: 7, value: 190, ctx: 'after_meal' },
      { daysAgo: 6, value: 114, ctx: 'fasting' },
      { daysAgo: 6, value: 162, ctx: 'after_meal' },
      { daysAgo: 5, value: 109, ctx: 'fasting' },
      { daysAgo: 5, value: 178, ctx: 'after_meal' },
      { daysAgo: 4, value: 120, ctx: 'fasting' },
      { daysAgo: 4, value: 185, ctx: 'after_meal' },
      { daysAgo: 3, value: 116, ctx: 'fasting' },
      { daysAgo: 3, value: 245, ctx: 'after_meal', note: 'Family dinner celebration' },
      { daysAgo: 2, value: 124, ctx: 'fasting' },
      { daysAgo: 2, value: 170, ctx: 'after_meal' },
      { daysAgo: 1, value: 118, ctx: 'fasting' },
      { daysAgo: 1, value: 165, ctx: 'after_meal' },
      // Today: Fasting reading ready, post-meal pending
      { daysAgo: 0, hoursAgo: 4, value: 122, ctx: 'fasting', note: 'Morning routine' }
    ];

    for (const plan of readingPlansA) {
      const ts = new Date(now);
      if (plan.daysAgo) ts.setDate(ts.getDate() - plan.daysAgo);
      if (plan.hoursAgo) ts.setHours(ts.getHours() - plan.hoursAgo);

      const risk = evaluateGlucoseRisk({
        value: plan.value,
        mealContext: plan.ctx,
        patientProfile: seniorA
      });

      const reading = await GlucoseReading.create({
        patientId: seniorA._id,
        value: plan.value,
        unit: 'mg/dL',
        mealContext: plan.ctx,
        timestamp: ts,
        source: plan.daysAgo === 0 ? 'voice' : 'manual',
        notes: plan.note || '',
        riskAssessment: {
          level: risk.level,
          reason: risk.reason,
          supportingData: risk.supportingData,
          suggestedAction: risk.suggestedAction,
          escalationRequired: risk.escalationRequired,
          escalationSent: risk.escalationRequired
        }
      });

      if (risk.level !== 'NORMAL') {
        await RiskEvent.create({
          patientId: seniorA._id,
          glucoseReadingId: reading._id,
          level: risk.level,
          glucoseValue: plan.value,
          mealContext: plan.ctx,
          reason: risk.reason,
          supportingData: risk.supportingData,
          suggestedAction: risk.suggestedAction,
          escalationRequired: risk.escalationRequired,
          caregiverNotified: true,
          timestamp: ts
        });
      }
    }

    // 7. Seed Glucose Readings for Senior B (Kamalabai - including mild low)
    const readingPlansB = [
      { daysAgo: 5, value: 110, ctx: 'fasting' },
      { daysAgo: 4, value: 155, ctx: 'after_meal' },
      { daysAgo: 3, value: 65, ctx: 'fasting', note: 'Felt slight dizziness in the morning' },
      { daysAgo: 2, value: 118, ctx: 'fasting' },
      { daysAgo: 1, value: 142, ctx: 'after_meal' },
      { daysAgo: 0, hoursAgo: 2, value: 125, ctx: 'fasting' }
    ];
    for (const plan of readingPlansB) {
      const ts = new Date(now);
      if (plan.daysAgo) ts.setDate(ts.getDate() - plan.daysAgo);
      const risk = evaluateGlucoseRisk({ value: plan.value, mealContext: plan.ctx, patientProfile: seniorB });
      await GlucoseReading.create({
        patientId: seniorB._id,
        value: plan.value,
        mealContext: plan.ctx,
        timestamp: ts,
        notes: plan.note || '',
        riskAssessment: {
          level: risk.level,
          reason: risk.reason,
          suggestedAction: risk.suggestedAction,
          escalationRequired: risk.escalationRequired
        }
      });
    }

    // 8. Seed Reminders & Missed Dose for Senior A (Ready for Demo)
    const todayMorning = new Date();
    todayMorning.setHours(8, 0, 0, 0);

    // Morning medicine - Taken
    await Reminder.create({
      patientId: seniorA._id,
      medicationId: med1._id,
      type: 'medication',
      title: 'Metformin 500mg',
      detail: 'Morning dose • After breakfast',
      scheduledTime: todayMorning,
      status: 'TAKEN',
      acknowledged: true,
      acknowledgedAt: todayMorning
    });

    // Afternoon check
    const afternoonTime = new Date();
    afternoonTime.setHours(13, 30, 0, 0);
    await Reminder.create({
      patientId: seniorA._id,
      type: 'glucose_check',
      title: 'Post-Lunch Glucose Check',
      detail: '2 hours after lunch',
      scheduledTime: afternoonTime,
      status: 'PENDING',
      acknowledged: false
    });

    // Evening dose - Pending
    const eveningTime = new Date();
    eveningTime.setHours(20, 0, 0, 0);
    await Reminder.create({
      patientId: seniorA._id,
      medicationId: med3._id,
      type: 'medication',
      title: 'Telmisartan 40mg',
      detail: 'Night dose • After dinner',
      scheduledTime: eveningTime,
      status: 'PENDING',
      acknowledged: false
    });

    // 9. Seed Past 7 Days Reminders for Senior A to achieve realistic 92% adherence
    for (let i = 1; i <= 7; i++) {
      const pastD = new Date(now);
      pastD.setDate(pastD.getDate() - i);
      pastD.setHours(8, 0, 0, 0);

      await Reminder.create({
        patientId: seniorA._id,
        medicationId: med1._id,
        type: 'medication',
        title: 'Metformin 500mg',
        scheduledTime: pastD,
        status: i === 3 ? 'MISSED' : 'TAKEN',
        acknowledged: i !== 3,
        acknowledgedAt: i !== 3 ? pastD : null,
        caregiverEscalated: i === 3
      });
    }

    // 10. Seed Symptoms, Activities, and Meals for Senior A
    await SymptomLog.create([
      {
        patientId: seniorA._id,
        symptoms: ['Feeling okay'],
        severity: 'mild',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000)
      },
      {
        patientId: seniorA._id,
        symptoms: ['Dizziness', 'Weakness'],
        severity: 'moderate',
        notes: 'Mild fatigue after afternoon walk',
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000)
      }
    ]);

    await ActivityLog.create([
      {
        patientId: seniorA._id,
        type: 'walking',
        durationMinutes: 25,
        steps: 2100,
        notes: 'Morning society park walk with neighbor',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000)
      },
      {
        patientId: seniorA._id,
        type: 'walking',
        durationMinutes: 20,
        steps: 1800,
        timestamp: new Date(Date.now() - 28 * 3600 * 1000)
      }
    ]);

    await MealLog.create([
      {
        patientId: seniorA._id,
        mealType: 'breakfast',
        foodItems: ['Vegetable Oats Upma', '1 Boiled Egg', 'Black Tea with no sugar'],
        description: 'Low glycemic breakfast',
        estimatedCarbsLevel: 'low',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000)
      },
      {
        patientId: seniorA._id,
        mealType: 'dinner',
        foodItems: ['Moong Dal Khichdi', 'Curd', 'Cucumber Salad'],
        estimatedCarbsLevel: 'medium',
        timestamp: new Date(Date.now() - 18 * 3600 * 1000)
      }
    ]);

    // 11. Seed Caregiver Notification Log
    await Notification.create([
      {
        patientId: seniorA._id,
        recipientType: 'caregiver',
        recipientName: 'Priya Patel',
        recipientContact: '+919876543210',
        channel: 'whatsapp',
        title: 'MISSED MEDICINE',
        message: 'Diabetes Care Alert: Ramesh Patel did not confirm the scheduled Telmisartan dose at 8:00 PM.',
        triggerReason: 'missed_medicine',
        status: 'mock_sent',
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000)
      },
      {
        patientId: seniorA._id,
        recipientType: 'caregiver',
        recipientName: 'Priya Patel',
        recipientContact: '+919876543210',
        channel: 'whatsapp',
        title: 'HIGH GLUCOSE ALERT',
        message: 'DiaCare Alert: Ramesh Patel recorded 245 mg/dL after dinner. Reason: Above configured target ceiling.',
        triggerReason: 'high_glucose',
        status: 'mock_sent',
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 3600000)
      }
    ]);

    console.log('🎉 DiaCare Senior Synthetic Dataset seeded successfully!');
    return {
      status: 'ok',
      seniors: [
        { name: seniorA.name, key: 'senior_a', language: 'hi', age: 68 },
        { name: seniorB.name, key: 'senior_b', language: 'mr', age: 72 },
        { name: seniorC.name, key: 'senior_c', language: 'en', age: 65 }
      ],
      caregivers: [caregiverPriya.email],
      doctor: doctor.email
    };
  } catch (err) {
    console.error('❌ Database seeding error:', err);
    throw err;
  }
}

// Allow direct execution via "node seed.js"
if (require.main === module) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diacare_senior';
  console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
  mongoose.connect(mongoUri)
    .then(async () => {
      await seedDatabase();
      await mongoose.disconnect();
      console.log('✅ Seeding finished and connection closed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('MongoDB connection failure during seed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
