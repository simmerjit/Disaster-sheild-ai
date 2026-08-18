import User from '../models/user.model.js';
import RescueTeam from '../models/rescueTeam.model.js';

/**
 * @desc    Get or sync current user profile (for Clerk integration)
 * @route   GET /api/auth/me
 * @access  Public / Clerk Auth
 */
export const getMe = async (req, res, next) => {
  try {
    const clerkId = req.headers['x-clerk-user-id'] || req.query.clerkId;
    const email = req.query.email;

    let user = null;
    if (clerkId) {
      user = await User.findOne({ clerkId });
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user && (clerkId || email)) {
      user = await User.create({
        clerkId: clerkId || `user_${Date.now()}`,
        email: email || `${clerkId}@clerk.user`,
        name: req.query.name || 'Emergency Responder',
        avatar: req.query.avatar || '',
        role: req.query.role || 'citizen',
      });
    }

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

    res.status(200).json({
      success: true,
      user,
      rescueTeam,
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
    const {
      clerkId,
      email,
      name,
      avatar,
      role = 'citizen',
      phoneNumber,
      organization,
      specialization,
      teamCode,
      location,
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for synchronization.',
      });
    }

    const cId = clerkId || `clerk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let rescueTeam = null;
    if (role === 'rescue_worker') {
      const code = teamCode || `SAR-${Math.floor(1000 + Math.random() * 9000)}`;
      rescueTeam = await RescueTeam.findOneAndUpdate(
        { $or: [{ email: email.toLowerCase() }, { teamCode: code.toUpperCase() }] },
        {
          $set: {
            teamName: organization || `${name}'s Rescue Unit`,
            teamCode: code.toUpperCase(),
            organization: organization || 'Emergency Response Authority',
            specialization: specialization || 'general_sar',
            leaderName: name,
            contactPhone: phoneNumber || '+91 1078',
            email: email.toLowerCase(),
            location: {
              latitude: location?.latitude || 28.6139,
              longitude: location?.longitude || 77.209,
              address: location?.address || 'Field Command Post',
              lastUpdated: new Date(),
            },
            status: 'available',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const user = await User.findOneAndUpdate(
      { $or: [{ clerkId: cId }, { email: email.toLowerCase() }] },
      {
        $set: {
          clerkId: cId,
          email: email.toLowerCase(),
          name: name || 'User',
          avatar: avatar || '',
          role,
          organization: organization || (role === 'rescue_worker' ? 'Rescue Services' : 'General Public'),
          specialization: specialization || 'general_sar',
          teamCode: rescueTeam?.teamCode || teamCode || '',
          rescueTeamId: rescueTeam?._id || null,
          ...(phoneNumber && { phoneNumber }),
          ...(location && { location }),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      user,
      rescueTeam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Direct Email / Callsign User Login
 * @route   POST /api/auth/login
 */
export const loginUser = async (req, res, next) => {
  try {
    const { emailOrCode, password } = req.body;

    if (!emailOrCode) {
      return res.status(400).json({
        success: false,
        message: 'Email, Call Sign, or Username is required.',
      });
    }

    const query = emailOrCode.trim();
    let user = await User.findOne({
      $or: [
        { email: query.toLowerCase() },
        { teamCode: query.toUpperCase() },
        { clerkId: query },
      ],
    });

    let rescueTeam = null;

    // Check if it matches a RescueTeam code directly
    if (!user) {
      rescueTeam = await RescueTeam.findOne({
        $or: [{ teamCode: query.toUpperCase() }, { email: query.toLowerCase() }],
      });

      if (rescueTeam) {
        user = await User.findOneAndUpdate(
          { email: rescueTeam.email },
          {
            $set: {
              name: rescueTeam.leaderName || rescueTeam.teamName,
              email: rescueTeam.email,
              role: 'rescue_worker',
              organization: rescueTeam.organization,
              specialization: rescueTeam.specialization,
              teamCode: rescueTeam.teamCode,
              rescueTeamId: rescueTeam._id,
              location: rescueTeam.location,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    } else if (user.role === 'rescue_worker' || user.rescueTeamId) {
      rescueTeam = await RescueTeam.findById(user.rescueTeamId) ||
        await RescueTeam.findOne({ $or: [{ email: user.email }, { teamCode: user.teamCode }] });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please verify your credentials or register.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}`,
      user,
      rescueTeam,
    });
  } catch (error) {
    next(error);
  }
};
