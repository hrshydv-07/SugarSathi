/**
 * DiaCare Senior - Deterministic Safety & Risk Engine
 * 
 * CRITICAL SAFETY PRINCIPLE:
 * This engine uses strictly deterministic rule-based evaluation based on
 * clinician-configured patient thresholds and standard geriatric diabetes guidelines (ADA / RSSDI).
 * LLMs NEVER decide or override clinical risk levels.
 */

// Default standard geriatric diabetes target thresholds (configurable per patient)
const DEFAULT_THRESHOLDS = {
  urgentLow: 54,       // mg/dL - Severe hypoglycemia crisis threshold
  mildLow: 70,         // mg/dL - Low blood glucose (hypoglycemia threshold)
  fastingTargetMin: 80,// mg/dL - Target range lower bound (fasting/pre-meal)
  fastingTargetMax: 130,// mg/dL - Target range upper bound (fasting/pre-meal)
  postMealTargetMax: 180,// mg/dL - Target range upper bound (1-2 hours post-meal)
  attentionHigh: 200,  // mg/dL - Elevated glucose requiring dietary/hydration attention
  urgentHigh: 300      // mg/dL - Severe hyperglycemia alert threshold
};

/**
 * Evaluates a single glucose reading against patient-configured target thresholds.
 * 
 * @param {Object} params
 * @param {number} params.value - Glucose reading in mg/dL
 * @param {string} params.mealContext - 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'random'
 * @param {Object} [params.patientProfile] - The patient's configured targets and profile
 * @param {Array<string>} [params.symptoms] - Accompanying symptoms reported
 * @returns {Object} Deterministic risk evaluation
 */
