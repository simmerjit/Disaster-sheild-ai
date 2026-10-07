// auth.middleware.js
// Authentication is handled via Clerk at the frontend / integration layer.
// This middleware attaches a user when available and keeps the API resilient in local/demo modes.

import mongoose from 'mongoose';
import User from '../models/user.model.js';

const demoAuthEnabled =
  process.env.DEMO_AUTH_ENABLED === 'true' && process.env.NODE_ENV !== 'production';

/**
 * Attach a database user only when Clerk has verified the request identity.
 */
export const protect = async (req, res, next) => {
  try {
    if (req.auth?.userId && mongoose.connection.readyState === 1) {
      req.user = await User.findOne({ clerkId: req.auth.userId });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = (req, res, next) => {
  if (req.auth?.userId) {
    return next();
  }

  if (demoAuthEnabled) {
    req.demoAuth = true;
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication is required for this action.',
  });
};

export const requireDemoAuth = (req, res, next) => {
  if (demoAuthEnabled) {
    req.demoAuth = true;
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Demo sign-in is disabled. Configure Clerk authentication to continue.',
  });
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.demoAuth) {
      return next();
    }

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role || 'guest'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

export const authorizeTeamAccess = (source) => (req, res, next) => {
  if (req.demoAuth || ['admin', 'coordinator'].includes(req.user?.role)) {
    return next();
  }

  const teamId = source === 'body' ? req.body?.teamId : req.params?.id;
  const linkedTeamIds = [req.user?.rescueTeamId, req.user?.teamCode]
    .filter(Boolean)
    .map(String);
  if (req.user?.role === 'rescue_worker' && linkedTeamIds.includes(String(teamId))) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'You are not authorized to manage this rescue team.',
  });
};
