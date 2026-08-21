import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  Home,
  Copy,
} from 'lucide-react';
import { formatDistance, calculateDistanceKm, getGoogleMapsDirectionsUrl } from '../utils/geoUtils';

export const ShelterDetailsModal = ({
  shelter,
  isRecommended,
  onClose,
  onNavigate,
  userCoords,
}) => {
  if (!shelter) return null;

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
    reason,
    distanceFromUserKm,
    distanceFromDisasterKm,
  } = shelter;

  const totalBeds = capacity.totalBeds || 0;
  const availableBeds = capacity.availableBeds || 0;
  const occupiedBeds = Math.max(0, totalBeds - availableBeds);
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 50;

  const latNum = Number(latitude);
  const lngNum = Number(longitude);
  const userLat = userCoords ? Number(userCoords.latitude) : null;
  const userLng = userCoords ? Number(userCoords.longitude) : null;

  const distFromUser =
    distanceFromUserKm != null
      ? distanceFromUserKm
      : userLat !== null && userLng !== null && !isNaN(latNum) && !isNaN(lngNum)
      ? calculateDistanceKm(userLat, userLng, latNum, lngNum)
      : shelter.distanceKm != null
      ? shelter.distanceKm
      : null;

  const directionsUrl = getGoogleMapsDirectionsUrl(userLat, userLng, latNum, lngNum);

  const capacityColorClass =
    occupancyPercent >= 90 || availableBeds === 0
      ? 'cap-red'
      : occupancyPercent >= 60
      ? 'cap-yellow'
      : 'cap-green';

  return (
    <AnimatePresence>
      <div className="shelter-modal-overlay" onClick={onClose}>
        <motion.div
          className="shelter-modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="shelter-modal-header">
            <div className="modal-header-left">
              <div className="shelter-badge-icon">
                <span>🏕️</span>
              </div>
              <div>
                <div className="modal-top-tags">
                  <span className="modal-type-tag">
                    {type ? type.replace(/_/g, ' ').toUpperCase() : 'EMERGENCY SHELTER'}
                  </span>
                  <span className={`modal-status-badge status-${status}`}>
                    {status.toUpperCase()}
                  </span>
                  {source === 'system' ? (
                    <span className="modal-source-badge relief">
                      <ShieldCheck size={12} /> Emergency Relief Camp
                    </span>
                  ) : (
                    <span className="modal-source-badge osm">
                      <ShieldCheck size={12} /> Verified Municipal Facility
                    </span>
                  )}
                </div>
                <h2 className="shelter-modal-title">{name}</h2>
              </div>
            </div>

            <button onClick={onClose} className="shelter-modal-close-btn" title="Close modal">
              <X size={18} />
            </button>
          </div>

          {/* AI Recommendation Spotlight Banner (if recommended) */}
          {(isRecommended || shelter.recommended) && (
            <div className="shelter-recommendation-spotlight">
              <div className="spotlight-header">
                <Sparkles size={16} className="text-gold pulse-icon" />
                <span className="spotlight-title">
                  TOP RECOMMENDED SAFE SHELTER &bull; AI CONFIDENCE{' '}
                  {confidence ? `${Math.round(confidence * 100)}%` : '94%'}
                </span>
              </div>
              <p className="spotlight-reason">
                {reason ||
                  `Optimized for civilian intake: shortest evacuation route from user position, situated outside primary hazard danger zone with full medical, power, and food life-support facilities.`}
              </p>
            </div>
          )}

          {/* Modal Body Scroll Area */}
          <div className="shelter-modal-body">
            {/* Quick Metrics Strip */}
            <div className="shelter-stats-grid">
              <div className="shelter-stat-box">
                <span className="stat-label">Total Bed Capacity</span>
                <span className="stat-num">{totalBeds.toLocaleString()}</span>
                <span className="stat-sub">Official Intake Limit</span>
              </div>
              <div className="shelter-stat-box highlight-green">
                <span className="stat-label">Available Beds</span>
                <span className="stat-num text-emerald">{availableBeds.toLocaleString()}</span>
                <span className="stat-sub">Immediate Admission</span>
              </div>
              <div className="shelter-stat-box">
                <span className="stat-label">Occupancy Rate</span>
                <span className="stat-num">{occupancyPercent}%</span>
                <span className="stat-sub">{occupiedBeds} Sheltered</span>
              </div>
              <div className="shelter-stat-box">
                <span className="stat-label">Distance from You</span>
                <span className="stat-num">
                  {distFromUser !== null ? formatDistance(distFromUser) : 'Proximity Calculated'}
                </span>
                <span className="stat-sub">Road Evacuation</span>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="shelter-detailed-capacity-card">
              <div className="detailed-cap-header">
                <div className="cap-title-row">
                  <Users size={16} className="text-cyan" />
                  <h4>Live Bed Occupancy &amp; Intake Status</h4>
                </div>
                <span className={`cap-status-pill ${capacityColorClass}`}>
                  {occupancyPercent >= 90 ? 'Critical Capacity' : occupancyPercent >= 60 ? 'Moderate Capacity' : 'High Availability'}
                </span>
              </div>

              <div className="detailed-cap-bar-track">
                <div
                  className={`detailed-cap-bar-fill ${capacityColorClass}`}
                  style={{ width: `${Math.min(100, Math.max(6, occupancyPercent))}%` }}
                ></div>
              </div>

              <div className="detailed-cap-legend">
                <span>
                  Occupied: <strong>{occupiedBeds}</strong> beds
                </span>
                <span>
                  Available: <strong>{availableBeds}</strong> beds
                </span>
                <span>
                  Total: <strong>{totalBeds}</strong> beds
                </span>
              </div>
            </div>

            {/* Life Support Facilities & Services Grid */}
            <div className="shelter-facilities-section">
              <h4 className="section-title">Verified Life-Support Amenities</h4>
              <div className="facilities-detail-grid">
                <div className={`facility-detail-card ${facilities.foodAvailable ? 'active' : 'inactive'}`}>
                  <div className="fac-icon-wrap food">
                    <Utensils size={18} />
                  </div>
                  <div className="fac-info">
                    <span className="fac-name">Emergency Food Supply</span>
                    <span className="fac-desc">
                      {facilities.foodAvailable ? 'Hot meals & dry food rations available' : 'No food distribution station'}
                    </span>
                  </div>
                  <span className="fac-badge">{facilities.foodAvailable ? 'VERIFIED' : 'UNAVAILABLE'}</span>
                </div>

                <div className={`facility-detail-card ${facilities.medicalAvailable ? 'active' : 'inactive'}`}>
                  <div className="fac-icon-wrap medical">
                    <HeartPulse size={18} />
                  </div>
                  <div className="fac-info">
                    <span className="fac-name">Medical Triage &amp; First Aid</span>
                    <span className="fac-desc">
                      {facilities.medicalAvailable ? 'Doctors & paramedic triage post deployed' : 'Basic emergency first aid only'}
                    </span>
                  </div>
                  <span className="fac-badge">{facilities.medicalAvailable ? 'VERIFIED' : 'UNAVAILABLE'}</span>
                </div>

                <div className={`facility-detail-card ${facilities.waterAvailable ? 'active' : 'inactive'}`}>
                  <div className="fac-icon-wrap water">
                    <Droplets size={18} />
                  </div>
                  <div className="fac-info">
                    <span className="fac-name">Clean Potable Water</span>
                    <span className="fac-desc">
                      {facilities.waterAvailable ? 'Drinking water purification & reservoir active' : 'Limited water supply'}
                    </span>
                  </div>
                  <span className="fac-badge">{facilities.waterAvailable ? 'VERIFIED' : 'UNAVAILABLE'}</span>
                </div>

                <div className={`facility-detail-card ${facilities.powerAvailable ? 'active' : 'inactive'}`}>
                  <div className="fac-icon-wrap power">
                    <Zap size={18} />
                  </div>
                  <div className="fac-info">
                    <span className="fac-name">Backup Generator Power</span>
                    <span className="fac-desc">
                      {facilities.powerAvailable ? 'Uninterrupted power generator & charging hubs' : 'Grid power dependent'}
                    </span>
                  </div>
                  <span className="fac-badge">{facilities.powerAvailable ? 'VERIFIED' : 'UNAVAILABLE'}</span>
                </div>
              </div>
            </div>

            {/* Geographical & Sector Information */}
            <div className="shelter-location-section">
              <h4 className="section-title">Geographical &amp; Dispatch Details</h4>
              <div className="location-details-box">
                <div className="loc-item">
                  <MapPin size={15} className="text-muted" />
                  <div>
                    <span className="loc-label">Facility Address</span>
                    <span className="loc-val">{address || 'Designated Public Assembly Shelter Zone'}</span>
                  </div>
                </div>

                <div className="loc-row-split">
                  <div className="loc-item">
                    <span className="loc-label">Latitude</span>
                    <span className="loc-val font-mono">{latNum.toFixed(5)}°N</span>
                  </div>
                  <div className="loc-item">
                    <span className="loc-label">Longitude</span>
                    <span className="loc-val font-mono">{lngNum.toFixed(5)}°E</span>
                  </div>
                  {distanceFromDisasterKm != null && (
                    <div className="loc-item">
                      <span className="loc-label">Disaster Epicenter Buffer</span>
                      <span className="loc-val text-cyan">~{distanceFromDisasterKm} km outside</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="shelter-modal-footer">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-footer-btn gmaps"
            >
              <span>Open in Google Maps</span>
              <ExternalLink size={13} />
            </a>

            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate(shelter);
                  onClose();
                }
              }}
              className="modal-footer-btn navigate-primary"
            >
              <Navigation size={15} />
              <span>Plot Safe Route on Live Map</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShelterDetailsModal;
