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
  Lock
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 text-center space-y-6">
        {/* Hackathon PS Badge */}
        <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-900 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-xs">
          <Sparkles size={16} className="text-teal-700" />
          <span>Hackathon Problem Statement: CXHPS05</span>
        </div>

        {/* Brand Logo & Name */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg">
            <Heart size={32} className="fill-white" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight font-sans">
            DiaCare <span className="text-teal-600">Senior</span>
          </h1>
        </div>

        {/* Hero Tagline */}
        <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
          Simple diabetes care for seniors. Connected care for families.
        </p>

        {/* QUICK 1-TAP HACKATHON ENTRY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto pt-6 text-left">
          {/* Card 1: Senior Mode */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 hover:border-teal-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Mic size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Senior Citizen Mode</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Large accessible cards, voice logging ("Mera sugar 280 hai"), medicine reminders, and emergency assistance.
              </p>
            </div>
            <button
              onClick={() => handleLaunchSenior('senior_a')}
              className="mt-6 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl text-base touch-target-senior cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Launch Senior Mode</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Card 2: Caregiver Portal */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 hover:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Caregiver Dashboard</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Family oversight with medication adherence rates, 7-day glucose trends, and WhatsApp escalation loop.
              </p>
            </div>
            <button
              onClick={handleLaunchCaregiver}
              className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-base touch-target-senior cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Caregiver Portal</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Card 3: Doctor Report View */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 hover:border-blue-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Doctor Clinical Report</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Standard 1-page printable clinical report with Time in Range (TIR), fasting averages, and adherence compliance.
              </p>
            </div>
            <button
              onClick={handleLaunchDoctor}
              className="mt-6 w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl text-base touch-target-senior cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>View Doctor Report</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* CORE VALUE PILLARS */}
      <section className="bg-white border-t border-slate-200 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Designed specifically for senior citizens and their care circle
            </h2>
            <p className="text-slate-500 text-base mt-2">
              Every interaction is engineered for accessibility, safety, and explainability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Mic size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Voice-First Simplicity</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Support for English, Hindi, and Marathi voice commands with automated Devanagari numeral recognition.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Safe Deterministic Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                No LLM decides clinical risk. Evaluated strictly against configurable physician thresholds with "Why?" explainability.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Caregiver Escalation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Missed dose tracking: Initial reminder → Second follow-up → Automatic family WhatsApp alert.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <WifiOff size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Offline-First PWA</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                IndexedDB queue allows logging blood sugar and medicine taken even during temporary internet disconnections.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Consent & Privacy</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Strict granular sharing toggles for caregiver and doctor, with quiet hours to avoid night spam.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <PhoneCall size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-900">One-Tap Emergency</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                High-visibility emergency assistance with 2-step confirmation and immediate contact linking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="text-slate-300 font-semibold">
            DiaCare Senior — Personalized Diabetes Management for Senior Citizens (PS Code: CXHPS05)
          </p>
          <p className="text-slate-500">
            Hackathon demonstration build. Synthetic patient profiles used. No real patient health records.
          </p>
        </div>
      </footer>
    </div>
  );
}
