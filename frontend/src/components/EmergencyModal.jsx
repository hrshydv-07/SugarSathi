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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border-4 border-red-500 text-slate-900 text-center relative"
        role="alertdialog"
        aria-labelledby="emergency-title"
      >
        <button
          onClick={() => setActiveAlertModal(null)}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X size={24} />
        </button>

        {/* Pulsing Emergency Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 ring-8 ring-red-50 animate-pulse">
          <PhoneCall size={36} />
        </div>

        <h3 id="emergency-title" className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight">
          Emergency Assistance
        </h3>
        <p className="text-slate-600 text-base mt-2">
          An emergency alert notification has been dispatched to your family caregiver.
        </p>

        {/* Emergency Contact Card with One-Tap Call */}
        <div className="my-6 bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-red-800 uppercase tracking-wider mb-2">
            <HeartHandshake size={16} />
            <span>Configured Emergency Contact</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {contact.name}
          </div>
          <div className="text-sm font-semibold text-slate-600 mb-4">
            Relation: {contact.relation || 'Family Contact'}
          </div>

          <a
            href={`tel:${contact.phone?.replace(/\s+/g, '')}`}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all touch-target-senior cursor-pointer"
          >
            <PhoneCall size={22} />
            <span>Call {contact.phone}</span>
          </a>
        </div>

        {/* Safety Guidance */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed text-left">
          <strong>Immediate Safety Steps:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Sit down in a comfortable, safe chair.</li>
            <li>Take slow, deep breaths and drink a few sips of water.</li>
            <li>Keep someone nearby informed while help arrives.</li>
          </ul>
        </div>

        <div className="mt-5">
          <button
            onClick={() => setActiveAlertModal(null)}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl cursor-pointer text-sm"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
