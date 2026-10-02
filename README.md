# 🩺 DiaCare Senior (डायकेयर सीनियर / डायकेअर सीनियर)
### Personalized Diabetes Management for Senior Citizens
**Hackathon Problem Statement Code:** `CXHPS05`  
**Target Group:** Senior Citizens (Ages 60+), Family Caregivers, and Treating Clinicians.

---

## 📌 Executive Summary & Core Problem

Older adults managing diabetes encounter severe daily friction:
- **Complex Medication Routines:** Multi-dose oral hypoglycemic agents and insulin schedules are easily forgotten or taken irregularly.
- **Cognitive & Visual Barriers:** Standard mobile health applications feature small fonts, intricate submenus, and confusing medical jargon that intimidate seniors.
- **Delayed Intervention:** Mild hypoglycemia (shakiness, dizziness) or post-prandial hyperglycemia often go unnoticed until clinical emergencies arise.
- **Caregiver Isolation:** Family members lack real-time visibility into whether daily medicines were taken or if warning signs appeared.

**DiaCare Senior** addresses this with an elderly-friendly, voice-first, personalized diabetes management ecosystem connecting the **Senior Citizen**, their **Family Caregiver**, and their **Physician**.

---

## 🌟 Key Innovations & Architecture

```
                       ┌─────────────────────────┐
                       │   SENIOR CITIZEN MODE   │
                       │   (Voice / Large UI)    │
                       └────────────┬────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │     DETERMINISTIC SAFETY & RISK ENGINE (riskEngine.js) │
       │     (ADA / RSSDI Geriatric Thresholds + Config)        │
       │     - In-Target (80–180 mg/dL)                         │
       │     - Mild Hypo (54–69 mg/dL) -> Glucose Snack         │
       │     - Severe Crisis (<54 or >=300 mg/dL) -> Urgent     │
       └────────────────────────────┬───────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
       ┌─────────────────────┐             ┌─────────────────────┐
       │ CAREGIVER PORTAL    │             │ DOCTOR REPORT VIEW  │
       │ - Real-Time Alerts  │             │ - 1-Page Summary    │
       │ - WhatsApp Loop     │             │ - Time In Range %   │
       │ - 7-Day Adherence % │             │ - Clinical Trends   │
       └─────────────────────┘             └─────────────────────┘
```

1. **Voice-First Input (English, Hindi, Marathi):**
   - Seniors can speak naturally: *"Mera sugar 280 hai"* or *"माझी साखर २४५ आहे"*.
   - In-browser Web Speech API transcribes speech, extracts numeric glucose and meal context, confirms with user, and provides spoken feedback at a calm pace (0.88x speed).
2. **Safe Deterministic Risk Engine (`riskEngine.js`):**
   - **Critical Safety Guardrail:** No LLM is permitted to diagnose or decide medical risk levels.
   - All readings are checked deterministically against clinician-configured thresholds.
   - Provides clear, non-frightening "Why?" explainability explaining the matched clinical rule and safe next step.
3. **Multi-Stage Medication Escalation & WhatsApp Care Loop:**
   - Scheduled Dose → Senior marks **TAKEN** / **NOT NOW**.
   - Missed Dose: Initial Reminder → Second Follow-up (15m) → Automatic Caregiver WhatsApp Alert (>45m).
   - Real WhatsApp Cloud API support + seamless **MOCK MODE** for offline demonstrations.
4. **Caregiver Oversight Dashboard:**
   - Live medication adherence compliance rate (%).
   - Multi-factor severity indicators (Icon + Status + Text, never color alone).
   - 7-Day glucose timeline with Time in Range (TIR %) metrics.
5. **1-Page Doctor Clinical Report:**
   - Formatted for physical print or PDF download.
   - Includes mean glucose, Time in Range %, fasting/post-meal averages, medication compliance table, flagged risk events, and mandatory clinical disclaimers (*"Generated from patient logs. Not a diagnostic report."*).
6. **Indian Food Guidance & Fasting Modes:**
   - Culturally authentic meal ideas: Oats upma, idli with dal sambar, moong dal khichdi, roasted chana, makhana.
   - Guidance for religious fasting days (Navratri, Ekadashi) with hydration and low-glycemic permitted snacks.
7. **Offline-First PWA (IndexedDB Queue):**
   - Allows recording blood sugar, marking medicines, and logging symptoms without internet.
   - Auto-synchronizes with MongoDB upon network restoration.
8. **Granular Privacy & Consent Controls:**
   - Role-based data partitioning between Senior, Caregiver, and Clinician.
   - One-tap sharing toggles, quiet hours protection, and data deletion requests.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide React, Recharts |
