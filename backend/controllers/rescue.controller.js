import RescueTeam from '../models/rescueTeam.model.js';
import RescueOperation from '../models/rescueOperation.model.js';
import SOS from '../models/sos.model.js';
import Disaster from '../models/disaster.model.js';
import { disasterFeedCache } from '../utils/cache.js';

// Haversine distance calculator in kilometers
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Seed default rescue teams if collection is empty
const seedDefaultTeamsIfEmpty = async () => {
  try {
    const count = await RescueTeam.countDocuments();
    if (count === 0) {
      const defaultTeams = [
        {
          teamName: 'NDRF 8th Bn - Alpha SAR Taskforce',
          teamCode: 'NDRF-ALPHA-08',
          organization: 'National Disaster Response Force (NDRF)',
          specialization: 'urban_search_rescue',
          leaderName: 'Cmdr. Rajesh Verma',
          contactPhone: '+91 98110 12345',
          email: 'ndrf.alpha8@gov.in',
          password: 'rescue123password',
          capacityMembers: 24,
          equipment: ['Canine SAR Units', 'Acoustic Life Detectors', 'Hydraulic Spreaders', 'Thermal Cameras', 'Inflatable Boats'],
          status: 'available',
          location: {
            latitude: 28.6139,
            longitude: 77.209,
            address: 'NDRF HQ, New Delhi',
            lastUpdated: new Date(),
          },
          stats: { missionsCompleted: 18, peopleRescued: 142, casualtiesTreated: 87 },
        },
        {
          teamName: 'SDRF Coastal & Marine Flood Rescue',
          teamCode: 'SDRF-FLOOD-02',
          organization: 'State Disaster Response Force (SDRF)',
          specialization: 'flood_water',
          leaderName: 'Capt. Arun Nambiar',
          contactPhone: '+91 94470 54321',
          email: 'sdrf.coastal@kerala.gov.in',
          password: 'rescue123password',
          capacityMembers: 16,
          equipment: ['Gemini Inflatable Boats', 'Diver Outfits', 'Flood Sonar', 'Life Jackets x 100', 'Medical Kits'],
          status: 'available',
          location: {
            latitude: 9.9312,
            longitude: 76.2673,
            address: 'Kochi Port Marine SAR Station, Kerala',
            lastUpdated: new Date(),
          },
          stats: { missionsCompleted: 27, peopleRescued: 310, casualtiesTreated: 114 },
        },
        {
          teamName: 'Rapid Medical Evac & Trauma Response',
          teamCode: 'MED-EVAC-01',
          organization: 'Disaster Health Response Network',
          specialization: 'medical_evac',
          leaderName: 'Dr. Priya Sharma (Chief Medical Officer)',
          contactPhone: '+91 98200 99881',
          email: 'med.sar.delhi@emergency.org',
          password: 'rescue123password',
          capacityMembers: 10,
          equipment: ['Mobile ICU Ambulance', 'Portable Ventilators', 'Blood Supply Units', 'Trauma Surgical Kits'],
          status: 'available',
          location: {
            latitude: 19.076,
            longitude: 72.8777,
            address: 'Mumbai Central Disaster Relief Command',
            lastUpdated: new Date(),
          },
          stats: { missionsCompleted: 14, peopleRescued: 89, casualtiesTreated: 195 },
        },
        {
          teamName: 'Eastern Cyclone & Storm Strike Unit',
          teamCode: 'NDRF-CYCLONE-03',
          organization: 'National Disaster Response Force (NDRF)',
          specialization: 'cyclone_storm',
          leaderName: 'Maj. S. Patra',
          contactPhone: '+91 97760 11223',
          email: 'cyclone.strike@ndrf.gov.in',
          password: 'rescue123password',
          capacityMembers: 20,
          equipment: ['Tree Cutters', 'Heavy Dewatering Pumps', 'High-Clearance Rescue Trucks', 'Satellite Comms'],
          status: 'available',
          location: {
            latitude: 20.2961,
            longitude: 85.8245,
            address: 'Bhubaneswar Disaster Logistics Center, Odisha',
            lastUpdated: new Date(),
          },
          stats: { missionsCompleted: 31, peopleRescued: 420, casualtiesTreated: 160 },
        },
      ];
      await RescueTeam.insertMany(defaultTeams);
      console.log('✅ Seeded 4 default Rescue Teams into MongoDB.');
    }
  } catch (err) {
    console.warn('⚠️ Rescue team seeding note:', err.message);
  }
};

