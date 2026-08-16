import React from 'react';
import {
  Navigation,
  Compass,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  X,
  Route,
  Shield,
} from 'lucide-react';
import {
  calculateDistanceKm,
  calculateBearing,
  formatDistance,
  getGoogleMapsDirectionsUrl,
} from '../utils/geoUtils';

export const NavigationTool = ({
  userCoords,
  selectedDisaster,
  onClose,
}) => {
  if (!selectedDisaster) {
    return (
      <div className="nav-tool-panel">
        <div className="nav-tool-header">
          <div className="nav-tool-title">
            <Route size={16} className="nav-icon" />
            <span>Evacuation & Navigation</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="nav-close-btn">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="nav-tool-empty">
          <MapPin size={24} className="empty-icon" />
          <p>Select any disaster event on the map or in the sidebar to calculate distance, bearing, and evacuation routing.</p>
        </div>
      </div>
    );
  }

  const disasterLat = Number(selectedDisaster.latitude);
  const disasterLng = Number(selectedDisaster.longitude);
  const userLat = userCoords ? Number(userCoords.latitude) : null;
  const userLng = userCoords ? Number(userCoords.longitude) : null;

  const distanceKm =
    userLat !== null && userLng !== null
      ? calculateDistanceKm(userLat, userLng, disasterLat, disasterLng)
      : null;

  const bearing =
    userLat !== null && userLng !== null
      ? calculateBearing(userLat, userLng, disasterLat, disasterLng)
      : null;

  const radiusKm = Number(selectedDisaster.affectedRadius || 10);
  const isInsideRadius = distanceKm !== null && distanceKm <= radiusKm;
  const safeMarginKm = distanceKm !== null ? Math.max(0, distanceKm - radiusKm) : null;

  const directionsUrl = getGoogleMapsDirectionsUrl(
    userLat,
    userLng,
    disasterLat,
    disasterLng
  );

  return (
    <div className="nav-tool-panel">
      {/* Header */}
      <div className="nav-tool-header">
        <div className="nav-tool-title">
          <Route size={16} className="nav-icon" />
          <span>Evacuation & Navigation</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="nav-close-btn">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Target Disaster Card */}
      <div className="nav-target-card">
        <span className="target-label">Target Disaster:</span>
        <h4 className="target-title">{selectedDisaster.title}</h4>
        <span className="target-location">{selectedDisaster.location || selectedDisaster.country || 'Global Event'}</span>
      </div>

      {/* User Location Status */}
      {!userCoords ? (
        <div className="nav-warning-banner">
          <AlertTriangle size={15} />
          <span>Click <strong>My Location</strong> to calculate exact distance & evacuation route from your position.</span>
        </div>
      ) : (
        <div className="nav-metrics-container">
          {/* Distance & Heading */}
          <div className="nav-stat-row">
            <div className="nav-stat-box">
              <span className="stat-label">Distance to Epicenter</span>
              <span className="stat-value">{formatDistance(distanceKm)}</span>
            </div>
            <div className="nav-stat-box">
              <span className="stat-label">Bearing / Direction</span>
              <span className="stat-value">
                {bearing ? `${bearing.compass} (${bearing.degrees}°)` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Safety & Evacuation Zone Status */}
          <div className={`nav-safety-box ${isInsideRadius ? 'danger-zone' : 'safe-zone'}`}>
            {isInsideRadius ? (
              <>
                <AlertTriangle size={18} className="safety-icon danger" />
                <div>
                  <strong>Inside Danger Zone!</strong>
                  <p>You are within the estimated {radiusKm} km impact perimeter. Evacuate immediately away from this heading.</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} className="safety-icon safe" />
                <div>
                  <strong>Outside Immediate Impact Area</strong>
                  <p>You are ~{safeMarginKm?.toFixed(1)} km outside the estimated {radiusKm} km perimeter.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Button: Google Maps Turn-by-Turn Navigation */}
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-directions-btn"
        title="Open turn-by-turn directions in Google Maps"
      >
        <Navigation size={15} />
        <span>Open in Google Maps Navigation</span>
        <ExternalLink size={13} />
      </a>
    </div>
  );
};

export default NavigationTool;
