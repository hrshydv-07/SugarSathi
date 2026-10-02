import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getGlucoseHistoryApi, getGlucoseTrendsApi } from '../../services/api';
import { 
  Activity, 
  Mic, 
  Calendar, 
  Clock, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Filter, 
  Plus,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VoiceGlucoseModal from '../../components/VoiceGlucoseModal';
import ExplanationModal from '../../components/ExplanationModal';
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

export default function SeniorGlucoseLog() {
  const { currentSenior, setActiveExplanation } = useApp();
  const [readings, setReadings] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('7'); // '7' | '30'

  const patientId = currentSenior?.id || currentSenior?._id;

  const loadData = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [histRes, trendRes] = await Promise.all([
        getGlucoseHistoryApi(patientId, Number(timeRange)),
        getGlucoseTrendsApi(patientId)
      ]);
      setReadings(histRes.readings || []);
      setTrends(timeRange === '7' ? trendRes.trends7d : trendRes.trends30d);
    } catch (err) {
      console.warn('Could not fetch glucose history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId, timeRange]);

  // Chart data formatting
  const chartData = [...readings].reverse().map(r => ({
    time: new Date(r.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: r.value,
    context: r.mealContext
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/patient"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Back to Dashboard"
          >
            <ChevronLeft size={22} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Blood Sugar Log & Trends
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Target Range: <strong>80–180 mg/dL</strong> (Safe geriatric range)
            </p>
          </div>
        </div>

        <button
          onClick={() => setVoiceModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-base touch-target-senior cursor-pointer shadow-md"
        >
          <Mic size={20} />
          <span>Log New Reading</span>
        </button>
      </div>

      {/* 7-DAY & 30-DAY METRIC SUMMARY TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Average Sugar</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            {trends?.average || '--'} <span className="text-sm font-medium text-slate-500">mg/dL</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Over {timeRange} days</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 uppercase">Time In Range (TIR)</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-800 mt-1">
            {trends?.timeInRangePercent ?? '--'}%
          </div>
          <span className="text-xs text-slate-500 font-medium">Target 70–180 mg/dL</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Fasting Average</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            {trends?.fastingAverage || '--'} <span className="text-sm font-medium text-slate-500">mg/dL</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Morning readings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">After Meal Average</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            {trends?.postMealAverage || '--'} <span className="text-sm font-medium text-slate-500">mg/dL</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Post-prandial</span>
        </div>
      </div>

      {/* TREND CHART (Senior-Friendly, High Contrast, Target Band) */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {timeRange}-Day Blood Sugar Trend
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              The green shaded band indicates your clinician-approved target zone (80–180 mg/dL).
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setTimeRange('7')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${timeRange === '7' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'}`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${timeRange === '30' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'}`}
            >
              Past 30 Days
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[40, 320]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs">
                          <p className="font-bold text-sm text-teal-300">{data.value} mg/dL</p>
                          <p className="capitalize text-slate-300 mt-0.5">{data.context?.replace('_', ' ')}</p>
                          <p className="text-slate-400 mt-1">{data.time}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Target Range Green Band */}
                <ReferenceArea y1={80} y2={180} fill="#10B981" fillOpacity={0.12} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0D9488"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0D9488', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 8, fill: '#0F2942' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            No readings recorded for this range.
          </div>
        )}
      </section>

      {/* READING HISTORY LIST */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Recorded Readings History
        </h2>

        <div className="divide-y divide-slate-100">
          {readings.map((r) => {
            const isHigh = r.value > 180;
            const isLow = r.value < 70;
            const level = r.riskAssessment?.level || (isHigh ? 'ATTENTION' : isLow ? 'ATTENTION' : 'NORMAL');

            return (
              <div key={r._id} className="py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="text-3xl sm:text-4xl font-black text-slate-900">
                    {r.value} <span className="text-xs font-semibold text-slate-500">mg/dL</span>
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-bold text-slate-800 capitalize">
                      {r.mealContext?.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(r.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    level === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' : level === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {level}
                  </span>

                  <button
                    onClick={() => {
                      setActiveExplanation({
                        value: r.value,
                        level,
                        reason: r.riskAssessment?.reason || 'Evaluation against target range.',
                        why: r.riskAssessment?.explanationText || `Your blood sugar reading of ${r.value} mg/dL was evaluated against your configured range.`,
                        nextStep: r.riskAssessment?.suggestedAction || 'Follow your regular daily diabetes plan.'
                      });
                    }}
                    className="p-2 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-xl cursor-pointer"
                    title="Why was this flagged?"
                  >
                    <HelpCircle size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <VoiceGlucoseModal
        isOpen={voiceModalOpen}
        onClose={() => {
          setVoiceModalOpen(false);
          loadData();
        }}
        onReadingSaved={() => loadData()}
      />

      <ExplanationModal />
    </div>
  );
}
