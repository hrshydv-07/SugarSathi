/**
 * DiaCare Senior - In-Memory Resilient Mock Data Store
 * Used automatically when MongoDB is offline / unprovisioned
 * Provides full end-to-end functionality for live hackathon judging and testing.
 */

const { evaluateGlucoseRisk, computeTimeInRange } = require('./riskEngine');

const mockStore = {
  isMockActive: true,
  seniors: [
    {
      _id: 'mock_senior_a',
      demoKey: 'senior_a',
      name: 'Ramesh Patel',
      age: 68,
      gender: 'Male',
      phoneNumber: '+91 98765 11111',
      pin: '1234',
      preferredLanguage: 'hi',
      diabetesType: 'Type 2',
      diagnosisYear: 2017,
      isDemoProfile: true,
      targetGlucose: {
        fastingMin: 80,
        fastingMax: 130,
        postMealMin: 80,
        postMealMax: 180,
        urgentLowThreshold: 54,
        urgentHighThreshold: 300
      },
      caregiverId: 'mock_caregiver_priya',
      caregiverName: 'Priya Patel',
      caregiverPhone: '+91 98765 43210',
      caregiverEmail: 'priya.caregiver@diacare.local',
      caregiverRelation: 'Daughter',
      doctorId: 'mock_doc_1',
      doctorName: 'Dr. S. Rao, MD',
      emergencyContact: {
        name: 'Priya Patel',
        phone: '+91 98765 43210',
        relation: 'Daughter'
      },
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '07:00'
      },
      consentSettings: {
        caregiverSharing: true,
        doctorReportSharing: true,
        whatsappAlerts: true,
        voiceDataProcessing: true
      },
      medicalHistory: ['Hypertension', 'Mild Peripheral Neuropathy'],
      createdAt: new Date()
    },
    {
      _id: 'mock_senior_b',
      demoKey: 'senior_b',
      name: 'Kamalabai Deshmukh',
      age: 72,
      gender: 'Female',
      phoneNumber: '+91 98765 22222',
      pin: '1234',
      preferredLanguage: 'mr',
      diabetesType: 'Type 2 (Insulin dependent)',
      diagnosisYear: 2012,
      isDemoProfile: true,
      targetGlucose: {
        fastingMin: 90,
        fastingMax: 140,
        postMealMin: 90,
        postMealMax: 190,
        urgentLowThreshold: 60,
        urgentHighThreshold: 310
      },
      caregiverId: 'mock_caregiver_rajesh',
      caregiverName: 'Rajesh Deshmukh',
      caregiverPhone: '+91 98111 22334',
      caregiverEmail: 'rajesh.deshmukh@diacare.local',
      caregiverRelation: 'Son',
      doctorId: 'mock_doc_1',
      doctorName: 'Dr. S. Rao, MD',
      emergencyContact: {
        name: 'Rajesh Deshmukh',
        phone: '+91 98111 22334',
        relation: 'Son'
      },
      quietHours: {
        enabled: true,
        startTime: '21:30',
        endTime: '06:30'
      },
      consentSettings: {
        caregiverSharing: true,
        doctorReportSharing: true,
        whatsappAlerts: true,
        voiceDataProcessing: true
      },
      medicalHistory: ['Arthritis', 'Type 2 Diabetes'],
      createdAt: new Date()
    },
    {
      _id: 'mock_senior_c',
      demoKey: 'senior_c',
      name: 'George Thomas',
      age: 65,
      gender: 'Male',
      phoneNumber: '+91 98765 33333',
      pin: '1234',
      preferredLanguage: 'en',
      diabetesType: 'Type 2 (Diet & Oral)',
      diagnosisYear: 2021,
      isDemoProfile: true,
      targetGlucose: {
        fastingMin: 80,
        fastingMax: 130,
        postMealMin: 80,
        postMealMax: 180,
        urgentLowThreshold: 55,
        urgentHighThreshold: 290
      },
      caregiverId: 'mock_caregiver_mary',
      caregiverName: 'Mary Thomas',
      caregiverPhone: '+91 98333 44556',
      caregiverEmail: 'mary.thomas@diacare.local',
      caregiverRelation: 'Spouse',
      doctorId: 'mock_doc_1',
      doctorName: 'Dr. S. Rao, MD',
      emergencyContact: {
        name: 'Mary Thomas',
        phone: '+91 98333 44556',
        relation: 'Spouse'
      },
      quietHours: {
        enabled: true,
        startTime: '22:30',
        endTime: '07:00'
      },
      consentSettings: {
        caregiverSharing: true,
        doctorReportSharing: true,
        whatsappAlerts: true,
        voiceDataProcessing: true
      },
      medicalHistory: ['Hyperlipidemia'],
      createdAt: new Date()
    }
  ],

  medications: [
    {
      _id: 'mock_med_1',
      patientId: 'mock_senior_a',
      name: 'Metformin 500mg',
      dosageText: '1 tablet twice daily with meals',
      scheduledTimes: ['08:30', '20:30'],
      mealRelation: 'with_meal',
      purpose: 'Blood sugar control',
      active: true,
      lastConfirmedAt: new Date(Date.now() - 3600000)
    },
    {
      _id: 'mock_med_2',
      patientId: 'mock_senior_a',
      name: 'Telmisartan 40mg',
      dosageText: '1 tablet in the morning after breakfast',
      scheduledTimes: ['09:00'],
      mealRelation: 'after_meal',
      purpose: 'Blood pressure control',
      active: true,
      lastConfirmedAt: new Date(Date.now() - 7200000)
    },
    {
      _id: 'mock_med_3',
      patientId: 'mock_senior_a',
      name: 'Glimepiride 1mg',
      dosageText: '1 tablet 15 mins before breakfast',
      scheduledTimes: ['08:00'],
      mealRelation: 'before_meal',
      purpose: 'Stimulates insulin release',
      active: true
    }
  ],

  reminders: [
    {
      _id: 'mock_rem_1',
      patientId: 'mock_senior_a',
      medicationId: 'mock_med_3',
      medicationName: 'Glimepiride 1mg',
      dosageText: '1 tablet 15 mins before breakfast',
      scheduledTime: '08:00',
      scheduledDate: new Date(),
      status: 'taken',
      takenAt: new Date(Date.now() - 14400000),
      caregiverEscalated: false
    },
    {
      _id: 'mock_rem_2',
      patientId: 'mock_senior_a',
      medicationId: 'mock_med_1',
      medicationName: 'Metformin 500mg',
      dosageText: '1 tablet with dinner',
      scheduledTime: '20:30',
      scheduledDate: new Date(),
      status: 'pending',
      caregiverEscalated: false
    }
  ],

  readings: [],
  symptoms: [
    {
      _id: 'mock_sym_1',
      patientId: 'mock_senior_a',
      symptoms: ['Mild Dizziness', 'Unusual thirst'],
      severity: 'moderate',
      loggedAt: new Date(Date.now() - 86400000)
    }
  ],
  meals: [
    {
      _id: 'mock_meal_1',
      patientId: 'mock_senior_a',
      mealType: 'breakfast',
      description: '2 Moong Dal Chilla + Mint Chutney + 1 cup tea without sugar',
      portion: 'medium',
      estimatedCarbs: 'moderate',
      loggedAt: new Date(Date.now() - 18000000)
    }
  ],
  activities: [
    {
      _id: 'mock_act_1',
      patientId: 'mock_senior_a',
      activityType: 'walking',
      durationMinutes: 25,
      steps: 2450,
      intensity: 'light',
      loggedAt: new Date(Date.now() - 10000000)
    }
  ],
  notifications: [
    {
      _id: 'mock_notif_1',
      patientId: 'mock_senior_a',
      recipientPhone: '+91 98765 43210',
      recipientName: 'Priya Patel',
      channel: 'whatsapp',
      alertType: 'missed_medication',
      title: 'Diabetes Medication Alert',
      body: 'DiaCare Senior Alert: Ramesh Patel has not confirmed the scheduled medicine Metformin 500mg at 8:30 AM.',
      status: 'delivered',
      createdAt: new Date(Date.now() - 3600000)
    }
  ]
};