function evaluateGlucoseRisk({ value, mealContext = 'fasting', patientProfile = null, symptoms = [] }) {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('Invalid glucose value provided to risk engine');
  }

  // Extract patient's clinician-configured targets or fall back to standard defaults
  const customTargets = patientProfile?.targetGlucose || {};
  const urgentLow = Number(customTargets.urgentLowThreshold) || DEFAULT_THRESHOLDS.urgentLow;
  const mildLow = DEFAULT_THRESHOLDS.mildLow;
  const fastingMin = Number(customTargets.fastingMin) || DEFAULT_THRESHOLDS.fastingTargetMin;
  const fastingMax = Number(customTargets.fastingMax) || DEFAULT_THRESHOLDS.fastingTargetMax;
  const postMealMin = Number(customTargets.postMealMin) || DEFAULT_THRESHOLDS.fastingTargetMin;
  const postMealMax = Number(customTargets.postMealMax) || DEFAULT_THRESHOLDS.postMealTargetMax;
  const urgentHigh = Number(customTargets.urgentHighThreshold) || DEFAULT_THRESHOLDS.urgentHigh;

  const isPostMeal = mealContext === 'after_meal';
  const targetMin = isPostMeal ? postMealMin : fastingMin;
  const targetMax = isPostMeal ? postMealMax : fastingMax;

  const hasHypoSymptoms = symptoms.some(s => 
    ['Sweating', 'Shaking', 'Dizziness', 'Weakness', 'Confusion'].includes(s)
  );

  // 1. Severe Hypoglycemia (< urgentLow, default 54 mg/dL)
  if (value < urgentLow) {
    return {
      level: 'URGENT',
      reason: `Critically low blood sugar (${value} mg/dL, below urgent safety floor of ${urgentLow} mg/dL).`,
      supportingData: `Recorded ${value} mg/dL (${mealContext}). Configured minimum safe threshold is ${urgentLow} mg/dL.`,
      suggestedAction: 'Take 15 grams of fast-acting glucose immediately (e.g. 1/2 cup fruit juice or 3-4 glucose tablets). Rest sitting down. Alert your caregiver or family member now.',
      explanationText: `Your blood sugar reading of ${value} mg/dL is significantly lower than your safety threshold (${urgentLow} mg/dL). This requires prompt glucose intake and immediate caregiver notification.`,
      escalationRequired: true,
      requiresImmediateCaregiverAlert: true,
      matchedRule: 'SEVERE_HYPOGLYCEMIA_RULE',
      targetRange: { min: targetMin, max: targetMax }
    };
  }

  // 2. Mild Hypoglycemia (urgentLow <= value < mildLow, 54-69 mg/dL)
  if (value < mildLow) {
    return {
      level: 'ATTENTION',
      reason: `Low blood sugar (${value} mg/dL, below standard ${mildLow} mg/dL lower bound).`,
      supportingData: `Recorded ${value} mg/dL (${mealContext}). Target range is ${targetMin}–${targetMax} mg/dL.`,
      suggestedAction: 'Consume a small carbohydrate snack (such as biscuits, fruit, or warm milk). Re-check your blood glucose in 15 minutes. Inform your caregiver if you feel dizzy or shaky.',
      explanationText: `Your blood sugar reading of ${value} mg/dL is below your target lower limit of ${mildLow} mg/dL. Having a light carbohydrate snack helps bring it back into a safe range.`,
      escalationRequired: hasHypoSymptoms,
      requiresImmediateCaregiverAlert: false,
      matchedRule: 'MILD_HYPOGLYCEMIA_RULE',
      targetRange: { min: targetMin, max: targetMax }
    };
  }

  // 3. Normal / In Target (targetMin <= value <= targetMax)
  if (value >= targetMin && value <= targetMax) {
    return {
      level: 'NORMAL',
      reason: `Reading is within your configured target range (${targetMin}–${targetMax} mg/dL).`,
      supportingData: `Recorded ${value} mg/dL (${mealContext}). Configured target range: ${targetMin}–${targetMax} mg/dL.`,
      suggestedAction: 'Great job! Continue following your routine meals, scheduled medications, and hydration as planned.',
      explanationText: `Your reading of ${value} mg/dL fits comfortably within the target range (${targetMin}–${targetMax} mg/dL) set in your profile.`,
      escalationRequired: false,
      requiresImmediateCaregiverAlert: false,
      matchedRule: 'IN_TARGET_RANGE_RULE',
      targetRange: { min: targetMin, max: targetMax }
    };
  }

  // 4. Slightly Low (mildLow <= value < targetMin)
  if (value < targetMin) {
    return {
      level: 'ATTENTION',
      reason: `Reading is slightly below your target range (${targetMin}–${targetMax} mg/dL).`,
      supportingData: `Recorded ${value} mg/dL (${mealContext}). Configured target is ${targetMin}–${targetMax} mg/dL.`,
      suggestedAction: 'Ensure your upcoming meal is taken on time. Keep fresh water and a light snack handy.',
      explanationText: `Your blood sugar of ${value} mg/dL is just below your personalized target minimum of ${targetMin} mg/dL.`,
      escalationRequired: false,
      requiresImmediateCaregiverAlert: false,
      matchedRule: 'BORDERLINE_LOW_RULE',
      targetRange: { min: targetMin, max: targetMax }
    };
  }

  // 5. Very High / Hyperglycemia Alert (>= urgentHigh, default >= 300 mg/dL)
  if (value >= urgentHigh) {
    return {
      level: 'URGENT',
      reason: `Significantly elevated blood sugar (${value} mg/dL, above clinical alert threshold of ${urgentHigh} mg/dL).`,
      supportingData: `Recorded ${value} mg/dL (${mealContext}). Configured safe upper limit is ${targetMax} mg/dL; urgent alert threshold is ${urgentHigh} mg/dL.`,
      suggestedAction: 'Drink plenty of water to stay hydrated. Follow the high-sugar protocol provided by your clinician. If you experience nausea, shortness of breath, or deep fatigue, seek immediate medical consultation.',
      explanationText: `Your blood sugar of ${value} mg/dL is well above your clinician-configured upper limit (${targetMax} mg/dL). Because it exceeds ${urgentHigh} mg/dL, a safety notification has been queued for your caregiver.`,
      escalationRequired: true,
      requiresImmediateCaregiverAlert: true,
      matchedRule: 'SEVERE_HYPERGLYCEMIA_RULE',
      targetRange: { min: targetMin, max: targetMax }
    };
  }

  // 6. High (250 <= value < urgentHigh)
  if (value >= 250) {
    return {
      level: 'HIGH',
      reason: `Reading is high (${value} mg/dL, above your configured upper limit of ${targetMax} mg/dL).`,
      supportingData: `Recorded ${value} mg/dL (${mealContext}). Personalized target range: ${targetMin}–${targetMax} mg/dL.`,
      suggestedAction: 'Drink warm water or clear fluids. Take scheduled medications as directed by your clinician. Avoid sweet foods or sugary drinks. Notify your caregiver to keep them informed.',
      explanationText: `Your reading of ${value} mg/dL is higher than the upper limit (${targetMax} mg/dL) recorded in your care plan. Regular hydration and checking your next scheduled meal will help.`,
      escalationRequired: true,
      requiresImmediateCaregiverAlert: false,
      matchedRule: 'ELEVATED_HIGH_RULE',
      targetRange: { min: targetMin, max: targetMax }
    };
  }

  // 7. Elevated / Attention (targetMax < value < 250)
  return {
    level: 'ATTENTION',
    reason: `Reading is slightly higher than your target range (${targetMin}–${targetMax} mg/dL).`,
    supportingData: `Recorded ${value} mg/dL (${mealContext}). Configured target range: ${targetMin}–${targetMax} mg/dL.`,
    suggestedAction: 'Stay hydrated with plain water. Maintain your planned meal schedule and light walking. Continue taking your prescribed routine.',
    explanationText: `Your reading of ${value} mg/dL is slightly above your target ceiling of ${targetMax} mg/dL. Following your clinician's routine and drinking water will help maintain steady levels.`,
    escalationRequired: false,
    requiresImmediateCaregiverAlert: false,
    matchedRule: 'BORDERLINE_HIGH_RULE',
    targetRange: { min: targetMin, max: targetMax }
  };
}

