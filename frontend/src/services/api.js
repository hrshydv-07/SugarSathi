/**
 * DiaCare Senior - Unified Frontend API Client
 * Connects to backend REST APIs with resilient timeouts and offline queue integration.
 */

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Connection timed out after ${timeoutMs}ms. Check backend server.`);
    }
    throw error;
  }
}

export function getAuthHeaders() {
  const token = localStorage.getItem('diacare_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// AUTHENTICATION & DEMO LOGIN
// -------------------------------------------------------------
export async function loginSeniorApi(nameOrPhone, pin) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/auth/senior/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nameOrPhone, pin })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Senior login failed');
  return data;
}

export async function registerSeniorApi(profileData) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/auth/senior/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginCaregiverApi(email, password) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/auth/caregiver/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Caregiver login failed');
  return data;
}

export async function demoLoginApi(role = 'SENIOR', profileKey = 'senior_a') {
  const res = await fetchWithTimeout(`${API_BASE_URL}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, profileKey })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Demo login failed');
  return data;
}

// -------------------------------------------------------------
// SENIOR HOME SCREEN & CORE WORKFLOWS
// -------------------------------------------------------------
export async function getSeniorTodayApi(patientId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/seniors/${patientId}/today`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch today status');
  return data;
}

export async function getSeniorProfileApi(patientId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/seniors/${patientId}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch senior profile');
  return data;
}

export async function updateSeniorProfileApi(patientId, updates) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/seniors/${patientId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not update profile');
  return data;
}

export async function logSymptomApi(patientId, symptomData) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/seniors/${patientId}/symptoms`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(symptomData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not log symptoms');
  return data;
}

export async function logMealApi(patientId, mealData) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/seniors/${patientId}/meals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(mealData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not log meal');
  return data;
}

export async function logActivityApi(patientId, activityData) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/seniors/${patientId}/activity`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(activityData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not log activity');
  return data;
}

export async function triggerEmergencyApi(patientId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/seniors/${patientId}/emergency`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Emergency trigger failed');
  return data;
}

export async function getWeeklySummaryApi(patientId, lang = 'en') {
  const res = await fetchWithTimeout(`${API_BASE_URL}/seniors/${patientId}/summary?lang=${lang}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch summary');
  return data;
}

export async function syncOfflineQueueApi(patientId, queuedItems) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/seniors/${patientId}/sync-offline`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ queuedItems })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Offline sync failed');
  return data;
}

// -------------------------------------------------------------
// GLUCOSE MANAGEMENT & DETERMINISTIC RISK ENGINE
// -------------------------------------------------------------
export async function logGlucoseApi(readingData) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/glucose`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(readingData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not log blood sugar reading');
  return data;
}

export async function parseVoiceGlucoseApi(transcript, language = 'en') {
  const res = await fetchWithTimeout(`${API_BASE_URL}/glucose/parse-voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, language })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not parse voice reading');
  return data;
}

export async function getGlucoseHistoryApi(patientId, days = 30) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/glucose/patient/${patientId}?days=${days}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch readings');
  return data;
}

export async function getGlucoseTrendsApi(patientId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/glucose/trends/${patientId}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch trends');
  return data;
}

export async function getGlucoseExplanationApi(readingId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/glucose/explain/${readingId}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch explanation');
  return data;
}

// -------------------------------------------------------------
// MEDICATIONS & ESCALATION SIMULATION
// -------------------------------------------------------------
export async function getMedicationsApi(patientId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/medications/patient/${patientId}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch medications');
  return data;
}

export async function recordMedicationActionApi(reminderId, action = 'TAKEN') {
  const res = await fetchWithTimeout(`${API_BASE_URL}/medications/action`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reminderId, action })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not update medication status');
  return data;
}

export async function simulateMissedMedicineApi(patientId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/medications/simulate-missed`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ patientId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Missed dose simulation failed');
  return data;
}

export async function getMedicationAdherenceApi(patientId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/medications/adherence/${patientId}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch adherence');
  return data;
}

// -------------------------------------------------------------
// CAREGIVER & CLINICIAN DASHBOARDS
// -------------------------------------------------------------
export async function getCaregiverSummaryApi(patientId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/caregivers/patient/${patientId}/summary`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch caregiver summary');
  return data;
}

export async function getCaregiverNotificationsApi(patientId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/caregivers/notifications/${patientId}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch notification stream');
  return data;
}

export async function sendTestCaregiverAlertApi(patientId, customMessage) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/caregivers/test-alert`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ patientId, customMessage })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Alert dispatch failed');
  return data;
}

export async function getDoctorReportApi(patientId, days = 7) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/doctors/patient/${patientId}/report?days=${days}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not generate clinical report');
  return data;
}

// -------------------------------------------------------------
// DIABETES AI ASSISTANT
// -------------------------------------------------------------
export async function sendChatMessageApi({ message, patientId, language = 'en' }) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, patientId, language })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not contact assistant');
  return data;
}

// -------------------------------------------------------------
// DEMO CONTROLS
// -------------------------------------------------------------
export async function getDemoProfilesApi() {
  const res = await fetchWithTimeout(`${API_BASE_URL}/demo/profiles`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not fetch demo profiles');
  return data;
}

export async function resetDemoDataApi() {
  const res = await fetchWithTimeout(`${API_BASE_URL}/demo/reset`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Demo database reset failed');
  return data;
}
