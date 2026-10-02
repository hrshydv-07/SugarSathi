const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SeniorProfile = require('../models/SeniorProfile');
const GlucoseReading = require('../models/GlucoseReading');
const Reminder = require('../models/Reminder');
const Medication = require('../models/Medication');
const SymptomLog = require('../models/SymptomLog');
const RiskEvent = require('../models/RiskEvent');
const { calculateGlucoseTrends } = require('../services/riskEngine');
const mockStore = require('../services/mockDataStore');

const isMongo = () => mongoose.connection.readyState === 1;

/**
 * Get Comprehensive 1-Page Doctor Report Data
 * GET /api/doctors/patient/:patientId/report
 */
router.get('/patient/:patientId/report', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { days = 7 } = req.query;

    if (!isMongo()) {
      const senior = mockStore.getSenior(patientId);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const readings = mockStore.getReadings(patientId, Number(days));
      const trends = calculateGlucoseTrends(readings, senior.targetGlucose);
      const medications = mockStore.getMedications(patientId);

      const reportData = {
        reportId: `DC-DOC-${Date.now().toString().slice(-6)}`,
        generatedAt: new Date().toISOString(),
        reportingPeriod: `Past ${days} Days (${startDate.toLocaleDateString()} to ${new Date().toLocaleDateString()})`,
        patient: {
          id: senior._id,
          name: senior.name,
          age: senior.age,
          gender: senior.gender || 'Male',
          phoneNumber: senior.phoneNumber,
          diabetesType: senior.diabetesType,
          diagnosisYear: senior.diagnosisYear,
          clinicianName: senior.doctorName || 'Dr. S. Rao, MD',
          caregiverName: senior.caregiverName,
          caregiverPhone: senior.caregiverPhone,
          targetRange: senior.targetGlucose
        },
        glucoseSummary: {
          totalReadings: trends.count,
          averageGlucose: trends.average,
          minGlucose: trends.min,
          maxGlucose: trends.max,
          timeInRangePercent: trends.timeInRangePercent,
          fastingAverage: trends.fastingAverage,
          postMealAverage: trends.postMealAverage,
          trendDirection: trends.trendDirection,
          urgentEventsCount: trends.urgentEventsCount
        },
        readingsTimeline: readings.map(r => ({
          date: new Date(r.timestamp).toLocaleDateString(),
          time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: r.value,
          context: r.mealContext,
          status: r.riskAssessment?.level || 'NORMAL',
          notes: r.notes || ''
        })),
        medicationSummary: {
          activeMedications: medications.map(m => ({
            name: m.name,
            dosage: m.dosageText || m.dosage,
            timing: m.mealRelation || 'with meals'
          })),
          totalScheduledDoses: 14,
          takenDoses: 12,
          missedDoses: 2,
          adherenceRate: 86
        },
        reportedSymptoms: mockStore.symptoms,
        riskEventsSummary: [
          {
            date: new Date(Date.now() - 7200000).toLocaleDateString(),
            time: new Date(Date.now() - 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            level: 'HIGH',
            glucoseValue: 280,
            mealContext: 'after_meal',
            reason: 'Above configured post-meal target (180 mg/dL)',
            suggestedAction: 'Hydrate and follow clinician plan',
            escalationSent: true
          }
        ],
        caregiverNotificationStatus: {
          whatsappConsentActive: true,
          caregiverName: senior.caregiverName,
          caregiverPhone: senior.caregiverPhone,
          recentEscalationsCount: 1
        },
        clinicalDisclaimers: [
          'Generated automatically from patient/caregiver-entered data via DiaCare Senior.',
          'Not a standalone diagnostic test or clinical judgment. Must be reviewed by the treating clinician.',
          'Configured targets derived from ADA / RSSDI geriatric diabetes clinical consensus guidelines.'
        ]
      };

      return res.json({ status: 'ok', report: reportData, reportData: reportData });
    }

    let senior = null;
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      senior = await SeniorProfile.findById(patientId);
    }
    if (!senior) {
      senior = await SeniorProfile.findOne({ demoKey: patientId }) || await SeniorProfile.findOne();
    }
    if (!senior) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // 1. Glucose Readings & Trends
    const readings = await GlucoseReading.find({
      patientId: senior._id,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    const trends = calculateGlucoseTrends(readings, senior.targetGlucose);

    // 2. Active Medications
    const medications = await Medication.find({ patientId: senior._id, active: true });

    // 3. Medication Adherence
    const pastReminders = await Reminder.find({
      patientId: senior._id,
      type: 'medication',
      scheduledTime: { $gte: startDate, $lte: new Date() }
    });
    const totalDoses = pastReminders.length;
    const takenDoses = pastReminders.filter(r => r.status === 'TAKEN' || r.acknowledged).length;
    const missedDoses = pastReminders.filter(r => r.status === 'MISSED').length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    // 4. Symptoms Checked
    const symptoms = await SymptomLog.find({
      patientId: senior._id,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });

    // 5. Risk Events
    const riskEvents = await RiskEvent.find({
      patientId: senior._id,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });

    const reportData = {
      reportId: `DC-DOC-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      reportingPeriod: `Past ${days} Days (${startDate.toLocaleDateString()} to ${new Date().toLocaleDateString()})`,
      patient: {
        id: senior._id,
        name: senior.name,
        age: senior.age,
        gender: senior.gender,
        phoneNumber: senior.phoneNumber,
        diabetesType: senior.diabetesType,
        diagnosisYear: senior.diagnosisYear,
        clinicianName: senior.doctorName,
        caregiverName: senior.caregiverName,
        caregiverPhone: senior.caregiverPhone,
        targetRange: senior.targetGlucose
      },
      glucoseSummary: {
        totalReadings: trends.count,
        averageGlucose: trends.average,
        minGlucose: trends.min,
        maxGlucose: trends.max,
        timeInRangePercent: trends.timeInRangePercent,
        fastingAverage: trends.fastingAverage,
        postMealAverage: trends.postMealAverage,
        trendDirection: trends.trendDirection,
        urgentEventsCount: trends.urgentEventsCount
      },
      readingsTimeline: readings.map(r => ({
        date: new Date(r.timestamp).toLocaleDateString(),
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: r.value,
        mealContext: r.mealContext,
        riskLevel: r.riskAssessment?.level || 'NORMAL'
      })),
      medications: medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        timing: m.timing,
        mealRelation: m.mealRelation
      })),
      adherence: {
        totalScheduled: totalDoses,
        takenCount: takenDoses,
        missedCount: missedDoses,
        percentage: adherenceRate
      },
      symptomCheckIns: symptoms.map(s => ({
        timestamp: s.timestamp,
        symptoms: s.symptoms,
        severity: s.severity
      })),
      flaggedRiskEvents: riskEvents.map(re => ({
        timestamp: re.timestamp,
        level: re.level,
        value: re.glucoseValue,
        reason: re.reason,
        suggestedAction: re.suggestedAction
      })),
      consentStatus: {
        doctorReportSharingConsented: senior.consentSettings?.doctorReportSharing ?? true,
        caregiverSharingConsented: senior.consentSettings?.caregiverSharing ?? true
      },
      clinicalDisclaimers: [
        'Generated from patient-entered and caregiver-monitored logs.',
        'Not an autonomous diagnostic report.',
        'Intended to support clinician review during regular follow-up consultations.'
      ]
    };

    res.json({
      status: 'ok',
      report: reportData,
      reportData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
