import React from 'react';
import { useApp } from '../context/AppContext';
import { X, PhoneCall, AlertTriangle, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function EmergencyModal() {
  const { activeAlertModal, setActiveAlertModal, currentSenior } = useApp();

  if (!activeAlertModal || activeAlertModal.type !== 'EMERGENCY') return null;

  const contact = activeAlertModal.emergencyContact || currentSenior?.emergencyContact || {
    name: currentSenior?.caregiverName || 'Priya Patel (Daughter)',
    phone: currentSenior?.caregiverPhone || '+91 98765 43210',
    relation: 'Primary Caregiver'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-red-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-7 border-4 border-red-500 text-slate-900 text-center relative max-h-[92vh] overflow-y-auto no-scrollbar"
        role="alertdialog"
        aria-labelledby="emergency-title"
      >
        <button
          type="button"
          onClick={() => setActiveAlertModal(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer transition-colors"
          aria-label="Dismiss alert"
        >
          <X size={22} />
        </button>

        {/* Pulsing Emergency Icon */}
        <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3 ring-8 ring-red-50 animate-pulse">
          <PhoneCall size={34} />
        </div>

        <h3 id="emergency-title" className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">
          Emergency Assistance
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
          An emergency care notification has been dispatched to your family caregiver.
        </p>

        {/* Emergency Contact Card with One-Tap Call */}
        <div className="my-5 bg-red-50/80 border-2 border-red-200 rounded-2xl p-4 text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 uppercase tracking-wider mb-1.5">
            <HeartHandshake size={15} />
            <span>Configured Emergency Contact</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 truncate">
            {contact.name}
          </div>
          <div className="text-xs font-semibold text-slate-500 mb-3 truncate">
            Relation: {contact.relation || 'Family Contact'}
          </div>

          <a
            href={`tel:${contact.phone?.replace(/\s+/g, '')}`}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all touch-target-senior cursor-pointer"
          >
            <PhoneCall size={20} />
            <span className="truncate">Call {contact.phone}</span>
          </a>
        </div>

        {/* Safety Guidance */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 leading-relaxed text-left space-y-1">
          <strong className="text-slate-800 block">Immediate Safety Steps:</strong>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Sit down in a comfortable, stable armchair.</li>
            <li>Take slow, deep breaths and drink a few sips of water.</li>
            <li>Keep someone nearby informed while family arrives.</li>
          </ul>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setActiveAlertModal(null)}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl cursor-pointer text-xs sm:text-sm transition-colors"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
