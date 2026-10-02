import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  getCaregiverSummaryApi, 
  getCaregiverNotificationsApi, 
  sendTestCaregiverAlertApi 
} from '../../services/api';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Pill, 
  CheckCircle2, 
  Clock, 
  Bell, 
  Phone, 
  FileText, 
  Send, 
  User, 
  Utensils, 
  Footprints, 
  Lock, 
  Sparkles,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceArea, 
  CartesianGrid 
} from 'recharts';

export default function CaregiverDashboard() {
  const { currentSenior, switchDemoProfile } = useApp();
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [testAlertToast, setTestAlertToast] = useState('');

  const patientId = currentSenior?.id || currentSenior?._id;

  const loadCaregiverData = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [sumRes, notifRes] = await Promise.all([
        getCaregiverSummaryApi(patientId),
        getCaregiverNotificationsApi(patientId)
      ]);
      setSummary(sumRes);
      setNotifications(notifRes.notifications || []);
    } catch (err) {
      console.warn('Caregiver data load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaregiverData();
  }, [patientId]);

  const handleSendTestAlert = async () => {
    setTestAlertSending(true);
    try {
      await sendTestCaregiverAlertApi(patientId);
      setTestAlertToast('Test WhatsApp care notification dispatched! (Mock Mode active)');
      loadCaregiverData();
      setTimeout(() => setTestAlertToast(''), 6000);
    } catch (err) {
      setTestAlertToast('Could not send test notification.');
    } finally {
      setTestAlertSending(false);
    }
  };

  const patient = summary?.patient;
  const todayStatus = summary?.todayStatus;
  const trends = summary?.trends;
  const riskAlerts = summary?.riskAlerts || [];
  const symptoms = summary?.symptoms || [];
  const activities = summary?.activities || [];

  // Chart data
  const chartData = (summary?.readings || []).map(r => ({
    time: new Date(r.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: r.value
  })).reverse();

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      {/* Caregiver Portal Top Banner */}
      <div className="bg-[#0F2942] text-white rounded-3xl p-5 sm:p-8 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">
            <ShieldCheck size={16} className="shrink-0" />
            <span>Caregiver & Family Oversight Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight truncate">
            Senior: <span className="text-teal-400">{patient?.name || 'Ramesh Patel'}</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Age {patient?.age || 68} • {patient?.diabetesType || 'Type 2 Diabetes'} • Target: {patient?.targetRange?.fastingMin || 80}–{patient?.targetRange?.postMealMax || 180} mg/dL
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          <Link
            to="/doctor-report"
            className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors touch-target-senior"
          >
            <FileText size={16} />
            <span>1-Page Doctor Report</span>
          </Link>

          <button
            type="button"
            onClick={handleSendTestAlert}
            disabled={testAlertSending}
            className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-500 text-white px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm active:scale-95 touch-target-senior"
          >
            <Send size={15} />
            <span>{testAlertSending ? 'Sending...' : 'Test WhatsApp Alert'}</span>
          </button>
        </div>
      </div>

      {testAlertToast && (
        <div className="bg-emerald-950 text-emerald-100 border border-emerald-700 px-4 py-3 rounded-2xl text-sm font-semibold animate-fade-in flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{testAlertToast}</span>
        </div>
      )}

      {/* TODAY'S STATUS TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Tile 1: Latest Glucose */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Latest Blood Sugar</span>
            <Activity size={16} className="text-teal-600" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-[#0F2942] mt-2 truncate">
            {todayStatus?.latestGlucose?.value || '--'} <span className="text-xs sm:text-sm font-medium text-slate-500">mg/dL</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 capitalize font-medium truncate">
            {todayStatus?.latestGlucose?.mealContext?.replace('_', ' ') || 'No reading today'}
          </div>
        </div>

        {/* Tile 2: Medication Adherence */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Medication Adherence</span>
            <Pill size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-emerald-700 mt-2 truncate">
            {todayStatus?.adherenceRate ?? 92}%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium truncate">
            {todayStatus?.takenCount ?? 0} of {todayStatus?.totalMedsScheduled ?? 0} scheduled taken
          </div>
        </div>

        {/* Tile 3: Time in Range */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Time in Range (7D)</span>
            <ShieldCheck size={16} className="text-teal-600" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-[#0F2942] mt-2 truncate">
            {trends?.timeInRangePercent ?? 85}%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium truncate">
            Target: 80–180 mg/dL
          </div>
        </div>

        {/* Tile 4: Active Alerts */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Escalation Events</span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-amber-700 mt-2 truncate">
            {riskAlerts.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium truncate">
            Logged events & alerts
          </div>
        </div>
      </div>

      {/* TWO COLUMN SECTION: Glucose Analytics & WhatsApp Care Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left: 7-Day Glucose Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#0F2942]">
                7-Day Glucose Analytics
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Average: <strong>{trends?.average || '--'} mg/dL</strong> • Min: {trends?.min || '--'} • Max: {trends?.max || '--'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
              Trend: {trends?.trendDirection || 'STABLE'}
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis domain={[50, 300]} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-md">
                          <p className="font-bold text-teal-300">{payload[0].value} mg/dL</p>
                          <p className="text-slate-400 mt-0.5">{payload[0].payload.time}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceArea y1={80} y2={180} fill="#10B981" fillOpacity={0.12} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0F2942"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0D9488' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: WhatsApp Notification Stream */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0F2942] flex items-center gap-2">
                <MessageSquare size={20} className="text-teal-600" />
                <span>WhatsApp Care Feed</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-300">
                Mock Mode
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              When patient misses scheduled doses or exceeds safe thresholds, WhatsApp escalations appear here.
            </p>

            {/* Notification items */}
            <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1 no-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((notif, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="text-teal-800 uppercase tracking-wider truncate">{notif.title || notif.triggerReason}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-sans">{notif.message}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-medium border-t border-slate-200/60 mt-1">
                      <span>To: {notif.recipientContact || '+91 98765 43210'}</span>
                      <span className="text-emerald-700 font-bold uppercase">● {notif.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No alerts queued yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSendTestAlert}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors touch-target-senior"
            >
              <Send size={13} />
              <span>Simulate WhatsApp Escalation</span>
            </button>
          </div>
        </div>
      </div>

      {/* RISK ALERTS TABLE */}
      <section className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200">
        <h2 className="text-lg sm:text-xl font-bold text-[#0F2942] mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-600" />
          <span>Clinical Risk & Escalation Log</span>
        </h2>

        {riskAlerts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {riskAlerts.map((alert) => {
              const isUrgent = alert.level === 'URGENT';
              const isHigh = alert.level === 'HIGH';

              return (
                <div key={alert._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isUrgent ? 'bg-red-100 text-red-700' : isHigh ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                        {alert.glucoseValue ? `${alert.glucoseValue} mg/dL recorded` : 'Care Escalation'}
                        <span className="text-xs font-semibold text-slate-500 ml-2">({alert.mealContext || 'Medication event'})</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{alert.reason}</p>
                      <p className="text-xs text-teal-700 font-medium mt-1">Suggested action: {alert.suggestedAction}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isUrgent ? 'bg-red-100 text-red-800' : isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.level}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">
            No risk events recorded for {patient?.name}.
          </div>
        )}
      </section>

      {/* SYMPTOMS & ACTIVITY ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Recent Symptoms */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200">
          <h2 className="text-lg sm:text-xl font-bold text-[#0F2942] mb-4">
            Recent Symptoms Checked
          </h2>
          {symptoms.length > 0 ? (
            <div className="space-y-2.5">
              {symptoms.map((s, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {s.symptoms?.join(', ') || 'Feeling okay'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {new Date(s.timestamp).toLocaleDateString()} at {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${
                    s.severity === 'severe' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {s.severity || 'mild'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              No recent symptoms reported.
            </div>
          )}
        </div>

        {/* Recent Physical Activity */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200">
          <h2 className="text-lg sm:text-xl font-bold text-[#0F2942] mb-4 flex items-center gap-2">
            <Footprints size={20} className="text-emerald-600" />
            <span>Physical Activity & Walking</span>
          </h2>
          {activities.length > 0 ? (
            <div className="space-y-2.5">
              {activities.map((a, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm capitalize truncate">
                      {a.type || 'Walking'} — {a.durationMinutes || 20} mins
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {new Date(a.timestamp).toLocaleDateString()} • {a.notes || 'Park walk'}
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl shrink-0">
                    {a.steps || 1800} steps
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              No activity logs recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