/**
 * Calculates 7-day and 30-day summary metrics from a list of readings.
 */
function calculateGlucoseTrends(readings = [], customTargets = null) {
  if (!readings || readings.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      timeInRangePercent: 0,
      fastingAverage: 0,
      postMealAverage: 0,
      urgentEventsCount: 0,
      trendDirection: 'STABLE'
    };
  }

  const values = readings.map(r => r.value);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const average = Math.round(sum / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const fastingReadings = readings.filter(r => r.mealContext === 'fasting' || r.mealContext === 'before_meal');
  const postMealReadings = readings.filter(r => r.mealContext === 'after_meal');

  const fastingAvg = fastingReadings.length > 0 
    ? Math.round(fastingReadings.reduce((acc, r) => acc + r.value, 0) / fastingReadings.length)
    : 0;

  const postMealAvg = postMealReadings.length > 0
    ? Math.round(postMealReadings.reduce((acc, r) => acc + r.value, 0) / postMealReadings.length)
    : 0;

  // Time in Range (standard 70-180 mg/dL)
  const inRangeCount = readings.filter(r => r.value >= 70 && r.value <= 180).length;
  const timeInRangePercent = Math.round((inRangeCount / readings.length) * 100);

  const urgentEventsCount = readings.filter(r => r.value < 54 || r.value >= 300).length;

  // Trend direction: compare first half average with second half average
  let trendDirection = 'STABLE';
  if (readings.length >= 4) {
    const half = Math.floor(readings.length / 2);
    // Sort chronologically ascending
    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);

    const firstAvg = firstHalf.reduce((acc, r) => acc + r.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, r) => acc + r.value, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (diff > 15) trendDirection = 'RISING';
    else if (diff < -15) trendDirection = 'FALLING';
    else trendDirection = 'STABLE';
  }

  return {
    count: readings.length,
    average,
    min,
    max,
    timeInRangePercent,
    fastingAverage: fastingAvg,
    postMealAverage: postMealAvg,
    urgentEventsCount,
    trendDirection
  };
}

module.exports = {
  DEFAULT_THRESHOLDS,
  evaluateGlucoseRisk,
  calculateGlucoseTrends
};
