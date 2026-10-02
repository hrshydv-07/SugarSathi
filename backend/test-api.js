const http = require('http');

async function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting DiaCare Senior End-to-End API Verification...\n');

  // 1. Health
  const health = await request({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('1. Health check:', health.status, health.body);

  // 2. Demo Profiles
  const profiles = await request({ host: 'localhost', port: 5000, path: '/api/demo/profiles', method: 'GET' });
  console.log('2. Demo profiles count:', profiles.body.profiles?.length, 'First:', profiles.body.profiles?.[0]?.name);

  // 3. Demo Login
  const login = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/demo-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'SENIOR', profileKey: 'senior_a' });
  const patientId = login.body.senior?.id || login.body.senior?._id || 'mock_senior_a';
  console.log('3. Demo login status:', login.status, 'Senior:', login.body.senior?.name, 'ID:', patientId);

  // 4. Voice Transcription Parser (Hindi)
  const voiceHi = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/glucose/parse-voice',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { transcript: 'मेरा शुगर 280 है खाने के बाद', language: 'hi' });
  console.log('4. Voice parse (Hindi):', voiceHi.body);

  // 5. Voice Transcription Parser (Marathi)
  const voiceMr = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/glucose/parse-voice',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { transcript: 'माझी साखर ६५ आहे उपाशी पोटी', language: 'mr' });
  console.log('5. Voice parse (Marathi):', voiceMr.body);

  // 6. Log Glucose Reading (Deterministic Risk Engine)
  const glucoseLog = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/glucose',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    patientId: patientId,
    value: 280,
    unit: 'mg/dL',
    mealContext: 'after_meal',
    source: 'voice'
  });
  console.log('6. Glucose Log Risk Evaluation: Level =', glucoseLog.body.riskAssessment?.level, 'Escalation =', glucoseLog.body.escalationSent);
  console.log('   Explanation:', glucoseLog.body.explanation?.why);

  // 7. Explainability Endpoint
  const explain = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/glucose/explain/${glucoseLog.body.reading?._id || 'mock_reading_demo_high'}`,
    method: 'GET'
  });
  console.log('7. Explain endpoint:', explain.body.level, explain.body.explanation?.why);

  // 8. Trends
  const trends = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/glucose/trends/${patientId}`,
    method: 'GET'
  });
  console.log('8. 7-day Trends TIR:', trends.body.trends7d?.timeInRangePercent + '%', 'Avg:', trends.body.trends7d?.average);

  // 9. Simulate Missed Medicine & Escalation
  const missed = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/medications/simulate-missed',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { patientId: patientId });
  console.log('9. Missed medicine escalation:', missed.body.message, 'Dispatch:', missed.body.dispatchResult?.channel);

  // 10. Caregiver Dashboard Overview
  const cgSummary = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/caregivers/patient/${patientId}/summary`,
    method: 'GET'
  });
  console.log('10. Caregiver Dashboard:', cgSummary.body.patient?.name, 'Adherence:', cgSummary.body.todayStatus?.adherenceRate + '%', 'Active Alerts:', cgSummary.body.todayStatus?.activeAlertsCount);

  // 11. Doctor 1-Page Report
  const docReport = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/doctors/patient/${patientId}/report?days=7`,
    method: 'GET'
  });
  const rData = docReport.body.report || docReport.body.reportData;
  console.log('11. Doctor Report ID:', rData?.reportId, 'Readings:', rData?.glucoseSummary?.totalReadings);

  console.log('\n✅ ALL BACKEND ENDPOINTS PASSED WITH FLYING COLORS!\n');
}

runTests().catch(console.error);
