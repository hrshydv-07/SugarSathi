import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  FileText, 
  Trash2, 
  Check, 
  AlertCircle, 
  ChevronLeft,
  Volume2,
  Bell,
  EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyConsent() {
  const { currentSenior, setSyncToast } = useApp();

  const [caregiverSharing, setCaregiverSharing] = useState(true);
  const [doctorSharing, setDoctorSharing] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [voiceConsent, setVoiceConsent] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setSyncToast('Privacy and data consent preferences saved.');
    setTimeout(() => setSavedNotice(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/patient"
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
          title="Back to Dashboard"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2942] tracking-tight truncate">
            Privacy & Data Consent
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            You are always in control of who sees your health information.
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <Check size={18} className="text-emerald-600 shrink-0" />
          <span>Consent preferences updated successfully!</span>
        </div>
      )}

      {/* Sharing Permissions Section */}
      <section className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <h2 className="text-xl font-bold text-[#0F2942] flex items-center gap-2">
          <ShieldCheck size={22} className="text-teal-600" />
          <span>Healthcare Sharing Controls</span>
        </h2>

        <div className="space-y-3.5">
          {/* Toggle 1: Caregiver Sharing */}
          <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                Share Data with Family Caregiver
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Allows <strong>{currentSenior?.caregiverName || 'Priya Patel'}</strong> to view your daily medicine adherence and glucose logs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCaregiverSharing(!caregiverSharing)}
              className={`w-14 h-8 rounded-full transition-colors p-1 cursor-pointer flex items-center shrink-0 ${
                caregiverSharing ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
              role="switch"
              aria-checked={caregiverSharing}
              aria-label="Toggle caregiver sharing"
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Toggle 2: Doctor Report Sharing */}
          <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                Share Report with Clinician / Doctor
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Permits generating the 1-page clinical trend report for <strong>{currentSenior?.doctorName || 'Dr. S. Rao'}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDoctorSharing(!doctorSharing)}
              className={`w-14 h-8 rounded-full transition-colors p-1 cursor-pointer flex items-center shrink-0 ${
                doctorSharing ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
              role="switch"
              aria-checked={doctorSharing}
              aria-label="Toggle doctor report sharing"
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Toggle 3: WhatsApp Care Alerts */}
          <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                WhatsApp Urgent & Missed Dose Alerts
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sends automated safety notifications to caregiver when blood sugar is severely high or scheduled medicine is missed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWhatsappAlerts(!whatsappAlerts)}
              className={`w-14 h-8 rounded-full transition-colors p-1 cursor-pointer flex items-center shrink-0 ${
                whatsappAlerts ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
              role="switch"
              aria-checked={whatsappAlerts}
              aria-label="Toggle WhatsApp care alerts"
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Toggle 4: Voice Processing */}
          <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                Voice Input & Speech Recognition
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Uses in-browser Web Speech API to convert your speech to numbers without recording or saving your raw audio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVoiceConsent(!voiceConsent)}
              className={`w-14 h-8 rounded-full transition-colors p-1 cursor-pointer flex items-center shrink-0 ${
                voiceConsent ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
              role="switch"
              aria-checked={voiceConsent}
              aria-label="Toggle voice processing"
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full bg-[#0F2942] hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer shadow-md transition-colors"
        >
          Save Consent Settings
        </button>
      </section>

      {/* Role-Based Data Separation Explanation */}
      <section className="bg-slate-50 rounded-3xl p-5 sm:p-7 border border-slate-200 space-y-2.5">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
          <Lock size={18} className="text-teal-700" />
          <span>Role-Based Access Protections</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          DiaCare Senior implements strict role-based data partitioning:
        </p>
        <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
          <li><strong>Senior Citizen:</strong> Has full access to personal glucose readings, medicines, and symptoms.</li>
          <li><strong>Caregiver:</strong> Receives only consented adherence summaries and critical threshold notifications.</li>
          <li><strong>Doctor:</strong> Can view clinical logs and trend tables only when doctor sharing consent is enabled.</li>
        </ul>
      </section>

      {/* Data Deletion Request */}
      <div className="p-5 bg-rose-50 border border-rose-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <strong className="text-sm font-bold text-rose-900 block">Export or Delete Health Data</strong>
          <span className="text-rose-700">Under privacy regulations, you can request an export or complete removal of your records.</span>
        </div>
        <button
          type="button"
          onClick={() => alert('Data deletion request received. In production, this queues a soft-delete after 30-day confirmation.')}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer shrink-0 transition-colors"
        >
          Request Data Deletion
        </button>
      </div>
    </div>
  );
}