| **PWA & Offline** | Vite PWA Plugin, Workbox, IndexedDB (`idb`) |
| **Voice & Speech** | Browser Web Speech Recognition & Speech Synthesis (en-IN, hi-IN, mr-IN) |
| **Internationalization** | i18next (English, Hindi, Marathi) |
| **Backend** | Node.js, Express 5, Mongoose, Node-Cron, Axios |
| **Database** | MongoDB Atlas / Local MongoDB |
| **Security & Auth** | JWT Authentication, Bcrypt Password & PIN Hashing, Rate Limiting |
| **AI Assistant** | Google Gemini API (Context-grounded assistant with clinical safety guardrails) |
| **Notifications** | Meta WhatsApp Cloud API (with integrated Mock Mode fallback) |

---

## 📂 Project Structure

```
├── backend/
│   ├── jobs/
│   │   └── reminderCron.js         # Multi-stage reminder scheduler & escalation worker
│   ├── middleware/
│   │   └── auth.js                 # Multi-role JWT auth & login rate limiting
│   ├── models/
│   │   ├── User.js                 # Unified user schema
│   │   ├── SeniorProfile.js        # Senior profile, clinical targets, quiet hours, consent
│   │   ├── GlucoseReading.js       # Blood sugar logs & deterministic risk outcome
│   │   ├── Medication.js           # Prescribed medications and timings
│   │   ├── Reminder.js             # Daily reminder instances & acknowledgement tracking
│   │   ├── RiskEvent.js            # Flagged risk events for physician audit
│   │   ├── Notification.js         # Notification dispatch audit log
│   │   ├── SymptomLog.js           # Senior symptom check-ins
│   │   ├── MealLog.js              # Indian meal logs
│   │   ├── ActivityLog.js          # Walking and physical movement logs
│   │   ├── Consent.js              # Granular sharing permissions
│   │   ├── Caregiver.js            # Caregiver schema
│   │   └── Doctor.js               # Clinician schema
│   ├── routes/
│   │   ├── authRoutes.js           # Senior PIN login, Caregiver login, Demo login
│   │   ├── seniorRoutes.js         # Senior home bundle, symptoms, meals, activity, emergency
│   │   ├── glucoseRoutes.js        # Voice transcription parsing, logging, trends, explainability
│   │   ├── medicationRoutes.js     # Adherence, mark taken, simulate missed dose
│   │   ├── caregiverRoutes.js      # Patient summary, notification feed, test alerts
│   │   ├── doctorRoutes.js         # 1-page clinical summary report endpoint
│   │   ├── aiRoutes.js             # Diabetes AI companion chat
│   │   ├── demoRoutes.js           # Synthetic profile list & demo reset trigger
│   │   └── whatsappWebhook.js      # Meta Graph API webhook & "DONE" message receiver
│   ├── services/
│   │   ├── riskEngine.js           # Deterministic rule engine & trend calculations
│   │   ├── whatsappService.js      # WhatsApp dispatcher (REAL + MOCK mode)
│   │   └── aiService.js            # Diabetes AI assistant with clinical guardrails
│   ├── seed.js                     # Synthetic dataset populator (3 senior profiles)
│   ├── server.js                   # Express server entry point & MongoDB connection
│   └── .env.example
├── frontend/
│   ├── public/
│   │   ├── favicon.svg             # DiaCare medical shield icon
│   │   ├── manifest.json           # PWA manifest
│   │   └── offline.html            # Offline fallback screen
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Accessible header, font scaling, demo switcher
│   │   │   ├── VoiceGlucoseModal.jsx # Voice recognition & large keypad modal
│   │   │   ├── ExplanationModal.jsx# "Why?" explainable clinical reasoning modal
│   │   │   ├── EmergencyModal.jsx  # Two-step emergency help modal
│   │   │   ├── DiabetesAssistantModal.jsx # Diabetes AI companion modal
│   │   │   └── PwaInstallPrompt.jsx# In-app PWA install banner
│   │   ├── context/
│   │   │   └── AppContext.jsx      # Global state, offline queue, language & font sizing
│   │   ├── locales/
│   │   │   ├── en.json             # English translations
│   │   │   ├── hi.json             # Hindi translations
│   │   │   └── mr.json             # Marathi translations
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Landing page with 1-tap demo access
│   │   │   ├── DoctorReport.jsx    # 1-page printable clinical doctor report
│   │   │   ├── PrivacyConsent.jsx  # Sharing toggles & role-based permissions
│   │   │   ├── caregiver/
│   │   │   │   └── CaregiverDashboard.jsx # Caregiver family oversight & WhatsApp feed
│   │   │   └── patient/
│   │   │       ├── SeniorDashboard.jsx    # Primary senior home screen
│   │   │       ├── SeniorGlucoseLog.jsx   # Blood sugar trends & Recharts target band
│   │   │       ├── SeniorMedications.jsx  # Medication adherence & missed dose simulation
│   │   │       ├── SeniorSymptoms.jsx     # Symptom check-in
│   │   │       ├── SeniorMeals.jsx        # Indian food & fasting guidance
│   │   │       ├── SeniorActivity.jsx     # Walking & steps tracker
│   │   │       ├── SeniorSummary.jsx      # Multilingual weekly summary
│   │   │       └── SeniorOnboarding.jsx   # Senior-friendly onboarding wizard
│   │   ├── services/
│   │   │   └── api.js              # Frontend REST API client
│   │   └── utils/
│   │       ├── speechUtils.js      # SpeechRecognition & SpeechSynthesis utilities
│   │       ├── offlineDb.js        # IndexedDB offline store & queue manager
│   │       └── browserNotifications.js
│   ├── index.html
│   ├── vite.config.js
│   └── .env.example
├── render.yaml                     # Render deployment blueprint
├── vercel.json                     # Vercel deployment blueprint
└── README.md
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local community server or free MongoDB Atlas URI)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env` with your settings:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/diacare_senior
JWT_SECRET=diacare_secret_key_2026
FRONTEND_URL=http://localhost:5173

