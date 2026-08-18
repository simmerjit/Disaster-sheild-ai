import SOS from '../models/sos.model.js';
import { calculateDistanceKm } from './rescue.controller.js';

// Seed sample SOS requests if collection is empty
const seedDefaultSOSIfEmpty = async () => {
  try {
    const count = await SOS.countDocuments();
    if (count === 0) {
      const defaultSOS = [
        {
          message: 'URGENT: Family of 5 stranded on rooftop due to sudden flash flood inundation. Water level rising fast!',
          senderName: 'Rajesh Mukherjee',
          senderPhone: '+91 98310 99881',
          latitude: 26.1445,
          longitude: 91.7362,
          address: 'Brahmaputra Riverside Sector 4, Guwahati, Assam',
          peopleTrapped: 5,
          urgency: 'critical',
          emergencyType: 'flood_trapped',
          status: 'pending',
        },
        {
          message: 'Senior citizens trapped inside 2nd floor apartment with blocked stairwell after tremor.',
          senderName: 'Anita Menon',
          senderPhone: '+91 94460 12345',
          latitude: 28.7041,
          longitude: 77.1025,
          address: 'Block C, Rohini Sector 9, Delhi',
          peopleTrapped: 3,
          urgency: 'high',
          emergencyType: 'building_collapse',
          status: 'pending',
        },
        {
          message: 'Fishing vessel lost engine power in rough seas, 8 fishermen aboard taking on water.',
          senderName: 'Coastal Guard Relay - S. Kumar',
          senderPhone: '+91 98840 55667',
          latitude: 13.0827,
          longitude: 80.2707,
          address: '12 Nautical Miles Off Marina Beach, Chennai',
          peopleTrapped: 8,
          urgency: 'critical',
          emergencyType: 'flood_trapped',
          status: 'pending',
        },
      ];
      await SOS.insertMany(defaultSOS);
      console.log('✅ Seeded 3 default active SOS distress alerts.');
    }
  } catch (err) {
    console.warn('⚠️ SOS seeding note:', err.message);
  }
};

seedDefaultSOSIfEmpty();

/**
 * @desc    Get all SOS distress calls
 * @route   GET /api/sos
 */
export const getAllSOS = async (req, res, next) => {
  try {
    const { status, urgency, latitude, longitude, radius = 5000 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;

    let sosList = await SOS.find(filter).sort({ createdAt: -1 });

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      sosList = sosList
        .map((item) => {
          const dist = calculateDistanceKm(lat, lng, item.latitude, item.longitude);
          return { ...item.toObject(), distanceKm: dist };
        })
        .filter((item) => item.distanceKm <= parseFloat(radius))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.status(200).json({
      success: true,
      count: sosList.length,
      data: sosList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single SOS distress by ID
 * @route   GET /api/sos/:id
 */
export const getSOSById = async (req, res, next) => {
  try {
    const sos = await SOS.findById(req.params.id);
    if (!sos) {
      return res.status(404).json({
        success: false,
        message: 'SOS distress alert not found.',
      });
    }
    res.status(200).json({
      success: true,
      data: sos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new SOS distress signal
 * @route   POST /api/sos
 */
export const createSOS = async (req, res, next) => {
  try {
    const {
      message,
      senderName,
      senderPhone,
      latitude,
      longitude,
      address,
      peopleTrapped,
      urgency,
      emergencyType,
      disasterId,
    } = req.body;

    if (!message || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'Message, latitude, and longitude are required to dispatch SOS.',
      });
    }

    const newSOS = await SOS.create({
      message,
      senderName: senderName || 'Citizen in Danger',
      senderPhone: senderPhone || 'Unknown',
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address || 'Distress Coordinates',
      peopleTrapped: peopleTrapped || 1,
      urgency: urgency || 'critical',
      emergencyType: emergencyType || 'general_distress',
      status: 'pending',
      disasterId: disasterId || null,
    });

    res.status(201).json({
      success: true,
      message: 'SOS distress alert broadcasted to emergency rescue teams.',
      data: newSOS,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update SOS status or assign rescue team
 * @route   PUT /api/sos/:id
 */
export const updateSOS = async (req, res, next) => {
  try {
    const { status, assignedTeam, assignedTeamName } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (assignedTeam) updateData.assignedTeam = assignedTeam;
    if (assignedTeamName) updateData.assignedTeamName = assignedTeamName;

    const updated = await SOS.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'SOS distress alert not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'SOS status updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or archive SOS
 * @route   DELETE /api/sos/:id
 */
export const deleteSOS = async (req, res, next) => {
  try {
    const deleted = await SOS.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'SOS distress alert not found.',
      });
    }
    res.status(200).json({
      success: true,
      message: 'SOS distress alert deleted.',
    });
  } catch (error) {
    next(error);
  }
};
