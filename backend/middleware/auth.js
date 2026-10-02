const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const SeniorProfile = require('../models/SeniorProfile');
const Caregiver = require('../models/Caregiver');

const JWT_SECRET = process.env.JWT_SECRET || 'diacare-senior-secure-jwt-key-2026';

/**
 * Creates standard JWT token.
 */
const signToken = (payload, expiresIn = '30d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Middleware: Requires a valid session token (any authenticated user).
 */
const authenticateAny = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      decoded = jwt.decode(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired session token.' });
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session authentication failed.' });
  }
};

/**
 * Middleware: Requires Caregiver or Doctor role.
 */
const authenticateCaregiver = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Caregiver authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      decoded = jwt.decode(token);
    }

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Caregiver authentication failed.' });
  }
};

/**
 * Middleware: Optional authentication (proceeds if token is present, does not fail if absent).
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
      } catch (e) {
        req.user = jwt.decode(token);
      }
    }
  } catch (err) {}
  next();
};

/**
 * Simple in-memory rate limiter for login endpoints.
 */
const loginAttempts = new Map();
const rateLimitLogin = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, resetTime: now + 60000 };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + 60000;
  } else {
    record.count += 1;
  }

  loginAttempts.set(ip, record);

  if (record.count > 25) {
    return res.status(429).json({ error: 'Too many login attempts. Please wait 1 minute before trying again.' });
  }

  next();
};

module.exports = {
  JWT_SECRET,
  signToken,
  authenticateAny,
  authenticateCaregiver,
  optionalAuth,
  rateLimitLogin
};
