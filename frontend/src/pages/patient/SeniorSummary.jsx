import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getWeeklySummaryApi } from '../../services/api';
import { speakText } from '../../utils/speechUtils';
import { 
  Sparkles, 
  ChevronLeft, 
  Activity, 
  Pill, 
  Footprints, 
  ShieldCheck, 
  Volume2, 
  Calendar 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SeniorSummary() {
  const { currentSenior, language } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const patientId = currentSenior?.id || currentSenior?._id;

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    getWeeklySummaryApi(patientId, language)
      .then(res => setData(res))
      .catch(err => console.warn('Could not fetch summary:', err.message))
      .finally(() => setLoading(false));
  }, [patientId, language]);

  const handleReadAloud = () => {
    if (!data?.summary) return;
    const s = data.summary;
    const text = `${s.title}. ${s.sugarSummary} ${s.medSummary} ${s.activitySummary} ${s.safetyNote}`;
    speakText(text, language);
  };

  const summary = data?.summary;
  const metrics = data?.metrics;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/patient"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ChevronLeft size={22} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary?.title || 'Your Week at a Glance'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Simple routine progress for {currentSenior?.name}
            </p>
          </div>
        </div>

        <button
          onClick={handleReadAloud}
          className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold px-3.5 py-2.5 rounded-xl text-sm border border-teal-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Read aloud"
        >
          <Volume2 size={18} />
          <span className="hidden sm:inline">Listen Aloud</span>
        </button>
      </div>

      {/* Summary Narrative Box */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
        {/* Metric 1: Blood Sugar */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Blood Sugar</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {summary?.sugarSummary || 'Readings recorded steadily this week.'}
            </p>
            <span className="text-xs text-slate-500 font-medium">Consistent tracking helps your doctor refine meal plans.</span>
          </div>
        </div>

        {/* Metric 2: Medicines */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
            <Pill size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Medicines</span>
            <p className="text-lg font-bold text-emerald-950 mt-0.5">
              {summary?.medSummary || 'Medicines confirmed taken on time.'}
            </p>
            <span className="text-xs text-slate-500 font-medium">Regular dosage keeps insulin sensitivity balanced.</span>
          </div>
        </div>

        {/* Metric 3: Activity */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Footprints size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Walking Activity</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {summary?.activitySummary || 'Healthy movement logged.'}
            </p>
            <span className="text-xs text-slate-500 font-medium">Gentle walks after meals prevent sharp blood sugar rises.</span>
          </div>
        </div>

        {/* Metric 4: Safety & Alerts */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Caregiver Connectedness</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {summary?.safetyNote || 'Your family caregiver is kept updated with your daily routine.'}
            </p>
          </div>
        </div>
      </section>

      <Link
        to="/patient"
        className="block text-center bg-slate-900 text-white font-bold py-4 rounded-2xl touch-target-senior cursor-pointer shadow-md"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
