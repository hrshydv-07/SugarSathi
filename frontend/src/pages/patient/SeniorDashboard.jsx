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
  const greeting = todayData?.greeting || `Namaste, ${currentSenior?.name ? currentSenior.name.split(' ')[0] : 'Friend'}`;

  // Read aloud summary for seniors with vision limitations
  const handleReadAloudSummary = () => {
    let summaryText = `${greeting}. `;
    if (latest) {
      summaryText += `Your latest blood sugar was ${latest.value} milligrams per deciliter. `;
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
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-6">
      {/* Sync Toast if present */}
      {syncToast && (
        <div className="bg-teal-900 text-teal-100 border border-teal-700 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{syncToast}</span>
        </div>
      )}

      {/* Greeting Header & Voice Read-Aloud */}
      <section className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Calendar size={14} className="shrink-0" />
            <span>Today's Health Routine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F2942] tracking-tight truncate">
            {greeting} ☀️
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 font-medium">
            Daily care routine for <strong>{currentSenior?.name || 'Ramesh Patel'}</strong> (Age {currentSenior?.age || 68})
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          {/* Read Aloud Button */}
          <button
            type="button"
            onClick={handleReadAloudSummary}
            className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base touch-target-senior cursor-pointer transition-colors"
            title="Read health summary aloud"
          >
            <Volume2 size={20} className="text-teal-700 shrink-0" />
            <span>Read Summary</span>
          </button>

          {/* Talk to App Button */}
          <button
            type="button"
            onClick={() => setVoiceModalOpen(true)}
            className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base touch-target-senior cursor-pointer shadow-md hover:shadow-lg active:scale-98 transition-all"
          >
            <Mic size={22} className="animate-pulse shrink-0" />
            <span>Talk to App</span>
          </button>
        </div>
      </section>

      {/* TWO PRIMARY SENIOR CARDS: Blood Sugar & Next Medicine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* CARD 1: Blood Sugar */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border-2 border-slate-200/90 flex flex-col justify-between hover:border-teal-500 transition-all">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity size={18} className="text-teal-600 shrink-0" />
                <span>Blood Sugar (शुगर / साखर)</span>
              </span>
              {latest && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${
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
              <div className="space-y-2">
                <div className="flex items-baseline flex-wrap gap-2">
                  <span className="text-4xl sm:text-6xl font-black text-[#0F2942] tracking-tight">
                    {latest.value}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-slate-500">mg/dL</span>
                </div>
                <p className="text-slate-600 text-sm sm:text-base font-medium">
                  {latest.mealContext === 'fasting' ? 'Fasting (खाली पेट / उपाशी पोटी)' : `${latest.mealContext?.replace('_', ' ')}`} • {new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Explainability "Why?" Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveExplanation({
                      value: latest.value,
                      level: latest.riskAssessment?.level || 'NORMAL',
                      reason: latest.riskAssessment?.reason || 'Reading fits within configured safe targets.',
                      why: latest.riskAssessment?.explanationText || `Your blood sugar of ${latest.value} mg/dL was evaluated against your configured profile target range.`,
                      nextStep: latest.riskAssessment?.suggestedAction || 'Continue your regular healthy meals and walking.'
                    });
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl border border-teal-200 cursor-pointer transition-colors max-w-full text-left"
                >
                  <HelpCircle size={16} className="shrink-0" />
                  <span className="truncate">Why was this marked {latest.riskAssessment?.level || 'NORMAL'}?</span>
                </button>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-slate-700 text-lg font-bold">No blood sugar logged yet today.</p>
                <p className="text-slate-500 text-sm mt-1">Tap below to record your morning fasting reading.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Mic size={20} />
              <span>Log Reading</span>
            </button>
            <Link
              to="/patient/glucose"
              className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-sm sm:text-base touch-target-senior cursor-pointer flex items-center justify-center transition-colors"
              title="View past glucose history"
            >
              Trends
            </Link>
          </div>
        </div>

        {/* CARD 2: Next Medicine */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border-2 border-slate-200/90 flex flex-col justify-between hover:border-teal-500 transition-all">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Pill size={18} className="text-teal-600 shrink-0" />
                <span>Next Medicine (दवाई / औषध)</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 shrink-0">
                Scheduled Today
              </span>
            </div>

            {nextMed ? (
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#0F2942] leading-snug break-words">
                  {nextMed.title}
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-sm sm:text-base font-semibold">
                  <Clock size={18} className="text-teal-600 shrink-0" />
                  <span>{new Date(nextMed.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {nextMed.detail || 'Take with water'}</span>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Follow clinician directions. Confirm below once taken.
                </p>
              </div>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle2 size={42} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-slate-800 text-lg font-bold">All today's medicines confirmed! 💊</p>
                <p className="text-slate-500 text-sm mt-1">Great job maintaining your adherence routine.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            {nextMed ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => markMedicationTaken(nextMed._id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  <span>Taken (दवा ले ली)</span>
                </button>
                <button
                  type="button"
                  onClick={() => markMedicationSnoozed(nextMed._id)}
                  className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm touch-target-senior cursor-pointer transition-colors"
                >
                  Not Now
                </button>
              </div>
            ) : (
              <Link
                to="/patient/medicines"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer flex items-center justify-center gap-2 transition-colors"
              >
                <span>View Full Medicine Routine</span>
                <ChevronRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* TODAY'S 5 CORE TASKS (Medicine, Glucose, Meal, Walk, Symptoms) */}
      <section className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F2942] tracking-tight">
              Today's Daily Checklist
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
              5 simple steps to stay healthy and maintain safe blood sugar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.map((task) => (
            <Link
              key={task.id}
              to={task.actionRoute}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${
                task.completed
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50/80 border-slate-200 hover:border-teal-400 hover:bg-white text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  task.completed ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-700 group-hover:bg-teal-100 group-hover:text-teal-700'
                }`}>
                  {task.completed ? <CheckCircle2 size={22} /> : <Clock size={20} />}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm sm:text-base leading-tight truncate">
                    {task.title}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                    {task.detail}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-teal-600 shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </section>

      {/* QUICK ACCESS ACTION STRIP: Food, Activity, Symptoms, Weekly Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/patient/meals"
          className="bg-white hover:bg-teal-50/40 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 text-slate-900 shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Utensils size={22} />
          </div>
          <span className="font-bold text-sm sm:text-base">Indian Food</span>
          <span className="text-xs text-slate-500 mt-0.5">Diabetes Meals & Fasting</span>
        </Link>

        <Link
          to="/patient/activity"
          className="bg-white hover:bg-teal-50/40 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 text-slate-900 shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Footprints size={22} />
          </div>
          <span className="font-bold text-sm sm:text-base">Walking & Exercise</span>
          <span className="text-xs text-slate-500 mt-0.5">Track daily steps</span>
        </Link>

        <Link
          to="/patient/symptoms"
          className="bg-white hover:bg-teal-50/40 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 text-slate-900 shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Smile size={22} />
          </div>
          <span className="font-bold text-sm sm:text-base">Check Symptoms</span>
          <span className="text-xs text-slate-500 mt-0.5">Feeling dizzy or weak?</span>
        </Link>

        <Link
          to="/patient/summary"
          className="bg-white hover:bg-teal-50/40 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-400 text-slate-900 shadow-xs transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Sparkles size={22} />
          </div>
          <span className="font-bold text-sm sm:text-base">Weekly Summary</span>
          <span className="text-xs text-slate-500 mt-0.5">Simple progress glance</span>
        </Link>
      </div>

      {/* EMERGENCY HELP CALLOUT */}
      <section className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5 text-center sm:text-left min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <PhoneCall size={26} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl sm:text-2xl font-black text-rose-950 truncate">
              Need Urgent Help?
            </h3>
            <p className="text-rose-800 text-xs sm:text-sm font-medium mt-0.5">
              Pressing this alerts your family caregiver and connects to your emergency contact.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerEmergency}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3.5 rounded-2xl text-base sm:text-lg touch-target-senior cursor-pointer shadow-lg active:scale-98 transition-all shrink-0 flex items-center justify-center gap-2"
        >
          <PhoneCall size={20} />
          <span>Emergency Help</span>
        </button>
      </section>

      {/* Floating AI Assistant Launcher Button */}
      <button
        type="button"
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
