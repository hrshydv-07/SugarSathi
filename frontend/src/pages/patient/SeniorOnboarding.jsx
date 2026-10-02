import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { registerSeniorApi } from '../../services/api';
import { 
  Heart, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  User, 
  Phone, 
  Clock, 
  Pill, 
  Volume2 
} from 'lucide-react';

export default function SeniorOnboarding() {
  const navigate = useNavigate();
  const { setCurrentSenior, setCurrentRole } = useApp();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: 68,
    phoneNumber: '',
    pin: '1234',
    preferredLanguage: 'hi',
    diabetesType: 'Type 2',
    diagnosisYear: 2018,
    targetGlucose: {
      fastingMin: 80,
      fastingMax: 130,
      postMealMin: 80,
      postMealMax: 180
    },
    medicineName: 'Metformin 500mg',
    medicineTiming: 'morning',
    caregiverName: '',
    caregiverPhone: '',
    caregiverEmail: '',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => {
    if (step === 1 && (!formData.name.trim() || !formData.phoneNumber.trim())) {
      alert('Please enter your name and phone number.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        age: Number(formData.age),
        phoneNumber: formData.phoneNumber.trim(),
        pin: formData.pin,
        preferredLanguage: formData.preferredLanguage,
        diabetesType: formData.diabetesType,
        diagnosisYear: Number(formData.diagnosisYear),
        targetGlucose: formData.targetGlucose,
        caregiverName: formData.caregiverName,
        caregiverPhone: formData.caregiverPhone,
        caregiverEmail: formData.caregiverEmail,
        emergencyContact: {
          name: formData.caregiverName || 'Primary Family Caregiver',
          phone: formData.caregiverPhone || formData.phoneNumber,
          relation: 'Caregiver'
        },
        quietHours: {
          enabled: true,
          startTime: formData.quietHoursStart,
          endTime: formData.quietHoursEnd
        },
        consentSettings: {
          caregiverSharing: true,
          doctorReportSharing: true,
          whatsappAlerts: true,
          voiceDataProcessing: true
        }
      };

      const res = await registerSeniorApi(payload);
      if (res.senior) {
        setCurrentSenior(res.senior);
        setCurrentRole('SENIOR');
        localStorage.setItem('diacare_senior', JSON.stringify(res.senior));
        localStorage.setItem('diacare_token', res.token);
        navigate('/patient');
      }
    } catch (err) {
      alert('Onboarding error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>DiaCare Senior Onboarding</span>
          <span className="text-teal-700">Step {step} of 3</span>
        </div>

        {/* STEP 1: Basic Senior Profile & Preferred Language */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Welcome to DiaCare Senior
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Let's set up your personalized diabetes care profile.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Your Full Name (आपका नाम / तुमचे नाव)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Patel"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Age (आयु / वय)
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+91 98765 00000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Preferred Voice & App Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'hi', label: 'हिन्दी (Hindi)' },
                  { key: 'mr', label: 'मराठी (Marathi)' },
                  { key: 'en', label: 'English' }
                ].map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, preferredLanguage: l.key })}
                    className={`py-3.5 rounded-2xl border font-bold text-sm cursor-pointer transition-all ${
                      formData.preferredLanguage === l.key
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Diabetes Type & Clinician-Prescribed Targets */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Diabetes Clinical Targets
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Enter the targets recommended by your treating doctor.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Diabetes Classification
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Type 2', 'Type 1', 'Pre-diabetes'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, diabetesType: t })}
                    className={`py-3.5 rounded-2xl border font-bold text-sm cursor-pointer transition-all ${
                      formData.diabetesType === t
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
              <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wider">
                Clinician-Configured Safe Targets (mg/dL)
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fasting Ceiling</label>
                  <input
                    type="number"
                    value={formData.targetGlucose.fastingMax}
                    onChange={(e) => setFormData({
                      ...formData,
                      targetGlucose: { ...formData.targetGlucose, fastingMax: Number(e.target.value) }
                    })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-base font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Post-Meal Ceiling</label>
                  <input
                    type="number"
                    value={formData.targetGlucose.postMealMax}
                    onChange={(e) => setFormData({
                      ...formData,
                      targetGlucose: { ...formData.targetGlucose, postMealMax: Number(e.target.value) }
                    })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-base font-bold text-slate-900"
                  />
                </div>
              </div>
              <p className="text-[11px] text-teal-800 italic">
                * Safe geriatric default is 80–180 mg/dL.
              </p>
            </div>

            {/* Prescribed Medicine Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Primary Prescribed Medicine
              </label>
              <input
                type="text"
                value={formData.medicineName}
                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                placeholder="e.g. Metformin 500mg"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-base font-bold text-slate-900"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Caregiver Connection & Quiet Hours */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Connected Caregiver
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Your family member who will receive safety alerts if doses are missed.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Caregiver Name (e.g. Daughter / Son / Spouse)
              </label>
              <input
                type="text"
                value={formData.caregiverName}
                onChange={(e) => setFormData({ ...formData, caregiverName: e.target.value })}
                placeholder="e.g. Priya Patel (Daughter)"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-base font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Caregiver WhatsApp Phone Number
              </label>
              <input
                type="text"
                value={formData.caregiverPhone}
                onChange={(e) => setFormData({ ...formData, caregiverPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-base font-bold text-slate-900"
              />
            </div>

            {/* Quiet Hours */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider block">
                Night Quiet Hours (No Non-Urgent Notifications)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Sleep Time</label>
                  <input
                    type="time"
                    value={formData.quietHoursStart}
                    onChange={(e) => setFormData({ ...formData, quietHoursStart: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Wake Time</label>
                  <input
                    type="time"
                    value={formData.quietHoursEnd}
                    onChange={(e) => setFormData({ ...formData, quietHoursEnd: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 text-amber-700 mt-0.5" />
              <span>
                DiaCare Senior organizes clinician-provided data. It does NOT autonomously diagnose or alter medication dosages.
              </span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-4 flex items-center justify-between gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm cursor-pointer"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-2xl text-base touch-target-senior cursor-pointer flex items-center gap-2 shadow-md"
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinish}
              className="ml-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-2xl text-base touch-target-senior cursor-pointer flex items-center gap-2 shadow-md"
            >
              <Check size={20} />
              <span>{submitting ? 'Creating Profile...' : 'Complete Setup & Open App'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
