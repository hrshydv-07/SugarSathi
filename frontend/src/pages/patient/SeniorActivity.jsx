import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { logActivityApi } from '../../services/api';
import { 
  Footprints, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Heart,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SeniorActivity() {
  const { currentSenior, setSyncToast } = useApp();
  const [duration, setDuration] = useState(20);
  const [activityType, setActivityType] = useState('walking');
  const [saving, setSaving] = useState(false);
  const [logged, setLogged] = useState(false);

  const estimatedSteps = duration * 85;

  const handleSaveActivity = async () => {
    setSaving(true);
    try {
      await logActivityApi(currentSenior?.id || currentSenior?._id, {
        type: activityType,
        durationMinutes: duration,
        steps: estimatedSteps,
        notes: 'Senior daily activity check-in'
      });
      setLogged(true);
      setSyncToast(`Logged ${duration} mins of ${activityType}!`);
      setTimeout(() => setLogged(false), 4000);
    } catch (e) {
      alert('Could not log activity: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/patient"
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Walking & Gentle Activity
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Daily physical movement helps lower after-meal glucose naturally
          </p>
        </div>
      </div>

      {logged && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>Activity recorded! Keep up the healthy routine.</span>
        </div>
      )}

      {/* Main Activity Logger Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select Activity Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'walking', label: 'Walking (टहलना)' },
              { key: 'yoga', label: 'Yoga / Stretches' },
              { key: 'light_exercise', label: 'Light Exercise' }
            ].map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setActivityType(a.key)}
                className={`py-3 px-2 rounded-2xl border text-sm font-bold capitalize cursor-pointer transition-all ${
                  activityType === a.key
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Duration: <strong className="text-slate-900 text-base">{duration} minutes</strong>
          </label>
          <div className="flex gap-2">
            {[10, 15, 20, 30, 45].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDuration(mins)}
                className={`flex-1 py-3 rounded-2xl border text-sm font-bold cursor-pointer transition-all ${
                  duration === mins
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {mins} m
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Benefits Display */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center">
              <Footprints size={26} />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase">Estimated Movement</span>
              <div className="text-2xl font-black text-emerald-950">
                ~{estimatedSteps} steps
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
            Gentle Pace
          </span>
        </div>

        <button
          onClick={handleSaveActivity}
          disabled={saving}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg touch-target-senior cursor-pointer shadow-md"
        >
          {saving ? 'Recording...' : 'Log Activity'}
        </button>
      </section>

      {/* Senior Safety Reminder */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 leading-relaxed">
        <strong>Safety Note for Seniors:</strong> Wear supportive footwear, carry a small bottle of water, and avoid walking under harsh afternoon sun. If you feel shaky or lightheaded, sit down immediately.
      </div>
    </div>
  );
}
