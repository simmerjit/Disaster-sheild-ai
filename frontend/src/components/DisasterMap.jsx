import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DisasterMarker from './DisasterMarker';
import UserLocation from './UserLocation';

/**
 * Controller to handle flyTo animations when a disaster is selected from list
 */
const MapFlyToController = ({ selectedDisaster }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedDisaster && selectedDisaster.latitude && selectedDisaster.longitude) {
      map.flyTo([selectedDisaster.latitude, selectedDisaster.longitude], 7, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [selectedDisaster, map]);

  return null;
};

export const DisasterMap = ({
  disasters = [],
  selectedDisaster,
  onSelectDisaster,
  userCoords,
  onLocationFound,
}) => {
  // World Center initial view
  const defaultCenter = [20.0, 0.0];
  const defaultZoom = 3;

  return (
    <div className="map-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={true}
        className="leaflet-map-container"
      >
        {/* OpenStreetMap Standard Tiles with proper attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Selected Disaster FlyTo Controller */}
        <MapFlyToController selectedDisaster={selectedDisaster} />

        {/* User Geolocation Component & Controls */}
        <UserLocation
          userCoords={userCoords}
          onLocationFound={onLocationFound}
        />

        {/* Disaster Event Markers & Impact Radii */}
        {disasters.map((disaster) => (
          <DisasterMarker
            key={disaster.id}
            disaster={disaster}
            isSelected={selectedDisaster?.id === disaster.id}
            onClick={onSelectDisaster}
          />
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="map-legend-box">
        <h4 className="legend-title">Disaster Legend</h4>
        <div className="legend-grid">
          <div className="legend-item"><span className="legend-symbol">🔴</span> Earthquake</div>
          <div className="legend-item"><span className="legend-symbol">🟠</span> Cyclone</div>
          <div className="legend-item"><span className="legend-symbol">🔵</span> Flood</div>
          <div className="legend-item"><span className="legend-symbol">🔥</span> Wildfire</div>
          <div className="legend-item"><span className="legend-symbol">🟣</span> Volcano</div>
          <div className="legend-item"><span className="legend-symbol">⛈️</span> Storm</div>
          <div className="legend-item"><span className="legend-symbol">🌾</span> Drought</div>
          <div className="legend-item"><span className="legend-symbol">🌊</span> Tsunami</div>
          <div className="legend-item"><span className="legend-symbol">📍</span> Your Location</div>
        </div>
        <div className="legend-radius-note">
          <span className="radius-indicator"></span> Circle = Impact Radius (km &times; 1000m)
        </div>
      </div>
    </div>
  );
};

export default DisasterMap;