// Execute seeding check on startup
seedDefaultTeamsIfEmpty();

/**
 * @desc    Rescue team login (by team code, email, or fast preset)
 * @route   POST /api/rescue/login
 */
export const loginRescueTeam = async (req, res, next) => {
  try {
    const { teamCode, email, password } = req.body;

    let team;
    if (teamCode) {
      team = await RescueTeam.findOne({ teamCode: teamCode.trim().toUpperCase() });
    } else if (email) {
      team = await RescueTeam.findOne({ email: email.trim().toLowerCase() });
    }

    // If not found by exact match, return first available or create demo team
    if (!team) {
      const allTeams = await RescueTeam.find().limit(1);
      if (allTeams.length > 0) {
        team = allTeams[0];
      } else {
        await seedDefaultTeamsIfEmpty();
        team = await RescueTeam.findOne();
      }
    }

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'No rescue team profile found. Please register or select a standard unit.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Welcome back, ${team.teamName}`,
      team,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new Rescue Team
 * @route   POST /api/rescue/register
 */
export const registerRescueTeam = async (req, res, next) => {
  try {
    const {
      teamName,
      teamCode,
      organization,
      specialization,
      leaderName,
      contactPhone,
      email,
      capacityMembers,
      equipment,
      location,
    } = req.body;

    if (!teamName) {
      return res.status(400).json({
        success: false,
        message: 'Team Name is required.',
      });
    }

    const code = teamCode || `SAR-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTeam = await RescueTeam.create({
      teamName,
      teamCode: code.toUpperCase(),
      organization: organization || 'Emergency Response Authority',
      specialization: specialization || 'general_sar',
      leaderName: leaderName || 'Unit Officer',
      contactPhone: contactPhone || '+91 1078',
      email: email || `team-${Date.now()}@emergency.org`,
      capacityMembers: capacityMembers || 10,
      equipment: equipment || ['Standard Search & Rescue Pack'],
      location: {
        latitude: location?.latitude || 28.6139,
        longitude: location?.longitude || 77.209,
        address: location?.address || 'Field Headquarters',
        lastUpdated: new Date(),
      },
      status: 'available',
    });

    res.status(201).json({
      success: true,
      message: 'Rescue Team registered successfully.',
      team: newTeam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered rescue teams
 * @route   GET /api/rescue/teams
 */
export const getAllRescueTeams = async (req, res, next) => {
  try {
    const teams = await RescueTeam.find().sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single rescue team profile by ID
 * @route   GET /api/rescue/teams/:id
 */
export const getRescueTeamById = async (req, res, next) => {
  try {
    const team = await RescueTeam.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Rescue team not found.',
      });
    }
    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update team operational status and live GPS location
 * @route   PUT /api/rescue/teams/:id/status
 */
export const updateRescueTeamStatus = async (req, res, next) => {
  try {
    const { status, location, currentMission } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (location) {
      updateData['location.latitude'] = Number(location.latitude);
      updateData['location.longitude'] = Number(location.longitude);
      if (location.address) updateData['location.address'] = location.address;
      updateData['location.lastUpdated'] = new Date();
    }
    if (currentMission !== undefined) {
      updateData.currentMission = currentMission;
    }

    const team = await RescueTeam.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Rescue team not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rescue team status updated.',
      team,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Intelligent Location-Based Priority Rescue Dispatch Engine
 * @route   GET /api/rescue/prioritize
 * @params  latitude, longitude, specialization, teamId, radius
 */
export const getPrioritizedRescues = async (req, res, next) => {
  try {
    const lat = req.query.latitude != null ? parseFloat(req.query.latitude) : 28.6139;
    const lng = req.query.longitude != null ? parseFloat(req.query.longitude) : 77.209;
    const specialization = req.query.specialization || 'general_sar';
    const maxRadius = req.query.radius ? parseFloat(req.query.radius) : 5000; // default 5000km

    // 1. Fetch live disaster feed from cache or database fallback
    let disasters = disasterFeedCache.get('all_disasters_all') || [];
    if (!disasters.length) {
      const keys = disasterFeedCache.keys();
      for (const k of keys) {
        const val = disasterFeedCache.get(k);
        if (Array.isArray(val) && val.length > 0) {
          disasters = val;
          break;
        }
      }
    }
    if (!disasters.length) {
      const dbDisasters = await Disaster.find().limit(50);
      disasters = dbDisasters.map((d) => ({
        id: `DB_${d._id}`,
        title: d.title,
        type: d.type,
        description: d.description,
        severity: d.severity,
        magnitude: d.magnitude || null,
        latitude: d.latitude,
        longitude: d.longitude,
        location: d.location || d.country || '',
        country: d.country || '',
        status: d.status || 'active',
        source: d.source || 'DB',
      }));
    }

    // 2. Fetch active Rescue Operations from DB
    const activeOps = await RescueOperation.find({ status: { $in: ['active', 'planned', 'paused'] } });

    // 3. Fetch active citizen SOS distress calls
    const activeSOS = await SOS.find({ status: { $in: ['pending', 'dispatched'] } });

    // Build unified mission target list
    const missionTargets = [];

    // Process SOS calls as high-urgency rescue targets
    for (const sos of activeSOS) {
      const dist = calculateDistanceKm(lat, lng, sos.latitude, sos.longitude);
      if (dist !== null && dist <= maxRadius) {
        // Priority calculation for SOS
        let priorityScore = 50; // base score for direct human distress
        const scoreBreakdown = [];

        // People trapped factor
        const people = sos.peopleTrapped || 1;
        const peopleBonus = Math.min(people * 6, 25);
        priorityScore += peopleBonus;
        scoreBreakdown.push(`+${peopleBonus} pts: ${people} civilian(s) trapped`);

        // Proximity bonus
        if (dist <= 15) {
          priorityScore += 25;
          scoreBreakdown.push('+25 pts: Immediate Proximity (<15km)');
        } else if (dist <= 50) {
          priorityScore += 18;
          scoreBreakdown.push('+18 pts: Local Proximity (15-50km)');
        } else if (dist <= 150) {
          priorityScore += 10;
          scoreBreakdown.push('+10 pts: Regional Reach (50-150km)');
        }

        // Urgency factor
        if (sos.urgency === 'critical') {
          priorityScore += 20;
          scoreBreakdown.push('+20 pts: Life-Threatening Urgency');
        } else if (sos.urgency === 'high') {
          priorityScore += 12;
          scoreBreakdown.push('+12 pts: High Urgency');
        }

        // Status penalty if already dispatched
        if (sos.status === 'dispatched') {
          priorityScore -= 10;
          scoreBreakdown.push('-10 pts: Team already en route');
        }

        const normalizedScore = Math.min(Math.max(priorityScore, 10), 100);

        let priorityTier = 'MEDIUM';
        let actionRecommendation = 'Deploy standby rescue responder';
        if (normalizedScore >= 80) {
          priorityTier = 'CRITICAL';
          actionRecommendation = 'IMMEDIATE EXTRACTION REQUIRED';
        } else if (normalizedScore >= 60) {
          priorityTier = 'HIGH';
          actionRecommendation = 'Dispatch primary rescue unit';
        } else if (normalizedScore < 40) {
          priorityTier = 'LOW';
          actionRecommendation = 'Monitor distress status';
        }

        missionTargets.push({
          targetId: `sos_${sos._id}`,
          type: 'sos_distress',
          title: `SOS DISTRESS: ${sos.senderName || 'Citizen in Danger'}`,
          description: sos.message,
          latitude: sos.latitude,
          longitude: sos.longitude,
          address: sos.address || 'Distress coordinates',
          distanceKm: dist,
          priorityScore: normalizedScore,
          priorityTier,
          actionRecommendation,
          scoreBreakdown,
          status: sos.status,
          urgency: sos.urgency,
          peopleAtRisk: sos.peopleTrapped || 1,
          emergencyType: sos.emergencyType,
          contactPhone: sos.senderPhone,
          assignedTeam: sos.assignedTeamName || null,
          sosId: sos._id,
          createdAt: sos.createdAt,
        });
      }
    }

    // Process Disasters & Rescue Operations
    for (const d of disasters) {
      const dLat = Number(d.latitude);
      const dLng = Number(d.longitude);
      if (isNaN(dLat) || isNaN(dLng)) continue;

      const dist = calculateDistanceKm(lat, lng, dLat, dLng);
      if (dist === null || dist > maxRadius) continue;

      let priorityScore = 20; // base score
      const scoreBreakdown = [];

      // 1. Severity weight
      const sev = (d.severity || '').toLowerCase();
      const alertLevel = (d.alertLevel || '').toLowerCase();
      if (sev === 'critical' || alertLevel === 'red' || (d.magnitude && d.magnitude >= 6.5)) {
        priorityScore += 35;
        scoreBreakdown.push('+35 pts: GDACS/USGS Red Alert / Critical Magnitude');
      } else if (sev === 'high' || alertLevel === 'orange' || (d.magnitude && d.magnitude >= 5.0)) {
        priorityScore += 24;
        scoreBreakdown.push('+24 pts: High Threat Alert / Severe Disaster');
      } else if (sev === 'medium' || alertLevel === 'yellow') {
        priorityScore += 12;
        scoreBreakdown.push('+12 pts: Moderate Threat Level');
      }

      // 2. Proximity weight
      if (dist <= 25) {
        priorityScore += 30;
        scoreBreakdown.push(`+30 pts: Critical Proximity (${dist} km away)`);
      } else if (dist <= 75) {
        priorityScore += 22;
        scoreBreakdown.push(`+22 pts: Near Field Reach (${dist} km away)`);
      } else if (dist <= 200) {
        priorityScore += 14;
        scoreBreakdown.push(`+14 pts: Regional Vicinity (${dist} km away)`);
      } else if (dist <= 600) {
        priorityScore += 6;
        scoreBreakdown.push(`+6 pts: Extended Sector (${dist} km away)`);
      }

      // 3. Specialization match bonus
      const dType = (d.type || '').toLowerCase();
      if (
        (specialization === 'flood_water' && (dType.includes('flood') || dType.includes('cyclone') || dType.includes('storm') || dType.includes('tsunami'))) ||
        (specialization === 'urban_search_rescue' && (dType.includes('earthquake') || dType.includes('collapse') || dType.includes('landslide'))) ||
        (specialization === 'fire_hazmat' && (dType.includes('fire') || dType.includes('hazmat') || dType.includes('chemical') || dType.includes('volcano'))) ||
        (specialization === 'cyclone_storm' && (dType.includes('cyclone') || dType.includes('hurricane') || dType.includes('typhoon') || dType.includes('storm'))) ||
        (specialization === 'medical_evac' && (d.casualties || d.injured || d.alertLevel === 'red'))
      ) {
        priorityScore += 18;
        scoreBreakdown.push(`+18 pts: Specialization Synergy Match (${specialization.replace(/_/g, ' ').toUpperCase()})`);
      }

      // 4. Check if active rescue operation exists
      const relatedOp = activeOps.find((op) => op.disasterId === (d.id || d._id));
      if (relatedOp) {
        if (relatedOp.priority === 'critical') {
          priorityScore += 10;
          scoreBreakdown.push('+10 pts: Active Multi-Agency Critical Deployment');
        }
        if (relatedOp.peopleMissing > 0) {
          priorityScore += 8;
          scoreBreakdown.push(`+8 pts: ${relatedOp.peopleMissing} reported missing persons`);
        }
      }

      const normalizedScore = Math.min(Math.max(priorityScore, 10), 100);

      let priorityTier = 'MEDIUM';
      let actionRecommendation = 'Maintain local monitoring & readiness';
      if (normalizedScore >= 80) {
        priorityTier = 'CRITICAL';
        actionRecommendation = 'IMMEDIATE RESCUE TASKFORCE DISPATCH';
      } else if (normalizedScore >= 60) {
        priorityTier = 'HIGH';
        actionRecommendation = 'Mobilize advance SAR response team';
      } else if (normalizedScore < 40) {
        priorityTier = 'LOW';
        actionRecommendation = 'Routine sector standby & staging';
      }

      missionTargets.push({
        targetId: `disaster_${d.id || d._id}`,
        type: 'disaster_zone',
        title: d.title || `${d.type?.toUpperCase()} Incident`,
        description: d.description || 'Active disaster incident requiring emergency support and evacuation.',
        disasterType: d.type,
        severity: d.severity,
        alertLevel: d.alertLevel,
        latitude: dLat,
        longitude: dLng,
        address: d.location || d.country || 'Coordinates On Map',
        distanceKm: dist,
        priorityScore: normalizedScore,
        priorityTier,
        actionRecommendation,
        scoreBreakdown,
        status: d.status || 'ongoing',
        source: d.source,
        activeOperation: relatedOp || null,
        disaster: d,
      });
    }

    // Sort by priorityScore descending, then distance ascending
    missionTargets.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    res.status(200).json({
      success: true,
      teamCoordinates: { latitude: lat, longitude: lng },
      specialization,
      totalMissions: missionTargets.length,
      criticalCount: missionTargets.filter((m) => m.priorityTier === 'CRITICAL').length,
      highCount: missionTargets.filter((m) => m.priorityTier === 'HIGH').length,
      data: missionTargets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Action: Accept mission or update telemetry (e.g. rescued people count)
 * @route   POST /api/rescue/mission/action
 */
export const handleMissionAction = async (req, res, next) => {
  try {
    const { teamId, targetId, action, rescuedCount, injuredCount, notes } = req.body;

    if (!teamId || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'teamId and targetId are required.',
      });
    }

    const team = await RescueTeam.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Rescue team not found.',
      });
    }

    if (action === 'accept_mission') {
      team.status = 'en_route';
      team.currentMission = {
        disasterId: targetId,
        title: req.body.title || 'Active Rescue Mission',
        startedAt: new Date(),
        destination: {
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          address: req.body.address,
        },
      };
      await team.save();

      // If it is an SOS target, update SOS status
      if (targetId.startsWith('sos_')) {
        const sosId = targetId.replace('sos_', '');
        await SOS.findByIdAndUpdate(sosId, {
          status: 'dispatched',
          assignedTeam: team._id,
          assignedTeamName: team.teamName,
        });
      }
    } else if (action === 'on_scene') {
      team.status = 'on_scene';
      await team.save();
    } else if (action === 'complete_mission') {
      team.status = 'available';
      team.currentMission = null;
      team.stats.missionsCompleted = (team.stats.missionsCompleted || 0) + 1;
      if (rescuedCount) {
        team.stats.peopleRescued = (team.stats.peopleRescued || 0) + Number(rescuedCount);
      }
      if (injuredCount) {
        team.stats.casualtiesTreated = (team.stats.casualtiesTreated || 0) + Number(injuredCount);
      }
      await team.save();

      // If it is an SOS target, mark resolved
      if (targetId.startsWith('sos_')) {
        const sosId = targetId.replace('sos_', '');
        await SOS.findByIdAndUpdate(sosId, {
          status: 'resolved',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Mission action '${action}' recorded successfully.`,
      team,
    });
  } catch (error) {
    next(error);
  }
};
