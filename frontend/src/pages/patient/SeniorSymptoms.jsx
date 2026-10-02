import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { logSymptomApi } from '../../services/api';
import { 
  Smile, 
  AlertCircle, 
  ChevronLeft, 
  CheckCircle2, 
  PhoneCall, 
  ShieldAlert 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SeniorSymptoms() {
  const { currentSenior, triggerEmergency } = useApp();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState('mild');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const symptomOptions = [
    { label: 'Feeling okay (सब ठीक है / छान वाटते)', value: 'Feeling okay' },
    { label: 'Weakness (कमजोरी / अशक्तपणा)', value: 'Weakness' },
    { label: 'Dizziness (चक्कर आना / चक्कर येणे)', value: 'Dizziness' },
    { label: 'Sweating (पसीना आना / घाम येणे)', value: 'Sweating' },
    { label: 'Shaking (हाथ कांपना / थरथरणे)', value: 'Shaking' },
    { label: 'Unusual Thirst (ज्यादा प्यास लगना / खूप तहान)', value: 'Unusual thirst' },
    { label: 'Frequent Urination (बार-बार पेशाब / वारंवार लघवी)', value: 'Frequent urination' },
    { label: 'Nausea (जी मिचलाना / मळमळ)', value: 'Nausea' },
    { label: 'Blurred Vision (धुंधला दिखना / अस्पष्ट दिसणे)', value: 'Blurred vision' }
  ];

  const toggleSymptom = (val) => {
    if (val === 'Feeling okay') {
      setSelectedSymptoms(['Feeling okay']);
      return;
    }
    const filtered = selectedSymptoms.filter(s => s !== 'Feeling okay');
    if (filtered.includes(val)) {
      setSelectedSymptoms(filtered.filter(s => s !== val));
    } else {
      setSelectedSymptoms([...filtered, val]);
    }
  };

  const handleSaveSymptoms = async () => {
    if (selectedSymptoms.length === 0) return;
    setSaving(true);
    try {
      const res = await logSymptomApi(currentSenior?.id || currentSenior?._id, {
        symptoms: selectedSymptoms,
        severity
      });
      setFeedback(res);
    } catch (err) {
      alert('Could not save symptoms: ' + err.message);
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
            How Are You Feeling Today?
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Daily check-in for {currentSenior?.name || 'Senior'}
          </p>
        </div>
      </div>

      {feedback ? (
        <div className={`p-6 rounded-3xl border-2 space-y-4 ${
          feedback.isEmergency ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'
        }`}>
          <div className="flex items-center gap-3">
            {feedback.isEmergency ? (
              <ShieldAlert size={32} className="text-rose-600" />
            ) : (
              <CheckCircle2 size={32} className="text-emerald-600" />
            )}
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {feedback.isEmergency ? 'Caregiver Alert Dispatched' : 'Symptoms Recorded'}
              </h3>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                {feedback.advice}
              </p>
            </div>
          </div>

          {feedback.isEmergency && (
            <button
              onClick={triggerEmergency}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer touch-target-senior"
            >
              <PhoneCall size={20} />
              <span>Call Emergency Contact Now</span>
            </button>
          )}

          <Link
            to="/patient"
            className="block text-center bg-slate-900 text-white font-bold py-3 rounded-xl touch-target-senior cursor-pointer"
          >
            Back to Home Screen
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div>
            <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3">
              Tap any feelings that apply:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {symptomOptions.map((opt) => {
                const isSelected = selectedSymptoms.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleSymptom(opt.value)}
                    className={`p-4 rounded-2xl border-2 text-left font-bold text-base transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity selector if symptoms other than "Feeling okay" are selected */}
          {selectedSymptoms.length > 0 && !selectedSymptoms.includes('Feeling okay') && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                How severe does it feel?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['mild', 'moderate', 'severe'].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-3 rounded-xl border text-sm font-bold capitalize cursor-pointer ${
                      severity === sev ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSaveSymptoms}
            disabled={selectedSymptoms.length === 0 || saving}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg touch-target-senior cursor-pointer shadow-md"
          >
            {saving ? 'Saving...' : 'Save Check-in'}
          </button>
        </div>
      )}
    </div>
  );
}
