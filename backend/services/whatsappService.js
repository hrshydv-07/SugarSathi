require('dotenv').config();
const axios = require('axios');
const Notification = require('../models/Notification');

// In-memory buffer for recent mock notifications to allow instantaneous demo inspection
const mockNotificationsLog = [];

/**
 * Checks if real WhatsApp Cloud API credentials are configured.
 */
function isRealWhatsAppConfigured() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return Boolean(token && phoneId && token !== 'YOUR_WHATSAPP_TOKEN' && !token.includes('placeholder'));
}

/**
 * Sends a WhatsApp message in either REAL mode (via Meta Graph API) or MOCK mode (for demos & judging).
 * Always persists an audit record into the Notification collection.
 * 
 * @param {Object} params
 * @param {string} params.toNumber - Recipient phone number in E.164 format
 * @param {string} params.messageBody - Plain text message
 * @param {string} [params.patientId] - Senior patient ObjectId
 * @param {string} [params.recipientType] - 'caregiver' | 'senior' | 'doctor'
 * @param {string} [params.recipientName] - Display name
 * @param {string} [params.triggerReason] - Reason for dispatch
 */
async function sendWhatsAppNotification({
  toNumber,
  messageBody,
  patientId = null,
  recipientType = 'caregiver',
  recipientName = 'Caregiver',
  triggerReason = 'missed_medicine'
}) {
  const cleanNumber = toNumber ? String(toNumber).replace(/[^\d+]/g, '') : '+919876543210';
  const realMode = isRealWhatsAppConfigured();

  console.log(`📱 [WhatsApp Service] [${realMode ? 'REAL API' : 'MOCK MODE'}] Dispatching to ${cleanNumber}:`);
  console.log(`   📝 Trigger: ${triggerReason}`);
  console.log(`   💬 Message: ${messageBody.replace(/\n/g, ' ')}`);

  let status = 'mock_sent';
  let providerResponse = null;

  if (realMode) {
    try {
      const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const response = await axios.post(
        WHATSAPP_API_URL,
        {
          messaging_product: 'whatsapp',
          to: cleanNumber.replace('+', ''),
          type: 'text',
          text: { body: messageBody }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );
      status = 'sent';
      providerResponse = response.data;
      console.log('✅ [WhatsApp Service] Message successfully sent via Meta Graph API:', response.data);
    } catch (err) {
      console.error('⚠️ [WhatsApp Service] Graph API call failed, falling back to mock mode:', err.response?.data?.error?.message || err.message);
      status = 'failed';
      providerResponse = { error: err.response?.data?.error || err.message };
    }
  } else {
    // Simulated realistic delivery delay
    providerResponse = {
      mock: true,
      simulationMessage: 'Real credentials not set. Simulated notification delivered successfully in MOCK mode.',
      messageId: `mock_wamid_${Date.now()}`
    };
  }

  // Push to recent memory buffer
  const logEntry = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    patientId,
    recipientType,
    recipientName,
    recipientContact: cleanNumber,
    channel: 'whatsapp',
    title: triggerReason.replace(/_/g, ' ').toUpperCase(),
    message: messageBody,
    triggerReason,
    status,
    timestamp: new Date()
  };
  mockNotificationsLog.unshift(logEntry);
  if (mockNotificationsLog.length > 50) mockNotificationsLog.pop();

  // Persist to MongoDB if database is connected
  try {
    if (patientId) {
      await Notification.create({
        patientId,
        recipientType,
        recipientName,
        recipientContact: cleanNumber,
        channel: 'whatsapp',
        title: triggerReason.replace(/_/g, ' ').toUpperCase(),
        message: messageBody,
        triggerReason,
        status,
        providerResponse,
        timestamp: new Date()
      });
    }
  } catch (dbErr) {
    console.warn('⚠️ Could not save notification to database:', dbErr.message);
  }

  return {
    success: status === 'sent' || status === 'mock_sent',
    mode: realMode ? 'REAL' : 'MOCK',
    status,
    recipient: cleanNumber,
    logEntry
  };
}

/**
 * Returns recent notifications for demo inspection in the caregiver dashboard.
 */
function getRecentNotifications(patientId = null) {
  if (patientId) {
    return mockNotificationsLog.filter(n => !n.patientId || String(n.patientId) === String(patientId));
  }
  return mockNotificationsLog;
}

module.exports = {
  isRealWhatsAppConfigured,
  sendWhatsAppNotification,
  getRecentNotifications
};