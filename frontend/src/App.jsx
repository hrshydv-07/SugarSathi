import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import LandingPage from './pages/LandingPage';
import SeniorDashboard from './pages/patient/SeniorDashboard';
import SeniorGlucoseLog from './pages/patient/SeniorGlucoseLog';
import SeniorMedications from './pages/patient/SeniorMedications';
import SeniorSymptoms from './pages/patient/SeniorSymptoms';
import SeniorMeals from './pages/patient/SeniorMeals';
import SeniorActivity from './pages/patient/SeniorActivity';
import SeniorSummary from './pages/patient/SeniorSummary';
import SeniorOnboarding from './pages/patient/SeniorOnboarding';
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard';
import DoctorReport from './pages/DoctorReport';
import PrivacyConsent from './pages/PrivacyConsent';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
          <Navbar />
          <main className="flex-1">
            <ErrorBoundary>
              <Routes>
                {/* Landing & Quick Access */}
                <Route path="/" element={<LandingPage />} />

                {/* Senior Citizen Experience */}
                <Route path="/patient" element={<SeniorDashboard />} />
                <Route path="/patient/glucose" element={<SeniorGlucoseLog />} />
                <Route path="/patient/medicines" element={<SeniorMedications />} />
                <Route path="/patient/symptoms" element={<SeniorSymptoms />} />
                <Route path="/patient/meals" element={<SeniorMeals />} />
                <Route path="/patient/activity" element={<SeniorActivity />} />
                <Route path="/patient/summary" element={<SeniorSummary />} />
                <Route path="/patient/onboarding" element={<SeniorOnboarding />} />

                {/* Caregiver Portal */}
                <Route path="/caregiver" element={<CaregiverDashboard />} />

                {/* Doctor Clinical Report */}
                <Route path="/doctor-report" element={<DoctorReport />} />

                {/* Privacy & Consent */}
                <Route path="/privacy" element={<PrivacyConsent />} />
                <Route path="/privacy-policy" element={<PrivacyConsent />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/patient" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
