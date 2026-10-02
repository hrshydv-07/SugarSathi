import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getMedicationsApi, getMedicationAdherenceApi } from '../../services/api';
import { 
  Pill, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  Sparkles, 
  Plus, 
  Calendar,
  Send,
  ShieldAlert,
  BellRing
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SeniorMedications() {
  const { 
    currentSenior, 
    markMedicationTaken, 
    markMedicationSnoozed, 
    triggerMissedMedicineSimulation,
    refreshTodayData 
  } = useApp();

  const [medications, setMedications] = useState([]);
  const [todayReminders, setTodayReminders] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulationTriggered, setSimulationTriggered] = useState(false);

  const patientId = currentSenior?.id || currentSenior?._id;

  const loadData = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [medRes, adhRes] = await Promise.all([
        getMedicationsApi(patientId),
        getMedicationAdherenceApi(patientId)
      ]);
      setMedications(medRes.medications || []);
      setTodayReminders(medRes.todayReminders || []);
      setAdherence(adhRes);
    } catch (err) {
      console.warn('Could not load medications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const handleSimulateMissed = async () => {
    try {
      setSimulationTriggered(true);
      await triggerMissedMedicineSimulation();
      loadData();
      refreshTodayData();
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/patient"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Back to Dashboard"
          >
            <ChevronLeft size={22} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Diabetes Medications
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Prescribed routine for {currentSenior?.name || 'Senior'}
            </p>
          </div>
        </div>

        {/* Hackathon Live Demo Button */}
        <button
          onClick={handleSimulateMissed}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
          title="Simulate missed dose and caregiver escalation"
        >
          <BellRing size={16} />
          <span>Simulate Missed Dose (Demo)</span>
        </button>
      </div>

      {/* 7-DAY ADHERENCE STATS TILE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">7-Day Adherence</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 mt-1">
            {adherence?.adherencePercentage ?? 92}%
          </div>
          <span className="text-xs text-slate-500">Scheduled doses taken on time</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Doses Confirmed</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            {adherence?.takenCount ?? 12}
          </div>
          <span className="text-xs text-slate-500">Over the past week</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Caregiver Alerts</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-700 mt-1">
            {adherence?.missedCount ?? 1}
          </div>
          <span className="text-xs text-slate-500">Missed dose follow-ups dispatched</span>
        </div>
      </div>

      {/* Simulation Result Callout if triggered */}
      {simulationTriggered && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 text-amber-950 flex items-start gap-4 animate-fade-in shadow-xs">
          <ShieldAlert size={28} className="shrink-0 text-amber-600 mt-1" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-amber-900">
              Caregiver Escalation Triggered!
            </h3>
            <p className="text-sm sm:text-base text-amber-800 leading-relaxed">
              Stage 1 (Initial reminder) & Stage 2 (Second reminder) elapsed without confirmation.
              A WhatsApp notification was dispatched to <strong>{currentSenior?.caregiverName || 'Priya Patel (Caregiver)'}</strong>:
            </p>
            <div className="bg-white/80 border border-amber-200 rounded-xl p-3 text-xs text-slate-800 font-mono mt-2">
              "Diabetes Care Alert: {currentSenior?.name || 'Ramesh Patel'} has not confirmed the scheduled medicine. Please check on them."
            </div>
            <p className="text-xs text-amber-700 font-medium pt-1">
              Switch to the <strong>Caregiver Portal</strong> from the top navbar to see the alert on the family dashboard!
            </p>
          </div>
        </div>
      )}

      {/* TODAY'S MEDICINE TIMELINE */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar size={22} className="text-teal-600" />
          <span>Today's Medicine Schedule</span>
        </h2>

        {todayReminders.length > 0 ? (
          <div className="space-y-3">
            {todayReminders.map((reminder) => {
              const isTaken = reminder.status === 'TAKEN' || reminder.acknowledged;
              const isMissed = reminder.status === 'MISSED';

              return (
                <div
                  key={reminder._id}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isTaken
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : isMissed
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-slate-50 border-slate-200 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isTaken ? 'bg-emerald-200 text-emerald-800' : isMissed ? 'bg-amber-200 text-amber-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      <Pill size={24} />
                    </div>
                    <div>
                      <div className="font-extrabold text-lg text-slate-900">
                        {reminder.title}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">
                        {new Date(reminder.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {reminder.detail || 'After meal with water'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {isTaken ? (
                      <span className="px-4 py-2 bg-emerald-200 text-emerald-900 font-bold rounded-xl text-sm flex items-center gap-1.5">
                        <CheckCircle2 size={16} />
                        <span>Confirmed Taken</span>
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={async () => {
                            await markMedicationTaken(reminder._id);
                            loadData();
                          }}
                          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-sm touch-target-senior cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                        >
                          <CheckCircle2 size={18} />
                          <span>Mark Taken</span>
                        </button>
                        <button
                          onClick={async () => {
                            await markMedicationSnoozed(reminder._id);
                            loadData();
                          }}
                          className="px-3.5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm touch-target-senior cursor-pointer"
                        >
                          Snooze
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 font-medium">
            No medicine reminders scheduled for today.
          </div>
        )}
      </section>

      {/* REGISTERED MEDICATIONS LIST */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Prescribed Medications Details
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Medications are provided by your clinician and cannot be altered autonomously by the app.
        </p>

        <div className="divide-y divide-slate-100">
          {medications.map((med) => (
            <div key={med._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  {med.name}
                </div>
                <div className="text-sm text-slate-600 font-medium mt-0.5">
                  Dosage: <strong className="text-slate-800">{med.dosage}</strong> • Timing: <strong className="capitalize text-slate-800">{med.timing}</strong> ({med.scheduledTime})
                </div>
                <div className="text-xs text-slate-500 mt-1 italic">
                  Relation to meal: {med.mealRelation?.replace('_', ' ')} • {med.instructions}
                </div>
              </div>
              <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold border border-teal-200 w-fit">
                Active Prescription
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
