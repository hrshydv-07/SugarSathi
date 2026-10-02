import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { 
  Heart, 
  Activity, 
  Shield, 
  PhoneCall, 
  Wifi, 
  WifiOff, 
  Volume2, 
  RotateCcw, 
  User, 
  FileText, 
  Lock, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const {
    isOnline,
    offlineQueueCount,
    language,
    setLanguage,
    fontSize,
    setFontSize,
    currentSenior,
    switchDemoProfile,
    resetDemoData,
    triggerEmergency
  } = useApp();

  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const demoProfiles = [
    { key: 'senior_a', name: 'Ramesh Patel (68y, Hindi)', lang: 'hi' },
    { key: 'senior_b', name: 'Kamalabai Deshmukh (72y, Marathi)', lang: 'mr' },
    { key: 'senior_c', name: 'George Thomas (65y, English)', lang: 'en' }
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-800">
      {/* Top Demo Bar for Hackathon Judges */}
      <div className="bg-teal-950 border-b border-teal-800/60 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-teal-700/80 text-teal-100 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
            Hackathon Demo PS: CXHPS05
          </span>
          <span className="text-teal-200 hidden sm:inline">
            Active: <strong className="text-white">{currentSenior?.name || 'Ramesh Patel'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Demo Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="bg-slate-800 hover:bg-slate-700 text-teal-200 hover:text-white px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              title="Switch demo senior profile"
            >
              <User size={13} />
              <span>Switch Profile</span>
              <ChevronDown size={12} />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 py-1 text-slate-200">
                <div className="px-3 py-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  Select Synthetic Senior Profile
                </div>
                {demoProfiles.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => {
                      switchDemoProfile(p.key);
                      setShowDemoMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-teal-900/40 hover:text-teal-300 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{p.name}</span>
                    {currentSenior?.name?.includes(p.name.split(' ')[0]) && (
                      <span className="text-teal-400 text-[10px]">● Active</span>
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-800 mt-1 pt-1">
                  <button
                    onClick={() => {
                      resetDemoData();
                      setShowDemoMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-950/40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Reset All Demo Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Network Sync Status */}
          <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800/80">
            {isOnline ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Wifi size={12} /> Online
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <WifiOff size={12} /> Offline ({offlineQueueCount} queued)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/patient" className="flex items-center gap-3 group focus:outline-none">
          <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md group-hover:bg-teal-500 transition-colors">
            <Heart size={24} className="fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                DiaCare <span className="text-teal-400 font-medium">Senior</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
              Personalized Diabetes Care for Older Adults
            </p>
          </div>
        </Link>

        {/* Portals and Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            to="/patient"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/patient' || location.pathname === '/'
                ? 'bg-slate-800 text-teal-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Senior Mode
          </Link>
          <Link
            to="/patient/glucose"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname.startsWith('/patient/glucose')
                ? 'bg-slate-800 text-teal-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Blood Sugar
          </Link>
          <Link
            to="/patient/medicines"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname.startsWith('/patient/medicines')
                ? 'bg-slate-800 text-teal-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Medicines
          </Link>
          <Link
            to="/caregiver"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname.startsWith('/caregiver')
                ? 'bg-slate-800 text-teal-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Caregiver Portal
          </Link>
          <Link
            to="/doctor-report"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname.startsWith('/doctor-report')
                ? 'bg-slate-800 text-teal-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Doctor Report
          </Link>
          <Link
            to="/privacy"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname.startsWith('/privacy')
                ? 'bg-slate-800 text-teal-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Privacy
          </Link>
        </nav>

        {/* Accessibility Toolbar: Text Size + Language + Emergency Button */}
        <div className="flex items-center gap-2">
          {/* Font Size Selector */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded font-bold cursor-pointer ${
                fontSize === 'normal' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Normal text size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded font-bold cursor-pointer ${
                fontSize === 'large' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Large text size for seniors"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-1 rounded font-bold cursor-pointer ${
                fontSize === 'xlarge' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Extra large text size"
            >
              A++
            </button>
          </div>

          {/* Language Switcher */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs sm:text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            aria-label="Select preferred language"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
          </select>

          {/* Quick Emergency Button */}
          <button
            onClick={triggerEmergency}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-1.5 shadow-md active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
            title="Emergency family call"
          >
            <PhoneCall size={16} className="animate-pulse" />
            <span className="hidden sm:inline">Emergency</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="md:hidden flex items-center justify-around bg-slate-950/80 px-2 py-2 border-t border-slate-800 text-xs overflow-x-auto">
        <Link
          to="/patient"
          className={`px-2.5 py-1.5 rounded ${location.pathname === '/patient' ? 'text-teal-400 font-bold' : 'text-slate-300'}`}
        >
          Senior Mode
        </Link>
        <Link
          to="/patient/glucose"
          className={`px-2.5 py-1.5 rounded ${location.pathname.startsWith('/patient/glucose') ? 'text-teal-400 font-bold' : 'text-slate-300'}`}
        >
          Blood Sugar
        </Link>
        <Link
          to="/patient/medicines"
          className={`px-2.5 py-1.5 rounded ${location.pathname.startsWith('/patient/medicines') ? 'text-teal-400 font-bold' : 'text-slate-300'}`}
        >
          Medicines
        </Link>
        <Link
          to="/caregiver"
          className={`px-2.5 py-1.5 rounded ${location.pathname.startsWith('/caregiver') ? 'text-teal-400 font-bold' : 'text-slate-300'}`}
        >
          Caregiver
        </Link>
        <Link
          to="/doctor-report"
          className={`px-2.5 py-1.5 rounded ${location.pathname.startsWith('/doctor-report') ? 'text-teal-400 font-bold' : 'text-slate-300'}`}
        >
          Report
        </Link>
      </div>
    </header>
  );
}
