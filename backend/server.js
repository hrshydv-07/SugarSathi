const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Root health & welcome route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DiaCare Senior API',
    problemStatement: 'CXHPS05 - Personalized Diabetes Management for Senior Citizens',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    version: '2.0.0'
  });
});

// Standard health endpoints
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'DiaCare Senior API' }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', service: 'DiaCare Senior API' }));

// Mongoose Connection Logging
mongoose.connection.on('connected', () => {
  console.log(`✅ [MongoDB] Connection established to database: "${mongoose.connection.name}" on ${mongoose.connection.host}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ [MongoDB] Connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn(`⚠️ [MongoDB] Disconnected from MongoDB. Reconnecting...`);
});

// Import DiaCare Senior Routes
const authRoutes = require('./routes/authRoutes');
const seniorRoutes = require('./routes/seniorRoutes');
const glucoseRoutes = require('./routes/glucoseRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const caregiverRoutes = require('./routes/caregiverRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const aiRoutes = require('./routes/aiRoutes');
const demoRoutes = require('./routes/demoRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/seniors', seniorRoutes);
app.use('/api/patients', seniorRoutes); // Alias for compatibility
app.use('/api/glucose', glucoseRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/caregivers', caregiverRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/whatsapp', require('./routes/whatsappWebhook'));

// Reminder Engine Cron Job
const { initReminderCron } = require('./jobs/reminderCron');

// 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `DiaCare API route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Application Error:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    status: statusCode
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diacare_senior';

  if (!process.env.MONGO_URI) {
    console.warn('⚠️ [Boot] MONGO_URI not set in environment. Falling back to default connection.');
  }

  const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`🔌 [Boot] Connecting to MongoDB (${maskedUri})...`);

  // Disable buffering so queries fail fast when disconnected and fall back to mock store
  mongoose.set('bufferCommands', false);

  mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 2500,
    connectTimeoutMS: 2500,
    socketTimeoutMS: 30000,
    maxPoolSize: 10
  }).then(() => {
    console.log(`✅ [Boot] MongoDB connection established. Ready State: ${mongoose.connection.readyState}`);
  }).catch((err) => {
    console.warn('⚠️ [Boot] MongoDB connection unavailable:', err.message);
    console.log('💡 [Boot] DiaCare Senior will run with Resilient In-Memory Mock Data Store for testing.');
  });

  // Initialize background reminder scheduler
  try {
    initReminderCron();
  } catch (cronErr) {
    console.warn('⚠️ Could not start cron worker:', cronErr.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DiaCare Senior Backend Server is listening on port ${PORT}`);
    console.log(`📡 Health check URL: http://localhost:${PORT}/api/health`);
  });
}

startServer();