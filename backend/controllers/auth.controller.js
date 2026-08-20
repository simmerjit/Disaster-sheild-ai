import mongoose from 'mongoose';
import User from '../models/user.model.js';
import RescueTeam from '../models/rescueTeam.model.js';

// In-memory fallback store for offline/local resilience
const inMemoryUsers = new Map();
const inMemoryTeams = new Map([
  [
    'NDRF-ALPHA-08',
    {
      _id: 'team_ndrf_08',
      teamName: 'NDRF 8th Bn - Alpha SAR Taskforce',
      teamCode: 'NDRF-ALPHA-08',
      email: 'ndrf.alpha8@gov.in',
      organization: 'National Disaster Response Force (NDRF)',
      specialization: 'urban_search_rescue',
      leaderName: 'Commander Vikram Singh',
      contactPhone: '+91 1078',
      location: { latitude: 28.6139, longitude: 77.209, address: 'Command Post Alpha, New Delhi' },
      status: 'available',
      stats: { missionsCompleted: 14, peopleRescued: 82, casualtiesTreated: 19 },
    },
  ],
  [
    'SDRF-FLOOD-02',
    {
      _id: 'team_sdrf_02',
      teamName: 'SDRF Coastal & Marine Flood Rescue',
      teamCode: 'SDRF-FLOOD-02',
      email: 'sdrf.coastal@kerala.gov.in',
      organization: 'State Disaster Response Force (SDRF)',
      specialization: 'flood_water',
      leaderName: 'Inspector Ananya Nair',
      contactPhone: '+91 1070',
      location: { latitude: 9.9312, longitude: 76.2673, address: 'Marine Command Post, Kochi' },
      status: 'available',
      stats: { missionsCompleted: 9, peopleRescued: 143, casualtiesTreated: 8 },
    },
  ],
  [
    'MED-EVAC-01',
    {
      _id: 'team_med_01',
      teamName: 'Rapid Medical Evac & Trauma Response',
      teamCode: 'MED-EVAC-01',
      email: 'med.sar.delhi@emergency.org',
      organization: 'Disaster Health Response Network',
      specialization: 'medical_evac',
      leaderName: 'Dr. Rohan Mehra',
      contactPhone: '+91 108',
      location: { latitude: 28.5672, longitude: 77.21, address: 'Trauma Operations Post, AIIMS Delhi' },
      status: 'available',
      stats: { missionsCompleted: 22, peopleRescued: 95, casualtiesTreated: 95 },
    },
  ],
  [
    'NDRF-CYCLONE-03',
    {
      _id: 'team_cyclone_03',
      teamName: 'Eastern Cyclone & Storm Strike Unit',
      teamCode: 'NDRF-CYCLONE-03',
      email: 'cyclone.strike@ndrf.gov.in',
      organization: 'National Disaster Response Force (NDRF)',
      specialization: 'cyclone_storm',
      leaderName: 'Assistant Commander Rajesh Patel',
      contactPhone: '+91 1077',
      location: { latitude: 20.2961, longitude: 85.8245, address: 'Cyclone Command Station, Bhubaneswar' },
      status: 'available',
      stats: { missionsCompleted: 11, peopleRescued: 68, casualtiesTreated: 12 },
    },
  ],
]);

const isDbReady = () => mongoose.connection.readyState === 1;

/**
 * @desc    Get or sync current user profile (for Clerk integration)
 * @route   GET /api/auth/me
 * @access  Public / Clerk Auth
 */
