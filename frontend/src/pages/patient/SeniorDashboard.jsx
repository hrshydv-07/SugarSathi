import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Pill, 
  CheckCircle2, 
  Clock, 
  Mic, 
  PhoneCall, 
  ChevronRight, 
  HelpCircle, 
  Utensils, 
  Footprints, 
  Smile, 
  Calendar,
  Volume2,
  Sparkles,
  Bot
} from 'lucide-react';
import VoiceGlucoseModal from '../../components/VoiceGlucoseModal';
import ExplanationModal from '../../components/ExplanationModal';
import EmergencyModal from '../../components/EmergencyModal';
import DiabetesAssistantModal from '../../components/DiabetesAssistantModal';
import { speakText } from '../../utils/speechUtils';

export default function SeniorDashboard() {
  const {
    todayData,
    currentSenior,
    language,
    markMedicationTaken,
    markMedicationSnoozed,
    triggerEmergency,
    setActiveExplanation,
    syncToast
  } = useApp();

  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [assistantModalOpen, setAssistantModalOpen] = useState(false);

  const latest = todayData?.latestGlucose;
  const nextMed = todayData?.nextMedicineReminder;
  const tasks = todayData?.tasks || [];
  const greeting = todayData?.greeting || `Hello, ${currentSenior?.name ? currentSenior.name.split(' ')[0] : 'Friend'}`;

  // Read aloud summary for seniors
  const handleReadAloudSummary = () => {
    let summaryText = `${greeting}. `;
    if (latest) {
      summaryText += `Your latest blood sugar was ${latest.value} mg per dL. `;
    } else {
      summaryText += `Blood sugar is not recorded yet today. `;
    }
    if (nextMed) {
      summaryText += `Your next scheduled medicine is ${nextMed.title}. `;
    } else {
      summaryText += `All scheduled medicines for today are taken. `;
    }
    speakText(summaryText, language);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Sync Toast if present */}
      {syncToast && (
        <div className="bg-teal-900 text-teal-100 px-4 py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{syncToast}</span>
        </div>
      )}

      {/* Greeting Header & Voice Read-Aloud */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Calendar size={14} />
            <span>Today's Health Routine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {greeting} ☀️
          </h1>
          <p className="text-slate-600 text-base sm:text-lg mt-1 font-medium">
            Personalized Care for <strong>{currentSenior?.name || 'Ramesh Patel'}</strong> (Age {currentSenior?.age || 68})
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Read Aloud Button */}
          <button
            onClick={handleReadAloudSummary}
            className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-base touch-target-senior cursor-pointer transition-colors"
            title="Read summary aloud"
          >
            <Volume2 size={20} className="text-teal-700" />
            <span>Read Summary</span>
          </button>

          {/* Talk to App Button */}
          <button
            onClick={() => setVoiceModalOpen(true)}
            className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-base touch-target-senior cursor-pointer shadow-md hover:shadow-lg active:scale-98 transition-all"
          >
            <Mic size={22} className="animate-pulse" />
            <span>Talk to App</span>
          </button>
        </div>
      </section>

      {/* TWO PRIMARY SENIOR CARDS: Blood Sugar & Next Medicine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: Blood Sugar */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border-2 border-slate-200 flex flex-col justify-between hover:border-teal-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity size={18} className="text-teal-600" />
                <span>Blood Sugar (रक्तातील साखर / शुगर)</span>
              </span>
              {latest && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  latest.riskAssessment?.level === 'NORMAL' || (latest.value >= 80 && latest.value <= 180)
                    ? 'bg-emerald-100 text-emerald-800'
                    : latest.value > 250
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {latest.riskAssessment?.level || 'In Target'}
                </span>
              )}
            </div>

            {latest ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                    {latest.value}
                  </span>
                  <span className="text-xl font-bold text-slate-500">mg/dL</span>
                </div>
                <p className="text-slate-600 text-base mt-2 font-medium">
                  {latest.mealContext === 'fasting' ? 'Fasting (खाली पेट / उपाशी पोटी)' : `${latest.mealContext.replace('_', ' ')}`} • {new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Explainability "Why?" Button */}
                <button
                  onClick={() => {
                    setActiveExplanation({
                      value: latest.value,
                      level: latest.riskAssessment?.level || 'NORMAL',
                      reason: latest.riskAssessment?.reason || 'Reading fits within configured safe targets.',
                      why: latest.riskAssessment?.explanationText || `Your blood sugar of ${latest.value} mg/dL was evaluated against your configured profile target range.`,
                      nextStep: latest.riskAssessment?.suggestedAction || 'Continue your regular healthy meals and walking.'
                    });
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-200 cursor-pointer"
                >
                  <HelpCircle size={16} />
                  <span>Why was this reading marked {latest.riskAssessment?.level || 'NORMAL'}?</span>
                </button>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-slate-500 text-lg font-medium">No blood sugar recorded yet today.</p>
                <p className="text-slate-400 text-sm mt-1">Tap below to log your morning fasting reading.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Mic size={20} />
              <span>Log Blood Sugar</span>
            </button>
            <Link
              to="/patient/glucose"
              className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-base touch-target-senior cursor-pointer flex items-center justify-center"
              title="View past glucose history"
            >
              Trends
            </Link>
          </div>
        </div>

        {/* CARD 2: Next Medicine */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border-2 border-slate-200 flex flex-col justify-between hover:border-teal-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Pill size={18} className="text-teal-600" />
                <span>Next Medicine (दवाई / औषध)</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                Scheduled Today
              </span>
            </div>

            {nextMed ? (
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                  {nextMed.title}
                </div>
                <div className="flex items-center gap-2 mt-2 text-slate-600 text-base font-semibold">
                  <Clock size={18} className="text-teal-600" />
                  <span>{new Date(nextMed.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {nextMed.detail || 'Take with water'}</span>
                </div>
                <p className="mt-3 text-sm text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Follow your clinician's directions. Mark below once taken.
                </p>
              </div>
            ) : (
              <div className="py-4 text-center">
                <CheckCircle2 size={42} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-slate-800 text-lg font-bold">All today's medicines confirmed taken! 💊</p>
                <p className="text-slate-500 text-sm mt-1">Great job maintaining your adherence routine.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            {nextMed ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => markMedicationTaken(nextMed._id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  <span>Taken (दवा ले ली)</span>
                </button>
                <button
                  onClick={() => markMedicationSnoozed(nextMed._id)}
                  className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm touch-target-senior cursor-pointer"
                >
                  Not Now
                </button>
              </div>
            ) : (
              <Link
                to="/patient/medicines"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View Full Medicine Routine</span>
                <ChevronRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* TODAY'S 5 CORE TASKS (Medicine, Glucose, Meal, Walk, Symptoms) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Today's Daily Checklist
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              5 simple steps to stay healthy and avoid blood sugar spikes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {tasks.map((task) => (
            <Link
              key={task.id}
              to={task.actionRoute}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${
                task.completed
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 hover:border-teal-400 hover:bg-white text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  task.completed ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-700 group-hover:bg-teal-100 group-hover:text-teal-700'
                }`}>
                  {task.completed ? <CheckCircle2 size={22} /> : <Clock size={20} />}
                </div>
                <div>
                  <div className="font-bold text-base leading-tight">
                    {task.title}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {task.detail}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-teal-600" />
            </Link>
          ))}
        </div>
      </section>

      {/* QUICK ACCESS ACTION STRIP: Food Guidance, Activity, Symptoms, Weekly Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/patient/meals"
          className="bg-white hover:bg-teal-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 text-slate-900 shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Utensils size={24} />
          </div>
          <span className="font-bold text-base">Indian Food</span>
          <span className="text-xs text-slate-500 mt-0.5">Diabetes Meals & Fasting</span>
        </Link>

        <Link
          to="/patient/activity"
          className="bg-white hover:bg-teal-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 text-slate-900 shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Footprints size={24} />
          </div>
          <span className="font-bold text-base">Walking & Exercise</span>
          <span className="text-xs text-slate-500 mt-0.5">Track daily steps</span>
        </Link>

        <Link
          to="/patient/symptoms"
          className="bg-white hover:bg-teal-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 text-slate-900 shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Smile size={24} />
          </div>
          <span className="font-bold text-base">Check Symptoms</span>
          <span className="text-xs text-slate-500 mt-0.5">Feeling dizzy or weak?</span>
        </Link>

        <Link
          to="/patient/summary"
          className="bg-white hover:bg-teal-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 text-slate-900 shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Sparkles size={24} />
          </div>
          <span className="font-bold text-base">Weekly Summary</span>
          <span className="text-xs text-slate-500 mt-0.5">Simple progress glance</span>
        </Link>
      </div>

      {/* EMERGENCY HELP CALLOUT (Phase 17) */}
      <section className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <PhoneCall size={28} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-rose-950">
              Need Urgent Help?
            </h3>
            <p className="text-rose-800 text-sm sm:text-base font-medium mt-0.5">
              Pressing this alerts your family caregiver and connects to your emergency contact.
            </p>
          </div>
        </div>

        <button
          onClick={triggerEmergency}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-4 rounded-2xl text-lg touch-target-senior cursor-pointer shadow-lg active:scale-98 transition-all shrink-0 flex items-center justify-center gap-2"
        >
          <PhoneCall size={22} />
          <span>Emergency Help</span>
        </button>
      </section>

      {/* Floating AI Assistant Launcher Button */}
      <button
        onClick={() => setAssistantModalOpen(true)}
        className="fixed bottom-6 right-6 z-30 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 active:scale-95 transition-all border-2 border-white cursor-pointer"
        aria-label="Open DiaCare diabetes AI assistant"
      >
        <Bot size={24} />
        <span className="hidden sm:inline text-sm font-semibold">Ask DiaCare</span>
      </button>

      {/* Voice Input Dialog */}
      <VoiceGlucoseModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />

      {/* Why? Explanation Modal */}
      <ExplanationModal />

      {/* Emergency Modal */}
      <EmergencyModal />

      {/* Diabetes AI Assistant Modal */}
      <DiabetesAssistantModal
        isOpen={assistantModalOpen}
        onClose={() => setAssistantModalOpen(false)}
      />
    </div>
  );
}
