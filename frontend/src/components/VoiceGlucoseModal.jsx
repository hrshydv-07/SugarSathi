import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { 
  Mic, 
  Volume2, 
  Check, 
  X, 
  Keyboard, 
  AlertCircle, 
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  createSpeechRecognition, 
  speakText, 
  parseGlucoseFromSpeechLocal 
} from '../utils/speechUtils';
import { parseVoiceGlucoseApi } from '../services/api';

export default function VoiceGlucoseModal({ isOpen, onClose, onReadingSaved }) {
  const { language, logGlucoseReading, setActiveExplanation } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedValue, setDetectedValue] = useState(null);
  const [mealContext, setMealContext] = useState('fasting');
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'keypad'
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastRiskResult, setLastRiskResult] = useState(null);

  const recognitionRef = useRef(null);

  // Initialize Speech Recognition when modal opens
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setDetectedValue(null);
      setErrorMessage('');
      setLastRiskResult(null);
      setInputMode('voice');
      startVoiceListening();
    } else {
      stopVoiceListening();
    }

    return () => {
      stopVoiceListening();
    };
  }, [isOpen, language]);

  const startVoiceListening = () => {
    setErrorMessage('');
    const rec = createSpeechRecognition({
      lang: language,
      onStart: () => {
        setIsListening(true);
      },
      onResult: async ({ transcript }) => {
        setTranscript(transcript);
        setIsListening(false);

        // 1. Try local regex parsing first
        const localParsed = parseGlucoseFromSpeechLocal(transcript, language);
        if (localParsed?.value) {
          setDetectedValue(localParsed.value);
          if (localParsed.mealContext) setMealContext(localParsed.mealContext);
          speakConfirmation(localParsed.value);
          return;
        }

        // 2. Fall back to backend NLP endpoint
        try {
          const apiRes = await parseVoiceGlucoseApi(transcript, language);
          if (apiRes.detectedValue) {
            setDetectedValue(apiRes.detectedValue);
            if (apiRes.mealContext) setMealContext(apiRes.mealContext);
            speakConfirmation(apiRes.detectedValue);
          } else {
            setErrorMessage('Could not detect a clear number. Tap a preset chip or use the keypad.');
          }
        } catch (e) {
          setErrorMessage('Could not detect a clear number. Please enter with keypad.');
        }
      },
      onError: (err) => {
        setIsListening(false);
        if (err.error !== 'no-speech') {
          setErrorMessage('Microphone input note: You can use the large tactile keypad or presets below.');
        }
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (rec) {
      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (e) {}
    } else {
      setInputMode('keypad');
    }
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const speakConfirmation = (val) => {
    const text = language === 'hi'
      ? `क्या आपकी ब्लड शुगर ${val} है? पुष्टि करने के लिए सहेजें दबाएं।`
      : language === 'mr'
      ? `तुमची साखर ${val} आहे का? जतन करण्यासाठी दाबा.`
      : `Detected blood sugar ${val} mg/dL. Tap Save to confirm.`;
    speakText(text, language);
  };

  const handleSaveReading = async () => {
    if (!detectedValue || isNaN(detectedValue)) {
      setErrorMessage('Please enter a valid glucose number.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const risk = await logGlucoseReading({
        value: Number(detectedValue),
        mealContext,
        source: inputMode === 'voice' ? 'voice' : 'manual'
      });

      setLastRiskResult(risk);
      if (onReadingSaved) onReadingSaved(risk);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save reading. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Quick 1-tap presets for Hackathon Judges & Testing
  const quickDemoPresets = [
    { label: '110 Fasting', val: 110, ctx: 'fasting', tag: 'Normal' },
    { label: '145 Post-Meal', val: 145, ctx: 'after_meal', tag: 'In-Range' },
    { label: '245 High', val: 245, ctx: 'after_meal', tag: 'Attention' },
    { label: '280 Urgent', val: 280, ctx: 'after_meal', tag: 'Alert' },
    { label: '65 Low', val: 65, ctx: 'fasting', tag: 'Hypo' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-7 border border-slate-200 text-slate-900 relative max-h-[92vh] overflow-y-auto no-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer transition-colors"
          aria-label="Close dialog"
        >
          <X size={22} />
        </button>

        {/* Dialog Header */}
        <div className="text-center mb-5 pr-6 pl-6">
          <h2 id="voice-modal-title" className="text-xl sm:text-2xl font-black text-[#0F2942]">
            {lastRiskResult ? 'Reading Saved & Evaluated' : 'Log Blood Sugar'}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {language === 'hi' 
              ? 'आवाज़ से बोलें या नीचे कीपैड / प्रीसेट दबाएं' 
              : language === 'mr' 
              ? 'आवाजाने सांगा किंवा कीपॅड वापरा' 
              : 'Speak your reading, tap a preset, or enter via keypad'}
          </p>
        </div>

        {/* Post-Save Result View */}
        {lastRiskResult ? (
          <div className="space-y-4 py-1">
            <div className={`p-5 rounded-2xl border text-center ${
              lastRiskResult.level === 'NORMAL'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : lastRiskResult.level === 'ATTENTION'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div className="text-4xl sm:text-5xl font-black mb-1 tracking-tight">
                {detectedValue} <span className="text-lg sm:text-xl font-medium">mg/dL</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 shadow-xs mb-2">
                <ShieldCheck size={15} />
                <span>Clinical Status: {lastRiskResult.level}</span>
              </div>
              <p className="text-sm sm:text-base font-semibold leading-relaxed">
                {lastRiskResult.reason}
              </p>
            </div>

            {/* Explainability Callout */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <HelpCircle size={18} className="text-teal-600" />
                <span>Next Step Recommendation:</span>
              </div>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                {lastRiskResult.suggestedAction}
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setActiveExplanation({
                    value: detectedValue,
                    level: lastRiskResult.level,
                    reason: lastRiskResult.reason,
                    why: lastRiskResult.explanationText || `Your blood sugar of ${detectedValue} mg/dL was evaluated against your configured profile thresholds.`,
                    nextStep: lastRiskResult.suggestedAction
                  });
                }}
                className="w-full bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
              >
                <span>View Full "Why?" Explanation</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer shadow-md"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Quick 1-Tap Presets (Judges' Shortcut) */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                <span>Quick Demo Presets:</span>
                <span className="text-teal-600 flex items-center gap-1"><Sparkles size={11} /> 1-Tap</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickDemoPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDetectedValue(preset.val);
                      setMealContext(preset.ctx);
                      speakConfirmation(preset.val);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      detectedValue === preset.val
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Mode Selector (Voice / Keypad) */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-4 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setInputMode('voice');
                  startVoiceListening();
                }}
                className={`flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  inputMode === 'voice' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic size={16} />
                <span>Voice Input</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode('keypad');
                  stopVoiceListening();
                }}
                className={`flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  inputMode === 'keypad' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Keyboard size={16} />
                <span>Manual Keypad</span>
              </button>
            </div>

            {/* Meal Context Selection */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Reading Context:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { key: 'fasting', label: language === 'hi' ? 'खाली पेट' : language === 'mr' ? 'उपाशी पोटी' : 'Fasting' },
                  { key: 'before_meal', label: language === 'hi' ? 'खाने से पहले' : language === 'mr' ? 'जेवणापूर्वी' : 'Before Meal' },
                  { key: 'after_meal', label: language === 'hi' ? 'खाने के बाद' : language === 'mr' ? 'जेवणानंतर' : 'After Meal' },
                  { key: 'bedtime', label: language === 'hi' ? 'सोने से पहले' : language === 'mr' ? 'झोपण्यापूर्वी' : 'Bedtime' }
                ].map(ctx => (
                  <button
                    key={ctx.key}
                    type="button"
                    onClick={() => setMealContext(ctx.key)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                      mealContext === ctx.key
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ctx.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Input Mode Display */}
            {inputMode === 'voice' ? (
              <div className="text-center py-2">
                {/* Large Pulsing Microphone Button */}
                <button
                  type="button"
                  onClick={isListening ? stopVoiceListening : startVoiceListening}
                  className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white transition-all shadow-xl cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 animate-pulse-ring ring-8 ring-rose-100'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Start speaking'}
                >
                  <Mic size={40} className={isListening ? 'animate-bounce' : ''} />
                </button>

                <p className="mt-3 font-bold text-base text-slate-800">
                  {isListening ? (
                    <span className="text-teal-700 animate-pulse">
                      {language === 'hi' ? 'सुन रहा हूँ... बोलिए' : language === 'mr' ? 'ऐकत आहे... बोला' : 'Listening... Speak now'}
                    </span>
                  ) : (
                    <span>
                      {language === 'hi' ? 'बोलने के लिए माइक दबाएं' : language === 'mr' ? 'बोलण्यासाठी माइक दाबा' : 'Tap microphone to speak'}
                    </span>
                  )}
                </p>

                <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-600 text-xs">
                  <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-0.5">
                    Try speaking:
                  </p>
                  <p className="text-teal-800 font-bold italic">
                    {language === 'hi' 
                      ? '"मेरा शुगर 245 है" या "280 शुगर खाने के बाद"' 
                      : language === 'mr' 
                      ? '"माझी साखर २४५ आहे" किंवा "साखर २८०"' 
                      : '"My sugar is 245" or "Fasting 110"'}
                  </p>
                </div>

                {transcript && (
                  <div className="mt-2 text-xs text-slate-500 italic">
                    Heard: "{transcript}"
                  </div>
                )}
              </div>
            ) : (
              /* Tactile Touch Keypad Mode */
              <div className="space-y-3">
                <div className="bg-slate-100 rounded-2xl p-3 border border-slate-300 text-center">
                  <span className="text-4xl sm:text-5xl font-black text-[#0F2942] tracking-tight">
                    {detectedValue || '0'}
                  </span>
                  <span className="text-base font-bold text-slate-500 ml-2">mg/dL</span>
                </div>

                {/* 3x4 Large Keypad Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === 'C') {
                          setDetectedValue(null);
                        } else if (key === '⌫') {
                          const str = String(detectedValue || '');
                          setDetectedValue(str.length > 1 ? Number(str.slice(0, -1)) : null);
                        } else {
                          const currentStr = detectedValue ? String(detectedValue) : '';
                          if (currentStr.length < 3) {
                            setDetectedValue(Number(currentStr + key));
                          }
                        }
                      }}
                      className="keypad-btn"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Confirmation & Save Row */}
            {detectedValue && (
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-2xl p-3">
                  <div>
                    <span className="text-[10px] font-bold text-teal-800 uppercase block">Selected Reading:</span>
                    <div className="text-xl font-extrabold text-teal-950">
                      {detectedValue} mg/dL <span className="text-xs font-semibold text-teal-700">({mealContext})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakConfirmation(detectedValue)}
                    className="p-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
                    title="Read aloud"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveReading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl text-base touch-target-senior cursor-pointer shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  <span>{saving ? 'Evaluating Safety Engine...' : 'Confirm & Save Reading'}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
