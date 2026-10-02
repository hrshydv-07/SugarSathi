import React from 'react';
import { useApp } from '../context/AppContext';
import { X, ShieldAlert, CheckCircle, HelpCircle, ArrowRight, Activity } from 'lucide-react';

export default function ExplanationModal() {
  const { activeExplanation, setActiveExplanation } = useApp();

  if (!activeExplanation) return null;

  const isNormal = activeExplanation.level === 'NORMAL';
  const isAttention = activeExplanation.level === 'ATTENTION';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-7 border border-slate-200 text-slate-900 relative max-h-[92vh] overflow-y-auto no-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="explanation-title"
      >
        <button
          type="button"
          onClick={() => setActiveExplanation(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer transition-colors"
          aria-label="Close explanation"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-6">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            isNormal ? 'bg-emerald-100 text-emerald-700' : isAttention ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
          }`}>
            <Activity size={24} />
          </div>
          <div className="min-w-0">
            <h3 id="explanation-title" className="text-xl sm:text-2xl font-black text-[#0F2942] truncate">
              Why was this flagged?
            </h3>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Explainable Clinical Risk Engine
            </span>
          </div>
        </div>

        {/* Reading Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recorded Reading</span>
            <div className="text-2xl sm:text-3xl font-black text-[#0F2942]">
              {activeExplanation.value || '--'} <span className="text-sm font-medium text-slate-500">mg/dL</span>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider shrink-0 ${
            isNormal ? 'bg-emerald-100 text-emerald-800' : isAttention ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
          }`}>
            Status: {activeExplanation.level}
          </span>
        </div>

        {/* Section 1: Why */}
        <div className="space-y-3.5 text-slate-800 text-sm">
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm mb-1">
              <HelpCircle size={16} className="text-teal-600 shrink-0" />
              <span>Explanation:</span>
            </h4>
            <p className="text-slate-700 bg-teal-50/70 border border-teal-100 rounded-xl p-3 leading-relaxed text-xs sm:text-sm">
              {activeExplanation.why || activeExplanation.reason}
            </p>
          </div>

          {/* Section 2: Safe Next Step */}
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm mb-1">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <span>Recommended Next Step:</span>
            </h4>
            <p className="text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed text-xs sm:text-sm">
              {activeExplanation.nextStep || 'Follow your regular daily diabetes plan provided by your clinician.'}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="pt-2 text-[11px] text-slate-400 italic border-t border-slate-100">
            Note: DiaCare Senior uses deterministic rules configured with your clinician. It does not independently prescribe or modify medication dosages.
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setActiveExplanation(null)}
            className="w-full bg-[#0F2942] hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl touch-target-senior cursor-pointer shadow-md text-base"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
