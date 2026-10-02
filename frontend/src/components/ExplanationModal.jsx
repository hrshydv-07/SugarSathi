import React from 'react';
import { useApp } from '../context/AppContext';
import { X, ShieldAlert, CheckCircle, HelpCircle, ArrowRight, Activity } from 'lucide-react';

export default function ExplanationModal() {
  const { activeExplanation, setActiveExplanation } = useApp();

  if (!activeExplanation) return null;

  const isNormal = activeExplanation.level === 'NORMAL';
  const isAttention = activeExplanation.level === 'ATTENTION';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 text-slate-900 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="explanation-title"
      >
        <button
          onClick={() => setActiveExplanation(null)}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer"
          aria-label="Close explanation"
        >
          <X size={22} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isNormal ? 'bg-emerald-100 text-emerald-700' : isAttention ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
          }`}>
            <Activity size={26} />
          </div>
          <div>
            <h3 id="explanation-title" className="text-xl sm:text-2xl font-bold text-slate-900">
              Why was this flagged?
            </h3>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Explainable Clinical Risk Engine
            </span>
          </div>
        </div>

        {/* Reading Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Recorded Reading</span>
            <div className="text-3xl font-extrabold text-slate-900">
              {activeExplanation.value || '--'} <span className="text-base font-medium">mg/dL</span>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
            isNormal ? 'bg-emerald-100 text-emerald-800' : isAttention ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
          }`}>
            Status: {activeExplanation.level}
          </span>
        </div>

        {/* Section 1: Why */}
        <div className="space-y-4 text-slate-800 text-base">
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-base mb-1">
              <HelpCircle size={18} className="text-teal-600" />
              <span>Explanation:</span>
            </h4>
            <p className="text-slate-700 bg-teal-50/60 border border-teal-100 rounded-xl p-3.5 leading-relaxed text-sm">
              {activeExplanation.why || activeExplanation.reason}
            </p>
          </div>

          {/* Section 2: Safe Next Step */}
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-base mb-1">
              <CheckCircle size={18} className="text-emerald-600" />
              <span>Recommended Next Step:</span>
            </h4>
            <p className="text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3.5 leading-relaxed text-sm">
              {activeExplanation.nextStep || 'Follow your regular daily diabetes plan provided by your clinician.'}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="pt-2 text-xs text-slate-500 italic border-t border-slate-100">
            Note: DiaCare Senior uses deterministic rules configured with your clinician. It does not independently prescribe or change any medications.
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setActiveExplanation(null)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl touch-target-senior cursor-pointer shadow-md"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