# Optional: Real external APIs (Automatically falls back to MOCK mode if not set)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
WHATSAPP_TOKEN=YOUR_WHATSAPP_TOKEN
WHATSAPP_PHONE_NUMBER_ID=YOUR_PHONE_NUMBER_ID
```

Seed the synthetic test profiles:
```bash
npm run seed
```

Start the backend server:
```bash
npm start
```
*Backend runs on `http://localhost:5000` (`GET /api/health` available).*

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens at `http://localhost:5173`.*

---

## 🎭 Synthetic Demo Profiles & Credentials

For hackathon evaluation, 3 synthetic senior profiles are pre-seeded:

| Profile | Demographics | Language | Clinical Conditions | Demo Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **Senior A: Ramesh Patel** | 68 Y, Male | **Hindi (हिन्दी)** | Type 2 Diabetes + Hypertension | Speaks *"Mera sugar 280 hai"*, gets high glucose evaluation & explainability, simulates missed medicine with WhatsApp escalation. |
| **Senior B: Kamalabai Deshmukh** | 72 Y, Female | **Marathi (मराठी)** | Type 2 Diabetes (Insulin dependent) | Speaks *"माझी साखर ६५ आहे"*, triggers mild hypoglycemia protocol (carbs + 15m recheck). |
| **Senior C: George Thomas** | 65 Y, Male | **English** | Mild T2D (Lifestyle & Oral) | Logs fasting sugar 115 mg/dL, gets in-target confirmation and 7-day adherence summary. |

**Universal Demo PIN:** `1234`  
**Caregiver Account:** `priya.caregiver@diacare.local` / `demo123`  
**Doctor Account:** `dr.rao@apexhealth.in` / `demo123`

---

## 🧪 Live Demonstration Flow (Judging Guide)

Follow this step-by-step walkthrough during live presentations:

1. **Open Senior Mode (`/patient`):**
   - Point out large cards, high-contrast typography, and senior touch targets.
   - Toggle font size using the **A / A+ / A++** toolbar in the top navigation bar.
2. **Demonstrate Voice-First Glucose Logging:**
   - Tap **"Talk to App"** or **"Log Blood Sugar"**.
   - Select Hindi. Speak (or type): *"Mera sugar 280 hai"*.
   - System transcribes speech, highlights **280 mg/dL**, and prompts confirmation.
   - Tap **Confirm & Save**.
3. **Explainable Deterministic Safety Engine:**
   - System evaluates the reading and flags it: *"Status: HIGH (Above configured target of 180 mg/dL)"*.
   - Tap **"Why?"** to show the exact rule matched, threshold comparisons, and safe next step.
4. **Medication Routine & Missed Dose Escalation:**
   - Navigate to **Medicines** (`/patient/medicines`).
   - Tap **"Simulate Missed Dose (Demo)"**.
   - System advances from Stage 1 to Stage 2, marks dose as `MISSED`, and queues caregiver escalation.
5. **Inspect Caregiver Portal (`/caregiver`):**
   - Navigate to **Caregiver Portal**.
   - Notice the live alert in the **WhatsApp Care Loop** stream and compliance metrics.
   - Tap **"Simulate Caregiver WhatsApp Message"** to test live notification dispatch.
6. **Generate 1-Page Doctor Report (`/doctor-report`):**
   - View formatted summary with Time in Range %, mean glucose, and adherence table.
   - Tap **"Download PDF / Print"** to trigger clean print-ready CSS.
7. **Offline-First PWA Demonstration:**
   - In browser DevTools, switch network to **Offline**.
   - The top banner displays **Offline Mode**.
   - Record a glucose reading — it saves instantly to the local IndexedDB queue.
   - Switch network back to **Online** — the queue automatically synchronizes with MongoDB!

---

## 🔒 Safety, Privacy & Ethical Compliance

- **No Autonomous Prescribing:** DiaCare Senior strictly organizes user-entered and clinician-prescribed data. It never prescribes, stops, or alters dosages.
- **Explainable Rules:** Clinical risk assessments are deterministic and inspectable by physicians.
- **Granular Consent:** Data is partitioned using role-based permissions; family caregivers only receive consented information.
- **Attribution:** Built on standard open-source web infrastructure and refactored from an open-source architectural baseline, acknowledging original dependencies while introducing a completely original product identity, domain logic, and accessibility design system.
