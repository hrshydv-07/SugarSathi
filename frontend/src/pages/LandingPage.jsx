import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Heart, 
  Activity, 
  Mic, 
  Users, 
  FileText, 
  ShieldCheck, 
  WifiOff, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  PhoneCall, 
  Clock, 
  HelpCircle, 
  Lock,
  Pill,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { switchDemoProfile, setCurrentRole } = useApp();

  const handleLaunchSenior = (key = 'senior_a') => {
    switchDemoProfile(key);
    navigate('/patient');
  };

  const handleLaunchCaregiver = () => {
    setCurrentRole('CAREGIVER');
    navigate('/caregiver');
  };

  const handleLaunchDoctor = () => {
    setCurrentRole('DOCTOR');
    navigate('/doctor-report');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-teal-100 selection:text-teal-900">
      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-12 w-full">
        {/* Hackathon PS Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-900 border border-teal-200/80 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-xs">
            <Sparkles size={15} className="text-teal-700 shrink-0" />
            <span>Hackathon Track: Personalized Healthcare (CXHPS05)</span>
          </div>
        </div>

        {/* Hero Title & Identity */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shrink-0">
              <Heart size={32} className="fill-white" />
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0F2942] tracking-tight font-sans">
              DiaCare <span className="text-teal-600 font-extrabold">Senior</span>
            </h1>
          </div>

          <p className="text-lg sm:text-2xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Simple diabetes care for seniors. Connected peace of mind for families.
          </p>

          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
            Accessible voice-first logging in regional languages, doctor-approved deterministic safety thresholds, and automated family escalation.
          </p>
        </div>

        {/* 1-TAP INSTANT DEMO ROLES (Judges' Primary Showcase) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mt-10 max-w-5xl mx-auto">
          {/* Card 1: Senior Citizen Mode */}
          <div className="diacare-card p-5 sm:p-7 flex flex-col justify-between border-2 border-slate-200/90 hover:border-teal-600 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Mic size={24} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-teal-100/70 text-teal-800 px-2.5 py-1 rounded-full">
                  Senior-First
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 pt-1">
                Senior Citizen Mode
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Large accessible high-contrast cards, voice logging ("Mera sugar 245 hai"), medicine reminders, and 1-tap SOS assistance.
              </p>
              <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Demo Patient: Ramesh Patel (68y, Hindi)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchSenior('senior_a')}
              className="mt-6 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Launch Senior Mode</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Card 2: Caregiver Portal */}
          <div className="diacare-card p-5 sm:p-7 flex flex-col justify-between border-2 border-slate-200/90 hover:border-slate-800 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users size={24} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800 px-2.5 py-1 rounded-full">
                  Family Oversight
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 pt-1">
                Caregiver Portal
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Real-time family monitoring with 7-day adherence rates, glucose trend charts, and WhatsApp escalation loop for missed medicines.
              </p>
              <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Caregiver: Priya Patel (Daughter)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLaunchCaregiver}
              className="mt-6 w-full bg-[#0F2942] hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Caregiver Portal</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Card 3: Doctor Report View */}
          <div className="diacare-card p-5 sm:p-7 flex flex-col justify-between border-2 border-slate-200/90 hover:border-blue-600 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText size={24} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full">
                  Clinical 1-Page
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 pt-1">
                Doctor Clinical Report
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Standardized 1-page printable clinical document with Time in Range (TIR), fasting averages, and adherence compliance records.
              </p>
              <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Physician: Dr. S. Rao, MD</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLaunchDoctor}
              className="mt-6 w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>View Doctor Report</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>

      {/* CORE VALUE PILLARS */}
      <section className="bg-white border-t border-slate-200/90 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2942]">
              Engineered for Senior Dignity, Accuracy, and Safety
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Every interface element is specifically designed for older adult usability, visual clarity, and deterministic medical reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Mic size={20} />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">Voice-First Simplicity</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Native speech recognition for English, Hindi, and Marathi with automated Devanagari numeral conversion.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">Deterministic Clinical Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Zero clinical hallucinations. Readings evaluated strictly against doctor-configured thresholds with explainable "Why?" reasoning.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">Caregiver Escalation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Missed dose tracking: Initial reminder → Second follow-up → Automatic family WhatsApp alert with quiet hours protection.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                <WifiOff size={20} />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">Offline-First PWA Sync</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                IndexedDB queue guarantees readings and medication confirmations are logged without data loss even when disconnected.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">Granular Privacy & Consent</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Role-based data separation with individual toggles for caregiver sharing, doctor export, and speech processing.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <PhoneCall size={20} />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">One-Tap Emergency Assistance</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Prominent emergency SOS button with high-contrast safety steps and immediate phone contact linking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs">
        <div className="max-w-6xl mx-auto px-4 space-y-1.5">
          <p className="text-slate-300 font-semibold">
            DiaCare Senior — Personalized Diabetes Care for Older Adults (Hackathon Track: CXHPS05)
          </p>
          <p className="text-slate-500">
            Demonstration build with synthetic patient records. Architecture designed for privacy, explainability, and accessibility.
          </p>
        </div>
      </footer>
    </div>
  );
}
