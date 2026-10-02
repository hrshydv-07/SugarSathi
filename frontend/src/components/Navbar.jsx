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
  ChevronDown,
  Pill,
  Users
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
    { key: 'senior_a', name: 'Ramesh Patel', meta: '68y • Hindi', lang: 'hi' },
    { key: 'senior_b', name: 'Kamalabai Deshmukh', meta: '72y • Marathi', lang: 'mr' },
    { key: 'senior_c', name: 'George Thomas', meta: '65y • English', lang: 'en' }
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-800">
      {/* Top Demo Bar for Hackathon Judges */}
      <div className="bg-[#0b1e32] border-b border-slate-800 px-3 sm:px-6 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Hackathon PS & Active Patient */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-teal-900/90 text-teal-200 border border-teal-700/60 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider shrink-0">
              PS: CXHPS05
            </span>
            <span className="text-slate-300 text-xs truncate">
              Senior: <strong className="text-white font-semibold">{currentSenior?.name || 'Ramesh Patel'}</strong>
            </span>
          </div>

          {/* Right: Switch Profile & Online Sync */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Demo Profile Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="bg-slate-800/90 hover:bg-slate-700 text-teal-300 hover:text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 text-xs cursor-pointer"
                title="Switch synthetic senior patient profile"
                aria-expanded={showDemoMenu}
              >
                <User size={13} className="shrink-0" />
                <span className="hidden xs:inline">Profile</span>
                <ChevronDown size={12} className="shrink-0" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 text-slate-200 animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    Synthetic Patient Profiles
                  </div>
                  {demoProfiles.map((p) => {
                    const isActive = currentSenior?.name?.includes(p.name.split(' ')[0]);
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          switchDemoProfile(p.key);
                          setShowDemoMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          isActive ? 'bg-teal-950/80 text-teal-300 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.meta}</div>
                        </div>
                        {isActive && (
                          <span className="text-teal-400 text-[10px] bg-teal-900/60 px-1.5 py-0.5 rounded font-bold">Active</span>
                        )}
                      </button>
                    );
                  })}
                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        resetDemoData();
                        setShowDemoMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-amber-950/40 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Reset Demo Data to Default</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Network Sync Status */}
            <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              {isOnline ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <Wifi size={12} /> <span className="hidden sm:inline">Online</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 font-medium">
                  <WifiOff size={12} /> <span>Offline ({offlineQueueCount})</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <Link to="/patient" className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md group-hover:bg-teal-500 transition-colors shrink-0">
            <Heart size={22} className="fill-white" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-black tracking-tight text-white font-sans truncate">
              DiaCare <span className="text-teal-400 font-semibold">Senior</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden md:block truncate">
              Personalized Diabetes Care for Older Adults
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            to="/patient"
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              location.pathname === '/patient' || location.pathname === '/'
                ? 'bg-slate-800 text-teal-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Senior Mode
          </Link>
          <Link
            to="/patient/glucose"
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              location.pathname.startsWith('/patient/glucose')
                ? 'bg-slate-800 text-teal-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Blood Sugar
          </Link>
          <Link
            to="/patient/medicines"
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              location.pathname.startsWith('/patient/medicines')
                ? 'bg-slate-800 text-teal-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Medicines
          </Link>
          <Link
            to="/caregiver"
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              location.pathname.startsWith('/caregiver')
                ? 'bg-slate-800 text-teal-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Caregiver Portal
          </Link>
          <Link
            to="/doctor-report"
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              location.pathname.startsWith('/doctor-report')
                ? 'bg-slate-800 text-teal-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Doctor Report
          </Link>
          <Link
            to="/privacy"
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              location.pathname.startsWith('/privacy')
                ? 'bg-slate-800 text-teal-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Privacy
          </Link>
        </nav>

        {/* Accessibility Toolbar: Text Size + Language + Emergency Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Font Size Selector (A / A+ / A++) */}
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                fontSize === 'normal' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Standard text size"
              aria-label="Set standard font size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                fontSize === 'large' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Large text size for seniors"
              aria-label="Set large font size"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                fontSize === 'xlarge' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Extra-large text size for low vision"
              aria-label="Set extra large font size"
            >
              A++
            </button>
          </div>

          {/* Language Switcher */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm px-2 sm:px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shrink-0"
            aria-label="Select preferred language"
          >
            <option value="en">EN</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
          </select>

          {/* Quick Emergency Button */}
          <button
            type="button"
            onClick={triggerEmergency}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-2.5 sm:px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all text-xs sm:text-sm cursor-pointer shrink-0"
            title="Emergency family alert and one-tap call"
          >
            <PhoneCall size={15} className="animate-pulse shrink-0" />
            <span className="hidden xs:inline">SOS</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation (Responsive, Never Clips, Touch Friendly) */}
      <div className="lg:hidden flex items-center justify-between bg-slate-950 px-2 py-1.5 border-t border-slate-800 text-xs overflow-x-auto no-scrollbar gap-1">
        <Link
          to="/patient"
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-colors flex items-center gap-1 ${
            location.pathname === '/patient' || location.pathname === '/' 
              ? 'bg-teal-600 text-white' 
              : 'text-slate-300 hover:bg-slate-900'
          }`}
        >
          <Heart size={13} />
          <span>Senior</span>
        </Link>
        <Link
          to="/patient/glucose"
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-colors flex items-center gap-1 ${
            location.pathname.startsWith('/patient/glucose') 
              ? 'bg-teal-600 text-white' 
              : 'text-slate-300 hover:bg-slate-900'
          }`}
        >
          <Activity size={13} />
          <span>Sugar</span>
        </Link>
        <Link
          to="/patient/medicines"
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-colors flex items-center gap-1 ${
            location.pathname.startsWith('/patient/medicines') 
              ? 'bg-teal-600 text-white' 
              : 'text-slate-300 hover:bg-slate-900'
          }`}
        >
          <Pill size={13} />
          <span>Meds</span>
        </Link>
        <Link
          to="/caregiver"
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-colors flex items-center gap-1 ${
            location.pathname.startsWith('/caregiver') 
              ? 'bg-teal-600 text-white' 
              : 'text-slate-300 hover:bg-slate-900'
          }`}
        >
          <Users size={13} />
          <span>Caregiver</span>
        </Link>
        <Link
          to="/doctor-report"
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-colors flex items-center gap-1 ${
            location.pathname.startsWith('/doctor-report') 
              ? 'bg-teal-600 text-white' 
              : 'text-slate-300 hover:bg-slate-900'
          }`}
        >
          <FileText size={13} />
          <span>Report</span>
        </Link>
      </div>
    </header>
  );
}
