import Shelter from '../models/shelter.model.js';

/**
 * Calculates Haversine distance in kilometers between two coordinates
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
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
  return R * c;
};

/**
 * @desc    Get all shelters
 * @route   GET /api/shelters
 * @access  Public
 */
export const getAllShelters = async (req, res, next) => {
  try {
    const shelters = await Shelter.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: shelters.length,
      data: shelters,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get nearby verified shelters
 * @route   GET /api/shelters/nearby
 * @access  Public
 * Query params: latitude, longitude, radius (km, default: 50)
 */
export const getNearbyShelters = async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (latitude === undefined || longitude === undefined || latitude === '' || longitude === '') {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude query parameters are required.',
      });
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    const maxRadiusKm = radius ? Number(radius) : 50;

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided.',
      });
    }

    const allShelters = await Shelter.find();

    const sheltersWithDistance = allShelters
      .filter((s) => s.latitude !== null && s.longitude !== null && !isNaN(s.latitude) && !isNaN(s.longitude))
      .map((s) => {
        const distanceKm = calculateDistanceKm(latNum, lngNum, Number(s.latitude), Number(s.longitude));
        return {
          id: s._id,
          name: s.name,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          capacity: s.capacity,
          currentOccupancy: s.currentOccupancy || 0,
          contact: s.contact,
          distanceKm: Math.round(distanceKm * 10) / 10,
          verified: true,
          source: 'MONGODB_SHELTER_REGISTRY',
        };
      })
      .filter((s) => s.distanceKm <= maxRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json({
      success: true,
      center: { latitude: latNum, longitude: lngNum },
      radiusKm: maxRadiusKm,
      count: sheltersWithDistance.length,
      data: sheltersWithDistance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get shelter by ID
 * @route   GET /api/shelters/:id
 * @access  Public
 */
export const getShelterById = async (req, res, next) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: shelter,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new shelter
 * @route   POST /api/shelters
 * @access  Public (Admin in production)
 */
export const createShelter = async (req, res, next) => {
  try {
    const { name, address, latitude, longitude, capacity, currentOccupancy, contact } = req.body;

    if (!name || !address || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'name, address, and capacity are required.',
      });
    }

    const shelter = await Shelter.create({
      name,
      address,
      latitude: latitude !== undefined ? Number(latitude) : null,
      longitude: longitude !== undefined ? Number(longitude) : null,
      capacity: Number(capacity),
      currentOccupancy: currentOccupancy !== undefined ? Number(currentOccupancy) : 0,
      contact,
    });

    res.status(201).json({
      success: true,
      message: 'Shelter created successfully.',
      data: shelter,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a shelter
 * @route   PUT /api/shelters/:id
 * @access  Public (Admin in production)
 */
export const updateShelter = async (req, res, next) => {
  try {
    const shelter = await Shelter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Shelter updated successfully.',
      data: shelter,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a shelter
 * @route   DELETE /api/shelters/:id
 * @access  Public (Admin in production)
 */
export const deleteShelter = async (req, res, next) => {
  try {
    const shelter = await Shelter.findByIdAndDelete(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Shelter deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
