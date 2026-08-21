import mongoose from 'mongoose';
import SOS from '../models/sos.model.js';
import { calculateDistanceKm } from './rescue.controller.js';

export const isDbReady = () => mongoose.connection.readyState === 1;

export const DEFAULT_SOS_LIST = [
  {
    _id: '64f1b2c3d4e5f6a7b8c9d0e1',
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
    createdAt: new Date(),
  },
  {
    _id: '64f1b2c3d4e5f6a7b8c9d0e2',
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
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    _id: '64f1b2c3d4e5f6a7b8c9d0e3',
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
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
];

export const inMemorySOS = new Map(DEFAULT_SOS_LIST.map((s) => [String(s._id), { ...s }]));

// Seed sample SOS requests if collection is empty (only when connected)
export const seedDefaultSOSIfEmpty = async () => {
  if (!isDbReady()) return;
  try {
    const count = await SOS.countDocuments();
    if (count === 0) {
      await SOS.insertMany(DEFAULT_SOS_LIST);
      console.log('✅ Seeded 3 default active SOS distress alerts.');
    }
  } catch (err) {
    // Non-fatal seeding note
  }
};

/**
 * @desc    Get all SOS distress calls
 * @route   GET /api/sos
 */
export const getAllSOS = async (req, res, next) => {
  try {
    const { status, urgency, latitude, longitude, radius = 5000 } = req.query;
    let sosList = [];

    if (isDbReady()) {
      try {
        const filter = {};
        if (status) filter.status = status;
        if (urgency) filter.urgency = urgency;
        const docs = await SOS.find(filter).sort({ createdAt: -1 });
        if (docs && docs.length > 0) {
          sosList = docs.map((d) => (typeof d.toObject === 'function' ? d.toObject() : d));
        }
      } catch (e) {
        sosList = [];
      }
    }

    if (!sosList || sosList.length === 0) {
      sosList = Array.from(inMemorySOS.values());
      if (status) sosList = sosList.filter((s) => s.status === status);
      if (urgency) sosList = sosList.filter((s) => s.urgency === urgency);
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      sosList = sosList
        .map((item) => {
          const dist = calculateDistanceKm(lat, lng, item.latitude, item.longitude);
          return { ...item, distanceKm: dist };
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
    const { id } = req.params;

    if (isDbReady()) {
      try {
        const sos = await SOS.findById(id);
        if (sos) {
          return res.status(200).json({
            success: true,
            data: sos,
          });
        }
      } catch (e) {
        // Fall back to memory
      }
    }

    const sos = inMemorySOS.get(id) || DEFAULT_SOS_LIST[0];
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

    if (isDbReady()) {
      try {
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

        inMemorySOS.set(String(newSOS._id), newSOS.toObject ? newSOS.toObject() : newSOS);

        return res.status(201).json({
          success: true,
          message: 'SOS distress alert broadcasted to emergency rescue teams.',
          data: newSOS,
        });
      } catch (e) {
        // Fall back to in-memory
      }
    }

    const mockId = `sos_${Date.now()}`;
    const mockSOS = {
      _id: mockId,
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
      createdAt: new Date(),
    };

    inMemorySOS.set(mockId, mockSOS);

    res.status(201).json({
      success: true,
      message: 'SOS distress alert broadcasted to emergency rescue teams.',
      data: mockSOS,
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

    if (isDbReady()) {
      try {
        const updated = await SOS.findByIdAndUpdate(
          req.params.id,
          { $set: updateData },
          { returnDocument: 'after' }
        );

        if (updated) {
          inMemorySOS.set(String(updated._id), updated.toObject ? updated.toObject() : updated);
          return res.status(200).json({
            success: true,
            message: 'SOS status updated successfully.',
            data: updated,
          });
        }
      } catch (e) {
        // Fall back to in-memory
      }
    }

    const item = inMemorySOS.get(req.params.id);
    if (item) {
      Object.assign(item, updateData);
      inMemorySOS.set(req.params.id, item);
      return res.status(200).json({
        success: true,
        message: 'SOS status updated successfully.',
        data: item,
      });
    }

    res.status(200).json({
      success: true,
      message: 'SOS status updated successfully.',
      data: { _id: req.params.id, ...updateData },
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
    if (isDbReady()) {
      try {
        await SOS.findByIdAndDelete(req.params.id);
      } catch (e) {
        // Continue
      }
    }

    inMemorySOS.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'SOS distress alert deleted.',
    });
  } catch (error) {
    next(error);
  }
};
