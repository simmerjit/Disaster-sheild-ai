import React from 'react';
import {
  MapPin,
  Users,
  Utensils,
  HeartPulse,
  Droplets,
  Zap,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatDistance, calculateDistanceKm, getGoogleMapsDirectionsUrl } from '../utils/geoUtils';

export const ShelterPopup = ({
  shelter,
  isRecommended,
  onNavigate,
  onOpenDetails,
  userCoords,
}) => {
  const {
    name,
    type,
    address,
    latitude,
    longitude,
    capacity = {},
    facilities = {},
    status = 'active',
    source = 'system',
    recommendationScore,
    confidence,
  } = shelter;

  const totalBeds = capacity.totalBeds || 0;
  const availableBeds = capacity.availableBeds || 0;
  const occupiedBeds = Math.max(0, totalBeds - availableBeds);
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 50;

  // Capacity color coding
  const capacityColorClass =
    occupancyPercent >= 90 || availableBeds === 0
      ? 'cap-red'
      : occupancyPercent >= 60
      ? 'cap-yellow'
      : 'cap-green';

  // Distance calculation
  const latNum = Number(latitude);
  const lngNum = Number(longitude);
  const userLat = userCoords ? Number(userCoords.latitude) : null;
  const userLng = userCoords ? Number(userCoords.longitude) : null;

  const distFromUser =
    userLat !== null && userLng !== null && !isNaN(latNum) && !isNaN(lngNum)
      ? calculateDistanceKm(userLat, userLng, latNum, lngNum)
      : shelter.distanceKm != null
      ? shelter.distanceKm
      : null;

  const directionsUrl = getGoogleMapsDirectionsUrl(userLat, userLng, latNum, lngNum);

  return (
    <div className="shelter-popup-content">
      {/* 1. Header Badges */}
      <div className="shelter-popup-top-row">
        <div className="shelter-type-pill">
          <span>🏕️</span>
          <span>{type ? type.replace(/_/g, ' ').toUpperCase() : 'EMERGENCY SHELTER'}</span>
        </div>

        {isRecommended && (
          <div className="shelter-rec-badge gold-glow">
            <Sparkles size={12} />
            <span>RECOMMENDED {confidence ? `${Math.round(confidence * 100)}%` : ''}</span>
          </div>
        )}

        {!isRecommended && (
          <span className={`shelter-status-pill status-${status}`}>
            {status.toUpperCase()}
          </span>
        )}
      </div>

      {/* 2. Shelter Title & Verified/Source Badge */}
      <h3 className="shelter-popup-title">{name}</h3>

      <div className="shelter-source-badge-row">
        {source === 'system' ? (
          <span className="source-relief-tag">
            <ShieldCheck size={12} /> Emergency Relief Camp
          </span>
        ) : (
          <span className="source-osm-tag">
            <ShieldCheck size={12} /> Verified Municipal Facility
          </span>
        )}
      </div>

      {/* 3. Address & Distance */}
      <div className="shelter-popup-meta">
        <div className="meta-line">
          <MapPin size={13} className="text-muted" />
          <span className="address-text">{address || 'Designated Public Assembly Site'}</span>
        </div>
        {distFromUser !== null && (
          <div className="meta-dist-chip">
            <span>📍 ~{formatDistance(distFromUser)} from your position</span>
          </div>
        )}
      </div>

      {/* 4. Bed Capacity Visualization Progress Bar */}
      <div className="shelter-capacity-card">
        <div className="cap-header">
          <span className="cap-label">
            <Users size={13} /> Bed Capacity &amp; Intake
          </span>
          <span className={`cap-numbers ${capacityColorClass}`}>
            <strong>{availableBeds}</strong> / {totalBeds} Available
          </span>
        </div>
        <div className="cap-progress-track">
          <div
            className={`cap-progress-fill ${capacityColorClass}`}
            style={{ width: `${Math.min(100, Math.max(8, occupancyPercent))}%` }}
          ></div>
        </div>
        <div className="cap-subtext">
          <span>{occupancyPercent}% Occupied ({occupiedBeds} civilians sheltered)</span>
        </div>
      </div>

      {/* 5. Life-Support Facilities Grid */}
      <div className="shelter-facilities-row">
        <span className={`facility-chip ${facilities.foodAvailable ? 'available' : 'unavailable'}`}>
          <Utensils size={11} /> Food {facilities.foodAvailable ? '✓' : '✗'}
        </span>
        <span className={`facility-chip ${facilities.medicalAvailable ? 'available' : 'unavailable'}`}>
          <HeartPulse size={11} /> Medical {facilities.medicalAvailable ? '✓' : '✗'}
        </span>
        <span className={`facility-chip ${facilities.waterAvailable ? 'available' : 'unavailable'}`}>
          <Droplets size={11} /> Water {facilities.waterAvailable ? '✓' : '✗'}
        </span>
        <span className={`facility-chip ${facilities.powerAvailable ? 'available' : 'unavailable'}`}>
          <Zap size={11} /> Power {facilities.powerAvailable ? '✓' : '✗'}
        </span>
      </div>

      {/* 6. Action Buttons */}
      <div className="shelter-popup-actions">
        <button
          onClick={() => {
            if (onNavigate) {
              onNavigate(shelter);
            } else {
              window.open(directionsUrl, '_blank');
            }
          }}
          className="shelter-btn-navigate"
          title="Calculate safe evacuation route on map"
        >
          <Navigation size={13} />
          <span>Safe Route</span>
        </button>

        <button
          onClick={() => {
            if (onOpenDetails) onOpenDetails(shelter);
          }}
          className="shelter-btn-details"
          title="Open comprehensive shelter profile & logistics"
        >
          <Info size={13} />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
};

export default ShelterPopup;
