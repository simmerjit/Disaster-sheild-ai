import mongoose from 'mongoose';
import { clerkClient } from '@clerk/express';
import User from '../models/user.model.js';
import RescueTeam from '../models/rescueTeam.model.js';
import { inMemoryRescueTeams as inMemoryTeams } from './rescue.controller.js';

const demoAuthEnabled =
  process.env.DEMO_AUTH_ENABLED === 'true' && process.env.NODE_ENV !== 'production';

// In-memory fallback store for offline/local resilience
const inMemoryUsers = new Map();

const isDbReady = () => mongoose.connection.readyState === 1;

/**
 * @desc    Get or sync current user profile (for Clerk integration)
 * @route   GET /api/auth/me
 * @access  Public / Clerk Auth
 */
export const getMe = async (req, res, next) => {
  try {
    const clerkId = req.auth?.userId;
    if (!clerkId) {
      return res.status(401).json({
        success: false,
        message: 'A verified Clerk session is required.',
      });
    }

    if (isDbReady()) {
      const user = await User.findOne({ clerkId });

      let rescueTeam = null;
      if (user && (user.role === 'rescue_worker' || user.rescueTeamId)) {
        if (user.rescueTeamId) {
          rescueTeam = await RescueTeam.findById(user.rescueTeamId);
        } else {
          rescueTeam = await RescueTeam.findOne({
            $or: [{ email: user.email }, { teamCode: user.teamCode }],
          });
        }
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found. Synchronize the authenticated account first.',
        });
      }

      return res.status(200).json({ success: true, user, rescueTeam });
    }

    const user = inMemoryUsers.get(clerkId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Synchronize the authenticated account first.',
      });
    }

    res.status(200).json({
      success: true,
      user,
      rescueTeam: inMemoryTeams.get(user.teamCode) || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Sync / Upsert user profile from Clerk or Registration
 * @route   POST /api/auth/sync
 * @access  Public / Clerk Auth
 */
export const syncUser = async (req, res, next) => {
  try {
    const { email: submittedEmail, name: submittedName, avatar, phoneNumber, location } = req.body;
    const clerkId = req.auth?.userId;
    if (!clerkId && !demoAuthEnabled) {
      return res.status(401).json({
        success: false,
        message: 'Sign in with a verified account before creating a profile.',
      });
    }

    let email = submittedEmail?.trim().toLowerCase();
    let name = submittedName?.trim();
    let verifiedAvatar = avatar;
    if (clerkId) {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const primaryEmail = clerkUser.emailAddresses.find(
        (address) => address.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;
      if (!primaryEmail) {
        return res.status(400).json({
          success: false,
          message: 'A primary email address is required to create a profile.',
        });
      }

      email = primaryEmail.toLowerCase();
      name = clerkUser.fullName || clerkUser.firstName || name;
      verifiedAvatar = clerkUser.imageUrl;
    }
    const role = 'citizen';

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for synchronization.',
      });
    }

    const cId = clerkId || `demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (isDbReady()) {
      let user = await User.findOne({ clerkId: cId });
      if (!user) {
        const emailOwner = await User.findOne({ email });
        if (emailOwner) {
          return res.status(409).json({
            success: false,
            message: 'This email is already linked to a different account.',
          });
        }

        try {
          user = await User.create({
            clerkId: cId,
            email,
            name: name || 'User',
            avatar: verifiedAvatar || '',
            role,
            organization: 'General Public',
            phoneNumber,
            ...(location && { location }),
          });
        } catch (error) {
          if (error.code !== 11000) throw error;
          user = await User.findOne({ clerkId: cId });
          if (!user || user.email !== email) {
            return res.status(409).json({
              success: false,
              message: 'This email is already linked to a different account.',
            });
          }
        }
      } else {
        user.name = name || user.name;
        user.avatar = verifiedAvatar || user.avatar;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (location) user.location = location;
        await user.save();
      }

      const rescueTeam =
        user.role === 'rescue_worker' && user.rescueTeamId
          ? await RescueTeam.findById(user.rescueTeamId)
          : null;

      return res.status(200).json({ success: true, user, rescueTeam });
    }

    const existingUser = inMemoryUsers.get(cId);
    if (existingUser && existingUser.email !== email) {
      return res.status(409).json({
        success: false,
        message: 'This account is already linked to a different email.',
      });
    }
    const emailOwner = inMemoryUsers.get(email);
    if (emailOwner && emailOwner.clerkId !== cId) {
      return res.status(409).json({
        success: false,
        message: 'This email is already linked to a different account.',
      });
    }

    const mockUser = {
      ...(existingUser || {}),
      _id: existingUser?._id || `mem_user_${Date.now()}`,
      clerkId: cId,
      email,
      name: name || existingUser?.name || 'User',
      avatar: verifiedAvatar || existingUser?.avatar || '',
      role: existingUser?.role || role,
      organization: existingUser?.organization || 'General Public',
      phoneNumber: phoneNumber || existingUser?.phoneNumber || '',
      location: location || existingUser?.location || {
        latitude: 28.6139,
        longitude: 77.209,
        address: 'New Delhi, India',
      },
    };

    inMemoryUsers.set(cId, mockUser);
    inMemoryUsers.set(email, mockUser);

    res.status(200).json({
      success: true,
      user: mockUser,
      rescueTeam: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Direct Email / Callsign User Login (local demo only)
 * @route   POST /api/auth/login
 */
export const loginUser = async (req, res, next) => {
  try {
    if (!demoAuthEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Passwordless demo login is disabled. Sign in through Clerk instead.',
      });
    }

    const { emailOrCode } = req.body;
    if (!emailOrCode) {
      return res.status(400).json({
        success: false,
        message: 'Email, Call Sign, or Username is required.',
      });
    }

    const query = emailOrCode.trim();

    if (isDbReady()) {
      let user = await User.findOne({
        $or: [
          { email: query.toLowerCase() },
          { teamCode: query.toUpperCase() },
          { clerkId: query },
        ],
      });

      let rescueTeam = null;
      if (!user) {
        rescueTeam = await RescueTeam.findOne({
          $or: [{ teamCode: query.toUpperCase() }, { email: query.toLowerCase() }],
        });
        if (rescueTeam) {
          user = await User.findOne({ email: rescueTeam.email });
          if (!user && demoAuthEnabled) {
            try {
              user = await User.create({
                clerkId: `demo_${rescueTeam.teamCode}`,
                email: rescueTeam.email,
                name: rescueTeam.leaderName || rescueTeam.teamName,
                role: 'rescue_worker',
                organization: rescueTeam.organization,
                specialization: rescueTeam.specialization,
                teamCode: rescueTeam.teamCode,
                rescueTeamId: rescueTeam._id,
                location: rescueTeam.location,
              });
            } catch (error) {
              if (error.code !== 11000) throw error;
              user = await User.findOne({ email: rescueTeam.email });
            }
          }
        }
      } else if (user.role === 'rescue_worker' || user.rescueTeamId) {
        rescueTeam =
          (await RescueTeam.findById(user.rescueTeamId)) ||
          (await RescueTeam.findOne({ $or: [{ email: user.email }, { teamCode: user.teamCode }] }));
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Demo account not found. Verify the profile identifier.',
        });
      }

      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}`,
        user,
        rescueTeam,
      });
    }

    const queryUpper = query.toUpperCase();
    const queryLower = query.toLowerCase();
    let user = inMemoryUsers.get(queryLower) || inMemoryUsers.get(queryUpper) || inMemoryUsers.get(query);
    let rescueTeam = null;
    if (!user) {
      rescueTeam = inMemoryTeams.get(queryUpper) || null;
      if (rescueTeam) {
        user = {
          _id: `demo_user_${rescueTeam._id}`,
          clerkId: `demo_${rescueTeam.teamCode}`,
          name: rescueTeam.leaderName || rescueTeam.teamName,
          email: rescueTeam.email,
          role: 'rescue_worker',
          organization: rescueTeam.organization,
          specialization: rescueTeam.specialization,
          teamCode: rescueTeam.teamCode,
          rescueTeamId: rescueTeam._id,
          location: rescueTeam.location,
        };
        inMemoryUsers.set(queryUpper, user);
        inMemoryUsers.set(queryLower, user);
        inMemoryUsers.set(rescueTeam.email.toLowerCase(), user);
      }
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Demo account not found. Verify the profile identifier.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}`,
      user,
      rescueTeam: rescueTeam || inMemoryTeams.get(user.teamCode) || null,
    });
  } catch (error) {
    next(error);
  }
};
