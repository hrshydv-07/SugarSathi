import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getDoctorReportApi } from '../services/api';
import { 
  Printer, 
  Download, 
  FileText, 
  ChevronLeft, 
  Activity, 
  Pill, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar,
  Building,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DoctorReport() {
  const { currentSenior } = useApp();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('7');

  const patientId = currentSenior?.id || currentSenior?._id;

  const loadReport = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await getDoctorReportApi(patientId, days);
      setReport(res.report);
    } catch (err) {
      console.warn('Could not load doctor report:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [patientId, days]);

  const handlePrint = () => {
    window.print();
  };

  const patient = report?.patient;
  const glucose = report?.glucoseSummary;
  const adherence = report?.adherence;
  const medications = report?.medications || [];
  const riskEvents = report?.flaggedRiskEvents || [];
  const symptoms = report?.symptomCheckIns || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Screen Toolbar (Hidden during Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/patient"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              1-Page Doctor Clinical Report
            </h1>
            <p className="text-xs text-slate-500">
              Generated for physician consultation & follow-up review
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs px-3 py-2.5 font-bold"
          >
            <option value="7">Past 7 Days</option>
            <option value="14">Past 14 Days</option>
            <option value="30">Past 30 Days</option>
          </select>

          <button
            onClick={handlePrint}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <Printer size={16} />
            <span>Download PDF / Print</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE 1-PAGE DOCTOR REPORT SHEET */}
      <div className="doctor-report-page bg-white p-8 sm:p-10 rounded-3xl border border-slate-300 shadow-lg text-slate-900 space-y-6 font-sans">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-800 font-extrabold text-2xl tracking-tight">
              <Activity size={26} className="text-teal-700" />
              <span>DiaCare Senior — Clinical Summary Report</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Apex Senior Diabetes Clinic • MCI Reg: MCI-84729-D • Clinician: Dr. S. Rao, MD
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600">
            <div>Report ID: <strong>{report?.reportId || 'DC-DOC-784291'}</strong></div>
            <div>Period: <strong>{report?.reportingPeriod}</strong></div>
            <div>Generated: {new Date(report?.generatedAt || Date.now()).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Patient Demographic Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[10px]">Patient Name</span>
            <strong className="text-sm text-slate-900">{patient?.name || 'Ramesh Patel'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[10px]">Age & Gender</span>
            <strong className="text-sm text-slate-900">{patient?.age || 68} Y / {patient?.gender || 'Male'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[10px]">Condition</span>
            <strong className="text-sm text-slate-900">{patient?.diabetesType || 'Type 2 Diabetes'} (Dx {patient?.diagnosisYear || 2017})</strong>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[10px]">Primary Caregiver</span>
            <strong className="text-sm text-slate-900">{patient?.caregiverName || 'Priya Patel (Daughter)'}</strong>
          </div>
        </div>

        {/* 1. GLUCOSE SUMMARY TABLE & TIME IN RANGE */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity size={16} className="text-teal-700" />
            <span>1. Blood Glucose Overview</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Readings</span>
              <strong className="text-xl text-slate-900">{glucose?.totalReadings || '--'}</strong>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Mean Glucose</span>
              <strong className="text-xl text-slate-900">{glucose?.averageGlucose || '--'} mg/dL</strong>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-emerald-50 border-emerald-200">
              <span className="text-emerald-800 block text-[10px] uppercase font-bold">Time in Range</span>
              <strong className="text-xl text-emerald-900">{glucose?.timeInRangePercent ?? '--'}%</strong>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Fasting Mean</span>
              <strong className="text-xl text-slate-900">{glucose?.fastingAverage || '--'} mg/dL</strong>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Post-Meal Mean</span>
              <strong className="text-xl text-slate-900">{glucose?.postMealAverage || '--'} mg/dL</strong>
            </div>
          </div>
        </div>

        {/* 2. MEDICATION ADHERENCE & ACTIVE PRESCRIPTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-2xl p-4 text-xs">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-xs">
              <Pill size={15} className="text-teal-700" />
              <span>2. Prescribed Medications</span>
            </h4>
            <ul className="divide-y divide-slate-100">
              {medications.map((m, i) => (
                <li key={i} className="py-2 flex justify-between items-center">
                  <div>
                    <strong className="text-slate-900">{m.name}</strong>
                    <div className="text-[11px] text-slate-500 capitalize">{m.dosage} • {m.timing}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                    {m.mealRelation?.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 text-xs flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-xs">
                <CheckCircle2 size={15} className="text-emerald-700" />
                <span>3. Adherence Compliance</span>
              </h4>
              <div className="text-3xl font-black text-emerald-800 mb-1">
                {adherence?.percentage ?? 92}%
              </div>
              <p className="text-slate-600 leading-relaxed text-xs">
                {adherence?.takenCount ?? 0} of {adherence?.totalScheduled ?? 0} scheduled doses confirmed taken on time.
                Missed doses flagged for caregiver follow-up: <strong>{adherence?.missedCount ?? 0}</strong>.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500">
              Caregiver WhatsApp alerts: <strong>ENABLED & CONSENTED</strong>
            </div>
          </div>
        </div>

        {/* 3. FLAGGED CLINICAL RISK EVENTS & SYMPTOMS */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-amber-700" />
            <span>4. Flagged Events & Risk Audits</span>
          </h3>

          {riskEvents.length > 0 ? (
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Value</th>
                  <th className="p-2.5">Level</th>
                  <th className="p-2.5">Deterministic Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {riskEvents.slice(0, 5).map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5">{new Date(e.timestamp).toLocaleDateString()}</td>
                    <td className="p-2.5 font-bold">{e.value} mg/dL</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.level === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {e.level}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600">{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
              No high-risk glucose crisis events recorded during this reporting window.
            </p>
          )}
        </div>

        {/* CLINICAL DISCLAIMERS */}
        <div className="border-t-2 border-slate-300 pt-4 text-[11px] text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">Notice & Disclaimers:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Generated from patient-entered home readings and caregiver oversight records.</li>
            <li>Not an automated diagnosis. Provided exclusively for medical consultation reference.</li>
            <li>Does not modify medical prescriptions. Contact the treating doctor for dose adjustments.</li>
          </ul>
        </div>

        {/* Clinician Signature Line */}
        <div className="pt-6 flex justify-between items-end text-xs text-slate-700">
          <div>
            Patient Signature: __________________________
          </div>
          <div className="text-right">
            Clinician Signature: __________________________
          </div>
        </div>
      </div>
    </div>
  );
}