// Seed 14 days of realistic glucose readings for Senior A
function initMockReadings() {
  const readings = [];
  const baseDate = new Date();
  
  // 14 days of history
  for (let d = 13; d >= 0; d--) {
    const dayDate = new Date(baseDate.getTime() - d * 86400000);
    
    // Fasting (8am)
    const fastingVal = Math.round(110 + (Math.sin(d) * 18) + (d === 1 ? 40 : 0));
    const fastingReading = {
      _id: `mock_reading_f_${d}`,
      patientId: 'mock_senior_a',
      value: fastingVal,
      unit: 'mg/dL',
      mealContext: 'fasting',
      source: 'manual',
      timestamp: new Date(dayDate.setHours(8, 15, 0, 0)),
      notes: d === 1 ? 'Slightly high after wedding feast' : 'Routine morning reading',
      riskAssessment: evaluateGlucoseRisk({ value: fastingVal, mealContext: 'fasting' })
    };
    readings.push(fastingReading);

    // Post-Lunch (2pm)
    const postVal = Math.round(145 + (Math.cos(d) * 25) + (d === 2 ? 65 : 0));
    const postReading = {
      _id: `mock_reading_p_${d}`,
      patientId: 'mock_senior_a',
      value: postVal,
      unit: 'mg/dL',
      mealContext: 'after_meal',
      source: d % 3 === 0 ? 'voice' : 'manual',
      timestamp: new Date(dayDate.setHours(14, 30, 0, 0)),
      notes: postVal > 200 ? 'Recorded via voice after lunch' : 'After lunch',
      riskAssessment: evaluateGlucoseRisk({ value: postVal, mealContext: 'after_meal' })
    };
    readings.push(postReading);
  }

  // Add the demo elevated reading from prompt: 280 mg/dL post-dinner
  const highReading = {
    _id: 'mock_reading_demo_high',
    patientId: 'mock_senior_a',
    value: 280,
    unit: 'mg/dL',
    mealContext: 'after_meal',
    source: 'voice',
    timestamp: new Date(Date.now() - 7200000),
    notes: 'Voice input: "Mera sugar 280 hai" after dinner',
    riskAssessment: evaluateGlucoseRisk({ value: 280, mealContext: 'after_meal' })
  };
  readings.push(highReading);

  mockStore.readings = readings;
}

initMockReadings();

// Data helper methods for routes
mockStore.getSenior = function(id) {
  return mockStore.seniors.find(s => s._id === id || s.demoKey === id) || mockStore.seniors[0];
};

mockStore.getReadings = function(patientId, days = 30) {
  const limitDate = new Date(Date.now() - days * 86400000);
  return mockStore.readings.filter(r => new Date(r.timestamp) >= limitDate);
};

mockStore.addReading = function(data) {
  const newReading = {
    _id: 'mock_reading_' + Date.now(),
    timestamp: new Date(),
    ...data
  };
  mockStore.readings.unshift(newReading);
  return newReading;
};

mockStore.getMedications = function(patientId) {
  return mockStore.medications;
};

mockStore.getReminders = function(patientId) {
  return mockStore.reminders;
};

mockStore.addNotification = function(notif) {
  const item = {
    _id: 'mock_notif_' + Date.now(),
    createdAt: new Date(),
    ...notif
  };
  mockStore.notifications.unshift(item);
  return item;
};

module.exports = mockStore;