export const getMe = async (req, res, next) => {
  try {
    const clerkId = req.headers['x-clerk-user-id'] || req.query.clerkId;
    const email = req.query.email;

    if (isDbReady()) {
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

      return res.status(200).json({ success: true, user, rescueTeam });
    }

    // In-memory fallback
    const key = clerkId || email?.toLowerCase();
    let user = inMemoryUsers.get(key) || {
      _id: `mem_user_${Date.now()}`,
      clerkId: clerkId || `user_${Date.now()}`,
      email: email || 'rescuer@emergency.gov.in',
      name: req.query.name || 'Officer On Duty',
      role: req.query.role || 'rescue_worker',
    };

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
    const code = (teamCode || `SAR-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();

    if (isDbReady()) {
      let rescueTeam = null;
      if (role === 'rescue_worker') {
        rescueTeam = await RescueTeam.findOneAndUpdate(
          { $or: [{ email: email.toLowerCase() }, { teamCode: code }] },
          {
            $set: {
              teamName: organization || `${name}'s Rescue Unit`,
              teamCode: code,
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
            teamCode: rescueTeam?.teamCode || code,
            rescueTeamId: rescueTeam?._id || null,
            ...(phoneNumber && { phoneNumber }),
            ...(location && { location }),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(200).json({
        success: true,
        user,
        rescueTeam,
      });
    }

    // In-memory fallback
    const mockTeam =
      role === 'rescue_worker'
        ? {
            _id: `mem_team_${Date.now()}`,
            teamName: organization || `${name}'s Rescue Unit`,
            teamCode: code,
            organization: organization || 'National Disaster Response Force (NDRF)',
            specialization: specialization || 'general_sar',
            leaderName: name,
            contactPhone: phoneNumber || '+91 1078',
            email: email.toLowerCase(),
            location: {
              latitude: location?.latitude || 28.6139,
              longitude: location?.longitude || 77.209,
              address: location?.address || 'Field Command Post',
            },
            status: 'available',
            stats: { missionsCompleted: 0, peopleRescued: 0, casualtiesTreated: 0 },
          }
        : null;

    if (mockTeam) {
      inMemoryTeams.set(code, mockTeam);
    }

    const mockUser = {
      _id: `mem_user_${Date.now()}`,
      clerkId: cId,
      email: email.toLowerCase(),
      name: name || 'User',
      avatar: avatar || '',
      role,
      organization: organization || (role === 'rescue_worker' ? 'Rescue Services' : 'General Public'),
      specialization: specialization || 'general_sar',
      teamCode: code,
      rescueTeamId: mockTeam?._id || null,
      phoneNumber: phoneNumber || '',
      location: location || { latitude: 28.6139, longitude: 77.209, address: 'Field Base' },
    };

    inMemoryUsers.set(cId, mockUser);
    inMemoryUsers.set(email.toLowerCase(), mockUser);
    inMemoryUsers.set(code, mockUser);

    res.status(200).json({
      success: true,
      user: mockUser,
      rescueTeam: mockTeam,
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
        rescueTeam =
          (await RescueTeam.findById(user.rescueTeamId)) ||
          (await RescueTeam.findOne({ $or: [{ email: user.email }, { teamCode: user.teamCode }] }));
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Account not found. Please verify your credentials or register.',
        });
      }

      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}`,
        user,
        rescueTeam,
      });
    }

    // In-memory fallback check
    const queryUpper = query.toUpperCase();
    const queryLower = query.toLowerCase();

    let team = inMemoryTeams.get(queryUpper) || inMemoryTeams.get(queryLower);
    let user = inMemoryUsers.get(queryLower) || inMemoryUsers.get(queryUpper) || inMemoryUsers.get(query);

    if (!user && team) {
      user = {
        _id: `mem_user_${team._id}`,
        name: team.leaderName || team.teamName,
        email: team.email,
        role: 'rescue_worker',
        organization: team.organization,
        specialization: team.specialization,
        teamCode: team.teamCode,
        rescueTeamId: team._id,
        location: team.location,
      };
      inMemoryUsers.set(team.email, user);
      inMemoryUsers.set(team.teamCode, user);
    }

    // If query matches standard preset codes
    if (!user && (queryUpper.startsWith('NDRF-') || queryUpper.startsWith('SDRF-') || queryUpper.startsWith('MED-') || queryUpper.startsWith('SAR-'))) {
      user = {
        _id: `mem_user_${queryUpper}`,
        name: `Officer in Charge (${queryUpper})`,
        email: `${queryLower}@emergency.gov.in`,
        role: 'rescue_worker',
        organization: 'National Disaster Response Force (NDRF)',
        specialization: 'urban_search_rescue',
        teamCode: queryUpper,
        location: { latitude: 28.6139, longitude: 77.209, address: 'Command Post' },
      };
      team = {
        _id: `mem_team_${queryUpper}`,
        teamName: `${queryUpper} Tactical Taskforce`,
        teamCode: queryUpper,
        organization: 'National Disaster Response Force (NDRF)',
        specialization: 'urban_search_rescue',
        leaderName: user.name,
        email: user.email,
        location: user.location,
        status: 'available',
        stats: { missionsCompleted: 8, peopleRescued: 45, casualtiesTreated: 12 },
      };
      inMemoryTeams.set(queryUpper, team);
      inMemoryUsers.set(queryUpper, user);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please verify your credentials or register a new unit.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}`,
      user,
      rescueTeam: team || null,
    });
  } catch (error) {
    next(error);
  }
};
