import User from '../models/user.model.js';

/**
 * @desc    Get or sync current user profile (for Clerk integration)
 * @route   GET /api/auth/me
 * @access  Public / Clerk Auth
 */
export const getMe = async (req, res, next) => {
  try {
    const clerkId = req.headers['x-clerk-user-id'] || req.query.clerkId;

    if (!clerkId) {
      return res.status(200).json({
        success: true,
        message: 'Clerk authentication active. Provide clerkId to fetch user profile.',
        user: req.user || null,
      });
    }

    let user = await User.findOne({ clerkId });
    if (!user && req.query.email) {
      user = await User.create({
        clerkId,
        email: req.query.email,
        name: req.query.name || 'User',
        avatar: req.query.avatar || '',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Sync / Upsert user profile from Clerk
 * @route   POST /api/auth/sync
 * @access  Public / Clerk Auth
 */
export const syncUser = async (req, res, next) => {
  try {
    const { clerkId, email, name, avatar, role, phoneNumber, location } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({
        success: false,
        message: 'clerkId and email are required for syncing.',
      });
    }

    const user = await User.findOneAndUpdate(
      { $or: [{ clerkId }, { email }] },
      {
        $set: {
          clerkId,
          email,
          name: name || 'User',
          avatar: avatar || '',
          role: role || 'citizen',
          ...(phoneNumber && { phoneNumber }),
          ...(location && { location }),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};
