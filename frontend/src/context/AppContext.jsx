import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import i18n from '../i18n';
import {
  loginSeniorApi,
  demoLoginApi,
  getSeniorTodayApi,
  getSeniorProfileApi,
  logGlucoseApi,
  recordMedicationActionApi,
  simulateMissedMedicineApi,
  logSymptomApi,
  logMealApi,
  logActivityApi,
  triggerEmergencyApi,
  syncOfflineQueueApi,
  getCaregiverNotificationsApi,
  resetDemoDataApi
} from '../services/api';
import {
  cacheSeniorDashboard,
  getCachedSeniorDashboard,
  queueOfflineItem,
  getQueuedOfflineItems,
  clearAllQueuedOfflineItems
} from '../utils/offlineDb';
import { speakText } from '../utils/speechUtils';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Network status
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [syncToast, setSyncToast] = useState('');

  // User & Role State
  const [currentRole, setCurrentRole] = useState(() => localStorage.getItem('diacare_role') || 'SENIOR');
  const [currentSenior, setCurrentSenior] = useState(() => {
    try {
      const saved = localStorage.getItem('diacare_senior');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentCaregiver, setCurrentCaregiver] = useState(() => {
    try {
      const saved = localStorage.getItem('diacare_caregiver');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Senior Home Screen Data
  const [todayData, setTodayData] = useState({
    greeting: 'Good Morning, Ramesh',
    latestGlucose: null,
    nextMedicineReminder: null,
    todayReminders: [],
    tasks: []
  });
  const [loadingToday, setLoadingToday] = useState(false);

  // Elderly UI Preferences
  const [language, setLanguageState] = useState(() => localStorage.getItem('diacare_language') || 'hi');
  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('diacare_font_size') || 'normal');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('diacare_high_contrast') === 'true');
  const [speechFeedbackEnabled, setSpeechFeedbackEnabled] = useState(() => localStorage.getItem('diacare_speech_feedback') !== 'false');

  // Modals & Active Explainability
  const [activeExplanation, setActiveExplanation] = useState(null);
  const [activeAlertModal, setActiveAlertModal] = useState(null);
  const [notificationsLog, setNotificationsLog] = useState([]);

  // Apply Font Size to Root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-normal', 'font-large', 'font-xlarge');
    root.classList.add(`font-${fontSize}`);
    localStorage.setItem('diacare_font_size', fontSize);
  }, [fontSize]);

  // Apply Language to i18n
  useEffect(() => {
    if (i18n && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(language);
    }
    localStorage.setItem('diacare_language', language);
  }, [language]);

  // Monitor Online/Offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncToast('Connected to network. Synchronizing offline records...');
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncToast('You are currently offline. Changes will save locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on queued offline items
    getQueuedOfflineItems().then(items => setOfflineQueueCount(items.length));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Today's Bundle for Senior
  const refreshTodayData = useCallback(async (seniorId = null) => {
    const id = seniorId || currentSenior?.id || currentSenior?._id;
    if (!id) return;

    setLoadingToday(true);
    try {
      if (navigator.onLine) {
        const data = await getSeniorTodayApi(id);
        setTodayData(data);
        cacheSeniorDashboard(id, data);
      } else {
        // Fallback to offline cache
        const cached = await getCachedSeniorDashboard(id);
        if (cached) setTodayData(cached);
      }
    } catch (err) {
      console.warn('Could not load today data from network, checking cache:', err.message);
      const cached = await getCachedSeniorDashboard(id);
      if (cached) setTodayData(cached);
    } finally {
      setLoadingToday(false);
    }
  }, [currentSenior]);

  // Auto-load default senior profile on first mount if not authenticated
  useEffect(() => {
    if (!currentSenior) {
      demoLoginApi('SENIOR', 'senior_a')
        .then(res => {
          if (res.senior) {
            setCurrentSenior(res.senior);
            localStorage.setItem('diacare_senior', JSON.stringify(res.senior));
            localStorage.setItem('diacare_token', res.token);
            setLanguageState(res.senior.preferredLanguage || 'hi');
            refreshTodayData(res.senior._id || res.senior.id);
          }
        })
        .catch(err => console.warn('Demo profile auto-mount note:', err.message));
    } else {
      refreshTodayData();
    }
  }, []);

  // Sync Offline Queue with Backend
  const syncOfflineQueue = useCallback(async () => {
    try {
      const items = await getQueuedOfflineItems();
      if (!items || items.length === 0) {
        setOfflineQueueCount(0);
        return;
      }

      const id = currentSenior?.id || currentSenior?._id;
      if (!id) return;

      const res = await syncOfflineQueueApi(id, items);
      if (res.status === 'ok') {
        await clearAllQueuedOfflineItems();
        setOfflineQueueCount(0);
        setSyncToast(`Synchronized ${res.syncedCount} offline record(s) with cloud!`);
        refreshTodayData();
      }
    } catch (err) {
      console.warn('Sync queue error:', err.message);
    }
  }, [currentSenior, refreshTodayData]);

  // 1. Log Glucose Reading (Online or Offline with Deterministic Safety Engine)
  const logGlucoseReading = useCallback(async ({ value, mealContext = 'fasting', symptoms = [], notes = '', source = 'manual' }) => {
    const numValue = Number(value);
    const seniorId = currentSenior?.id || currentSenior?._id;

    if (!isOnline) {
      // Save to Offline Queue
      await queueOfflineItem({
        type: 'glucose',
        value: numValue,
        mealContext,
        symptoms,
        notes
      });
      const items = await getQueuedOfflineItems();
      setOfflineQueueCount(items.length);
      setSyncToast('Reading saved offline. Will sync automatically when connected.');

      // Update local state preview
      setTodayData(prev => ({
        ...prev,
        latestGlucose: { value: numValue, mealContext, timestamp: new Date().toISOString() }
      }));

      return {
        level: numValue > 200 ? 'HIGH' : numValue < 70 ? 'ATTENTION' : 'NORMAL',
        reason: 'Saved locally in offline mode.',
        suggestedAction: 'Keep following your routine schedule.'
      };
    }

    try {
      const result = await logGlucoseApi({
        patientId: seniorId,
        value: numValue,
        mealContext,
        symptoms,
        notes,
        source
      });

      // Update today's data immediately
      refreshTodayData();

      // Read aloud for senior feedback if enabled
      if (speechFeedbackEnabled) {
        const speakMsg = language === 'hi' 
          ? `आपकी ब्लड शुगर ${numValue} दर्ज हो गई है। ${result.riskAssessment?.level === 'NORMAL' ? 'यह सामान्य सीमा में है।' : 'कृपया सावधानी बरतें।'}`
          : language === 'mr'
          ? `तुमची साखर ${numValue} नोंदवली आहे.`
          : `Blood sugar ${numValue} mg/dL recorded. ${result.riskAssessment?.level === 'NORMAL' ? 'In target range.' : 'Attention advised.'}`;
        speakText(speakMsg, language);
      }

      // If urgent or high risk, trigger notification alert modal
      if (result.riskAssessment?.level === 'URGENT' || result.riskAssessment?.level === 'HIGH') {
        setActiveAlertModal({
          type: 'GLUCOSE_RISK',
          level: result.riskAssessment.level,
          value: numValue,
          reason: result.riskAssessment.reason,
          action: result.riskAssessment.suggestedAction,
          escalationSent: result.escalationSent
        });
      }

      return result.riskAssessment;
    } catch (err) {
      console.error('Log glucose failed:', err);
      throw err;
    }
  }, [currentSenior, isOnline, language, speechFeedbackEnabled, refreshTodayData]);

  // 2. Mark Medication Taken
  const markMedicationTaken = useCallback(async (reminderId) => {
    if (!isOnline) {
      await queueOfflineItem({
        type: 'medication_action',
        reminderId,
        action: 'TAKEN'
      });
      const items = await getQueuedOfflineItems();
      setOfflineQueueCount(items.length);
      setSyncToast('Medicine marked taken offline. Will sync when reconnected.');

      // Update local preview
      setTodayData(prev => ({
        ...prev,
        todayReminders: prev.todayReminders.map(r => r._id === reminderId ? { ...r, status: 'TAKEN', acknowledged: true } : r)
      }));
      return;
    }

    try {
      await recordMedicationActionApi(reminderId, 'TAKEN');
      refreshTodayData();
      if (speechFeedbackEnabled) {
        const text = language === 'hi' ? 'दवा ले ली गई। बहुत अच्छा!' : language === 'mr' ? 'औषध घेतले. छान!' : 'Medicine marked taken. Great job!';
        speakText(text, language);
      }
    } catch (err) {
      console.error('Mark medication taken error:', err);
    }
  }, [isOnline, language, speechFeedbackEnabled, refreshTodayData]);

  // 3. Mark Medication Snoozed
  const markMedicationSnoozed = useCallback(async (reminderId) => {
    try {
      await recordMedicationActionApi(reminderId, 'SNOOZED');
      refreshTodayData();
    } catch (err) {
      console.error('Snooze medication error:', err);
    }
  }, [refreshTodayData]);

  // 4. Simulate Missed Medicine (Crucial Hackathon Demonstration)
  const triggerMissedMedicineSimulation = useCallback(async () => {
    const seniorId = currentSenior?.id || currentSenior?._id;
    try {
      const res = await simulateMissedMedicineApi(seniorId);
      refreshTodayData();

      // Show alert on screen
      setActiveAlertModal({
        type: 'MISSED_MEDICINE',
        level: 'ATTENTION',
        reason: 'Medication dose was missed and unconfirmed.',
        action: 'Caregiver notification has been dispatched via WhatsApp (Mock Mode).',
        dispatchResult: res.dispatchResult
      });

      return res;
    } catch (err) {
      console.error('Missed medicine simulation error:', err);
      throw err;
    }
  }, [currentSenior, refreshTodayData]);

  // 5. Trigger Emergency
  const triggerEmergency = useCallback(async () => {
    const seniorId = currentSenior?.id || currentSenior?._id;
    try {
      const res = await triggerEmergencyApi(seniorId);
      setActiveAlertModal({
        type: 'EMERGENCY',
        level: 'URGENT',
        reason: 'Emergency help requested by senior.',
        action: `Contacting ${res.emergencyContact?.name || 'Emergency contact'} at ${res.emergencyContact?.phone || '+91 98765 43210'}.`,
        emergencyContact: res.emergencyContact
      });
      return res;
    } catch (err) {
      console.error('Emergency trigger error:', err);
      throw err;
    }
  }, [currentSenior]);

  // 6. Switch Demo Profile
  const switchDemoProfile = useCallback(async (key) => {
    try {
      const res = await demoLoginApi('SENIOR', key);
      if (res.senior) {
        setCurrentSenior(res.senior);
        setCurrentRole('SENIOR');
        localStorage.setItem('diacare_senior', JSON.stringify(res.senior));
        localStorage.setItem('diacare_role', 'SENIOR');
        localStorage.setItem('diacare_token', res.token);
        setLanguageState(res.senior.preferredLanguage || 'en');
        refreshTodayData(res.senior._id || res.senior.id);
      }
    } catch (err) {
      console.error('Switch profile error:', err);
    }
  }, [refreshTodayData]);

  // 7. Reset Demo Data
  const resetDemoData = useCallback(async () => {
    try {
      await resetDemoDataApi();
      switchDemoProfile('senior_a');
      setSyncToast('Demo dataset re-seeded with synthetic test data.');
    } catch (err) {
      console.error('Reset demo error:', err);
    }
  }, [switchDemoProfile]);

  return (
    <AppContext.Provider
      value={{
        isOnline,
        offlineQueueCount,
        syncToast,
        setSyncToast,
        currentRole,
        setCurrentRole,
        currentSenior,
        setCurrentSenior,
        currentCaregiver,
        setCurrentCaregiver,
        todayData,
        loadingToday,
        language,
        setLanguage: setLanguageState,
        fontSize,
        setFontSize: setFontSizeState,
        highContrast,
        setHighContrast,
        speechFeedbackEnabled,
        setSpeechFeedbackEnabled,
        activeExplanation,
        setActiveExplanation,
        activeAlertModal,
        setActiveAlertModal,
        refreshTodayData,
        logGlucoseReading,
        markMedicationTaken,
        markMedicationSnoozed,
        triggerMissedMedicineSimulation,
        triggerEmergency,
        switchDemoProfile,
        resetDemoData,
        syncOfflineQueue
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
