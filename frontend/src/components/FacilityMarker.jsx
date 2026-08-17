import React, { useMemo } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { Star, MapPin, ExternalLink, ShieldAlert, Navigation } from 'lucide-react';
import { formatDistance, calculateDistanceKm, getGoogleMapsDirectionsUrl } from '../utils/geoUtils';

const facilityConfig = {
  hospital: { color: '#ef4444', emoji: '🏥', label: 'Hospital' },
  medical_center: { color: '#3b82f6', emoji: '🚑', label: 'Medical Center' },
  pharmacy: { color: '#10b981', emoji: '💊', label: 'Pharmacy' },
  police: { color: '#6366f1', emoji: '🚓', label: 'Police Station' },
  fire_station: { color: '#f97316', emoji: '🚒', label: 'Fire Station' },
  clinic: { color: '#06b6d4', emoji: '🩺', label: 'Clinic' },
};

/**
 * Generate custom SVG icon data URL for emergency facility marker
 */
const createFacilityIcon = (type, isSelected) => {
  const config = facilityConfig[type?.toLowerCase()] || facilityConfig.hospital;
  const size = isSelected ? 38 : 30;
  const radius = size / 2;
  const innerRadius = isSelected ? 12 : 9;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="${config.color}" fill-opacity="${isSelected ? 0.4 : 0.2}" stroke="${config.color}" stroke-width="${isSelected ? 2.5 : 1.5}"/>
      <circle cx="${radius}" cy="${radius}" r="${innerRadius}" fill="${config.color}" stroke="#ffffff" stroke-width="${isSelected ? 2.5 : 1.5}"/>
      <text x="${radius}" y="${radius + (isSelected ? 4 : 3)}" font-size="${isSelected ? 11 : 9}" text-anchor="middle">${config.emoji}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(size, size) : undefined,
    anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(radius, radius) : undefined,
  };
};

export const FacilityMarker = ({
  facility,
  isSelected,
  onClick,
  onClose,
  searchOrigin,
  userCoords,
}) => {
  const { name, type, address, latitude, longitude, rating, googleMapsUri } = facility;

  const latNum = Number(latitude);
  const lngNum = Number(longitude);

  const markerIcon = useMemo(
    () => createFacilityIcon(type, isSelected),
    [type, isSelected]
  );

  const isValidCoords =
    latitude !== null &&
    longitude !== null &&
    latitude !== undefined &&
    longitude !== undefined &&
    !isNaN(latNum) &&
    !isNaN(lngNum);

  if (!isValidCoords) {
    return null;
  }

  const position = { lat: latNum, lng: lngNum };
  const config = facilityConfig[type?.toLowerCase()] || facilityConfig.hospital;

  // Calculate distance from search origin or user location
  const distFromOrigin =
    searchOrigin && searchOrigin.latitude && searchOrigin.longitude
      ? calculateDistanceKm(
          Number(searchOrigin.latitude),
          Number(searchOrigin.longitude),
          latNum,
          lngNum
        )
      : null;

  const distFromUser =
    userCoords && userCoords.latitude && userCoords.longitude
      ? calculateDistanceKm(
          Number(userCoords.latitude),
          Number(userCoords.longitude),
          latNum,
          lngNum
        )
      : null;

  const userLat = userCoords ? Number(userCoords.latitude) : null;
  const userLng = userCoords ? Number(userCoords.longitude) : null;
  const directionsUrl = getGoogleMapsDirectionsUrl(
    userLat,
    userLng,
    latNum,
    lngNum
  );

  return (
    <>
      <Marker
        position={position}
        icon={markerIcon}
        title={`${config.emoji} ${name}`}
        zIndex={isSelected ? 150 : 25}
        onClick={() => {
          if (onClick) onClick(facility);
        }}
      />

      {isSelected && (
        <InfoWindow
          position={position}
          onCloseClick={onClose}
          options={{
            pixelOffset: new window.google.maps.Size(0, -16),
          }}
        >
          <div className="facility-popup-content">
            {/* Header */}
            <div className="facility-popup-header">
              <div className="facility-type-badge" style={{ color: config.color }}>
                <span>{config.emoji}</span>
                <span>{config.label.toUpperCase()}</span>
              </div>
              <span className="unverified-tag">Google Places</span>
            </div>

            {/* Title */}
            <h4 className="facility-popup-title">{name}</h4>

            {/* Address */}
            <div className="facility-popup-address">
              <MapPin size={13} className="facility-icon" />
              <span>{address}</span>
            </div>

            {/* Rating & Distance */}
            <div className="facility-popup-stats">
              {rating !== null && (
                <div className="facility-stat-pill rating-pill">
                  <Star size={12} className="star-icon" />
                  <span>{rating.toFixed(1)} / 5</span>
                </div>
              )}

              {distFromOrigin !== null && (
                <div className="facility-stat-pill dist-pill">
                  <span>~{formatDistance(distFromOrigin)} from center</span>
                </div>
              )}

              {distFromUser !== null && distFromOrigin === null && (
                <div className="facility-stat-pill dist-pill">
                  <span>~{formatDistance(distFromUser)} from you</span>
                </div>
              )}
            </div>

            {/* Safety Distinction Notice */}
            <div className="facility-disclaimer">
              <ShieldAlert size={12} className="disclaimer-icon" />
              <span>Unverified facility (not a certified emergency shelter).</span>
            </div>

            {/* Action buttons */}
            <div className="facility-popup-actions">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="facility-action-btn navigate-btn"
              >
                <Navigation size={12} />
                <span>Directions</span>
              </a>

              {googleMapsUri && (
                <a
                  href={googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="facility-action-btn gmaps-btn"
                >
                  <span>Google Maps</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default FacilityMarker;
