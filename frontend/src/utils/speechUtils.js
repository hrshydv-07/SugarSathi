/**
 * DiaCare Senior - Elderly-Friendly Voice & Speech System
 * Supports English (en-IN), Hindi (hi-IN), and Marathi (mr-IN).
 * Designed for senior citizens: slower speech rate, high clarity, and robust speech recognition.
 */

let cachedVoices = [];

// Initialize voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    cachedVoices = window.speechSynthesis.getVoices() || [];
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    };
  } catch (e) {
    console.warn('SpeechSynthesis initialization notice:', e);
  }
}

/**
 * Returns BCP-47 language tag for preferred app language
 */
export const getLanguageLocale = (lang = 'en') => {
  switch (lang) {
    case 'hi': return 'hi-IN';
    case 'mr': return 'mr-IN';
    case 'en': 
    default: return 'en-IN';
  }
};

/**
 * Senior-Friendly Text-to-Speech (Calm, slightly slower rate for older adults)
 */
export const speakText = (text, lang = 'en', onComplete = null) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser.');
    if (onComplete) onComplete();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  if (!text || typeof text !== 'string') return;

  const utterance = new SpeechSynthesisUtterance(text);
  const locale = getLanguageLocale(lang);
  utterance.lang = locale;
  utterance.rate = 0.88; // Gentle, slightly slowed pace for senior comprehension
  utterance.pitch = 1.0;

  // Try to find a matching voice in the browser
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang === locale || v.lang.startsWith(locale.slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onComplete) {
    utterance.onend = onComplete;
    utterance.onerror = onComplete;
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Senior Voice Input Listener (Web Speech API)
 * Captures speech in English, Hindi, or Marathi
 */
export const createSpeechRecognition = ({
  lang = 'en',
  onResult,
  onError,
  onStart,
  onEnd
}) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Web Speech Recognition API is not supported in this browser.');
    if (onError) onError(new Error('Browser does not support Speech Recognition. Please use manual keypad input.'));
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = getLanguageLocale(lang);
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    if (event.results && event.results[0]) {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      if (onResult) onResult({ transcript, confidence });
    }
  };

  recognition.onerror = (event) => {
    console.warn('Voice recognition event error:', event.error);
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
};

/**
 * Local Fast Glucose Speech Extractor (English, Hindi, Marathi)
 */
export const parseGlucoseFromSpeechLocal = (transcript, lang = 'en') => {
  if (!transcript) return null;

  // Normalize Devanagari numerals to Western digits
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let normalized = transcript.toLowerCase();
  devanagariDigits.forEach((d, i) => {
    normalized = normalized.split(d).join(String(i));
  });

  const matches = normalized.match(/\b\d{2,3}\b/g);
  let value = null;
  if (matches) {
    const candidates = matches.map(Number).filter(n => n >= 40 && n <= 600);
    if (candidates.length > 0) value = candidates[0];
  }

  let mealContext = 'fasting';
  if (normalized.includes('after') || normalized.includes('post') || normalized.includes('खाने के बाद') || normalized.includes('जेवणानंतर')) {
    mealContext = 'after_meal';
  } else if (normalized.includes('before') || normalized.includes('खाने से पहले') || normalized.includes('जेवणापूर्वी')) {
    mealContext = 'before_meal';
  } else if (normalized.includes('bedtime') || normalized.includes('night') || normalized.includes('सोने से पहले') || normalized.includes('झोपण्यापूर्वी')) {
    mealContext = 'bedtime';
  }

  return {
    value,
    mealContext,
    rawText: transcript
  };
};
