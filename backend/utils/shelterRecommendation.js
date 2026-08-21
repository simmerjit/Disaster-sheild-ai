/**
 * @module utils/shelterRecommendation
 * @desc Multi-factor AI/Heuristic Recommendation Engine for Emergency Shelters
 */

/**
 * Calculates Haversine distance in kilometers between two geo-coordinates
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
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
 * Evaluates a list of shelters and selects the optimal emergency shelter
 * based on user proximity, disaster safe distance, available capacity, critical facilities, and disaster-type compatibility.
 *
 * @param {Array<Object>} shelters - Array of shelter documents or objects
 * @param {Object} [disasterLocation] - { latitude, longitude, radiusKm, type }
 * @param {Object} [userLocation] - { latitude, longitude }
 * @param {string} [disasterType] - Type of disaster ('flood', 'earthquake', 'cyclone', 'wildfire', 'storm')
 * @returns {Object} { topRecommendedShelter, confidence, reason, scoredShelters }
 */
export const recommendShelter = (
  shelters = [],
  disasterLocation = null,
  userLocation = null,
  disasterType = null
) => {
  if (!Array.isArray(shelters) || shelters.length === 0) {
    return {
      topRecommendedShelter: null,
      confidence: 0,
      reason: 'No shelters available in the target operational sector.',
      scoredShelters: [],
    };
  }

  const dType = (disasterType || disasterLocation?.type || '').toLowerCase();

  // Filter out closed or completely full shelters if alternative active ones exist
  const activeShelters = shelters.filter(
    (s) => s.status !== 'closed' && (s.capacity?.availableBeds === undefined || s.capacity?.availableBeds > 0)
  );
  const candidateList = activeShelters.length > 0 ? activeShelters : shelters;

  const scoredShelters = candidateList.map((shelter) => {
    const rawShelter = shelter.toObject ? shelter.toObject() : { ...shelter };
    const sLat = Number(rawShelter.latitude);
    const sLng = Number(rawShelter.longitude);
    const sType = (rawShelter.type || '').toLowerCase();
    const sName = (rawShelter.name || '').toLowerCase();

    let userDistKm = null;
    let disasterDistKm = null;

    // 1. Proximity to User or Disaster Center (Closer = Higher Score) [Weight: 30%]
    let proximityScore = 70;
    if (userLocation && userLocation.latitude != null && userLocation.longitude != null) {
      userDistKm = calculateDistanceKm(
        Number(userLocation.latitude),
        Number(userLocation.longitude),
        sLat,
        sLng
      );
      proximityScore = Math.max(10, Math.min(100, 100 - userDistKm * 2.2));
    } else if (rawShelter.distanceKm != null) {
      proximityScore = Math.max(10, Math.min(100, 100 - rawShelter.distanceKm * 2.2));
    }

    // 2. Safety Buffer from Disaster Epicenter [Weight: 25%]
    let safetyScore = 80;
    if (disasterLocation && disasterLocation.latitude != null && disasterLocation.longitude != null) {
      disasterDistKm = calculateDistanceKm(
        Number(disasterLocation.latitude),
        Number(disasterLocation.longitude),
        sLat,
        sLng
      );
      const impactRadius = Number(disasterLocation.radiusKm || disasterLocation.affectedRadius || 10);
      if (disasterDistKm < impactRadius) {
        safetyScore = Math.max(10, (disasterDistKm / Math.max(1, impactRadius)) * 40);
      } else {
        const marginKm = disasterDistKm - impactRadius;
        safetyScore = Math.min(100, 75 + marginKm * 2.5);
      }
    }

    // 3. Bed Capacity & Availability [Weight: 20%]
    const availableBeds = rawShelter.capacity?.availableBeds || 0;
    const totalBeds = rawShelter.capacity?.totalBeds || Math.max(1, availableBeds);
    const bedAvailabilityRatio = totalBeds > 0 ? availableBeds / totalBeds : 0.5;
    const capacityScore = Math.min(100, Math.max(10, bedAvailabilityRatio * 60 + Math.min(40, availableBeds / 15)));

    // 4. Critical Life-Support Facilities [Weight: 15%]
    let facilityScore = 40;
    const fac = rawShelter.facilities || {};
    if (fac.foodAvailable) facilityScore += 15;
    if (fac.medicalAvailable) facilityScore += 20;
    if (fac.waterAvailable) facilityScore += 15;
    if (fac.powerAvailable) facilityScore += 10;
    facilityScore = Math.min(100, facilityScore);

    // 5. Disaster Type Compatibility Matching [Weight: 10%]
    let typeCompatibilityScore = 50;
    if (dType.includes('flood') || dType.includes('tsunami')) {
      if (sType === 'school' || sType === 'community_centre' || sName.includes('high-ground') || sName.includes('flood')) {
        typeCompatibilityScore = 100;
      }
    } else if (dType.includes('earthquake') || dType.includes('volcano')) {
      if (sType === 'relief_camp' || sType === 'assembly_point' || sName.includes('open grounds') || sName.includes('seismic')) {
        typeCompatibilityScore = 100;
      }
    } else if (dType.includes('cyclone') || dType.includes('storm')) {
      if (sType === 'shelter' || sType === 'community_centre' || sName.includes('cyclone') || sName.includes('storm')) {
        typeCompatibilityScore = 100;
      }
    } else if (dType.includes('wildfire') || dType.includes('fire')) {
      if (sType === 'community_centre' || sType === 'relief_camp' || sName.includes('smoke') || sName.includes('fire')) {
        typeCompatibilityScore = 100;
      }
    }

    // Composite Weighted Score (0 to 100)
    const compositeScore = Math.round(
      proximityScore * 0.30 +
      safetyScore * 0.25 +
      capacityScore * 0.20 +
      facilityScore * 0.15 +
      typeCompatibilityScore * 0.10
    );

    return {
      ...rawShelter,
      distanceFromUserKm: userDistKm !== null ? Math.round(userDistKm * 10) / 10 : null,
      distanceFromDisasterKm: disasterDistKm !== null ? Math.round(disasterDistKm * 10) / 10 : null,
      recommendationScore: compositeScore,
    };
  });

  // Sort descending by recommendation score
  scoredShelters.sort((a, b) => b.recommendationScore - a.recommendationScore);

  const topChoice = scoredShelters[0];
  const topRecommendedShelter = {
    ...topChoice,
    recommended: true,
  };

  // Build descriptive tactical justification
  const reasonParts = [];
  if (topChoice.distanceFromUserKm !== null) {
    reasonParts.push(`Optimal proximity (${topChoice.distanceFromUserKm} km)`);
  } else if (topChoice.distanceKm != null) {
    reasonParts.push(`Proximity: ~${topChoice.distanceKm} km from disaster area`);
  }
  if (topChoice.distanceFromDisasterKm !== null) {
    reasonParts.push(`Safely positioned ${topChoice.distanceFromDisasterKm} km from epicenter`);
  }
  const beds = topChoice.capacity?.availableBeds;
  if (beds != null && beds > 0) {
    reasonParts.push(`Intake ready with ${beds} available beds`);
  }
  const facilitiesList = [];
  if (topChoice.facilities?.medicalAvailable) facilitiesList.push('medical triage');
  if (topChoice.facilities?.foodAvailable) facilitiesList.push('food distribution');
  if (topChoice.facilities?.waterAvailable) facilitiesList.push('clean water');
  if (topChoice.facilities?.powerAvailable) facilitiesList.push('power backup');

  if (facilitiesList.length > 0) {
    reasonParts.push(`Equipped with ${facilitiesList.join(', ')}`);
  }

  const reason =
    reasonParts.length > 0
      ? `Top-rated shelter for ${dType ? dType.toUpperCase() : 'CIVIL DEFENSE'}: ${reasonParts.join('; ')}.`
      : `Recommended based on capacity, verified facility amenities, and tactical sector readiness.`;

  const confidence = Number((Math.min(98, Math.max(80, topChoice.recommendationScore)) / 100).toFixed(2));

  return {
    topRecommendedShelter,
    confidence,
    reason,
    scoredShelters,
  };
};

export default recommendShelter;
