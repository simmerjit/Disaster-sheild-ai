// auth.middleware.js
// Authentication is handled via Clerk at the frontend / integration layer.
// This middleware provides clean request passthrough and user role verification.

import User from '../models/user.model.js';

/**
 * Protect middleware placeholder for Clerk integration.
 * Passes the request through and optionally attaches user if clerkId header is passed.
 */
export const protect = async (req, res, next) => {
  try {
    const clerkId = req.headers['x-clerk-user-id'] || req.auth?.userId;
    if (clerkId) {
      const user = await User.findOne({ clerkId });
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role || 'guest'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};
