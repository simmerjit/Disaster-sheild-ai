import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { darkMapStyle } from '../utils/mapStyles';
import DisasterMarker from './DisasterMarker';
import DisasterPopup from './DisasterPopup';
import FacilityMarker from './FacilityMarker';
import ShelterMarker from './ShelterMarker';
import UserLocation from './UserLocation';
import WeatherWidget from './WeatherWidget';
import NavigationTool from './NavigationTool';
import NearbyFacilitiesPanel from './NearbyFacilitiesPanel';
import {
  Maximize2,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Map as MapIcon,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CloudSun,
  Route,
  Hospital,
  HelpCircle,
  Home,
  Navigation,
  Sparkles,
  X,
} from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 20.0,
  lng: 0.0,
};

const defaultZoom = 3;

const googleMapsLibraries = [];

export const DisasterMap = ({
  disasters = [],
  selectedDisaster,
  onSelectDisaster,
  userCoords,
  onLocationFound,
  weatherTarget,
  onSetWeatherTarget,
  showNavTool,
  onToggleNavTool,
  facilities = [],
  onFacilitiesLoaded,
  facilitiesOrigin,
  onSetFacilitiesOrigin,
  showFacilitiesPanel,
  onToggleFacilitiesPanel,
  onOpenDetails,
  onOpenSurvivalAcademy,
  // ── Emergency Shelter Props ──────────────────
  shelters = [],
  recommendedShelter = null,
  selectedShelter = null,
  onSelectShelter,
  onOpenShelterDetails,
  showSheltersPanel = false,
  onToggleSheltersPanel,
  activeNavigationRoute = null,
  onClearNavigationRoute,
  onViewportChange,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: googleMapsLibraries,
  });

  const [map, setMap] = useState(null);
  const [mapTypeId, setMapTypeId] = useState('roadmap'); // 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
  const [useDarkTheme, setUseDarkTheme] = useState(true);
  const [showRadiusCircles, setShowRadiusCircles] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [weatherInspectorActive, setWeatherInspectorActive] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);

  // Live Evacuation Safe Route state
  const [directionsResult, setDirectionsResult] = useState(null);
  const [activeRouteInfo, setActiveRouteInfo] = useState(null);

  const idleTimeoutRef = useRef(null);

  // Dynamic Layer Toggles
  const [activeLayers, setActiveLayers] = useState({
    disasters: true,
    shelters: true,
    facilities: true,
    police: true,
    fire_station: true,
    rainfall: false,
    lightning: false,
    cyclones: false,
    heatwave: false,
    weather: false,
  });

  // Calculate live Google Maps evacuation route
  const calculateRoute = useCallback(
    (destination) => {
      if (!window.google || !destination || destination.latitude == null || destination.longitude == null) return;

      const originLat = userCoords ? Number(userCoords.latitude) : 28.6139;
      const originLng = userCoords ? Number(userCoords.longitude) : 77.209;

      const destLat = Number(destination.latitude);
      const destLng = Number(destination.longitude);

      if (isNaN(destLat) || isNaN(destLng)) return;

      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: originLat, lng: originLng },
          destination: { lat: destLat, lng: destLng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            setDirectionsResult(result);
            const leg = result.routes[0]?.legs[0];
            setActiveRouteInfo({
              destinationName: destination.name || destination.title || 'Safe Shelter Destination',
              distance: leg?.distance?.text || '',
              duration: leg?.duration?.text || '',
              destination,
            });
            if (map) {
              map.panTo({ lat: destLat, lng: destLng });
            }
          } else {
            console.warn('Google DirectionsService failed:', status);
          }
        }
      );
    },
    [userCoords, map]
  );

  // Sync external route trigger
  useEffect(() => {
    if (activeNavigationRoute) {
      calculateRoute(activeNavigationRoute);
    }
  }, [activeNavigationRoute, calculateRoute]);

  // Track map load
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Map Idle tracking debounced by 500ms (detects visible disasters & updates shelters without moving map)
  const handleMapIdle = useCallback(() => {
    if (!map || !window.google) return;

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      if (!bounds || !center) return;

      const centerLat = center.lat();
      const centerLng = center.lng();

      const visibleDisasters = disasters.filter((d) => {
        const dLat = Number(d.latitude);
        const dLng = Number(d.longitude);
        if (isNaN(dLat) || isNaN(dLng)) return false;
        return bounds.contains({ lat: dLat, lng: dLng });
      });

      if (onViewportChange) {
        onViewportChange({
          center: { latitude: centerLat, longitude: centerLng },
          visibleDisasters,
        });
      }
    }, 500);
  }, [map, disasters, onViewportChange]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  // Smoothly pan to selected disaster (PRESERVES ZOOM LEVEL)
  useEffect(() => {
    if (map && selectedDisaster) {
      const lat = Number(selectedDisaster.latitude);
      const lng = Number(selectedDisaster.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        map.panTo({ lat, lng });
      }
    }
  }, [map, selectedDisaster]);

  // Smoothly pan to selected shelter (PRESERVES ZOOM LEVEL)
  useEffect(() => {
    if (map && selectedShelter) {
      const lat = Number(selectedShelter.latitude);
      const lng = Number(selectedShelter.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        map.panTo({ lat, lng });
      }
    }
  }, [map, selectedShelter]);

  // Smoothly pan to selected facility (PRESERVES ZOOM LEVEL)
  useEffect(() => {
    if (map && selectedFacility) {
      const lat = Number(selectedFacility.latitude);
      const lng = Number(selectedFacility.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        map.panTo({ lat, lng });
      }
    }
  }, [map, selectedFacility]);

  // Fit all visible disasters on map (ONLY TRIGGERED ON MANUAL USER CLICK)
  const handleFitBounds = useCallback(() => {
    if (!map || !window.google || (disasters.length === 0 && facilities.length === 0)) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasValid = false;

    disasters.forEach((d) => {
      const lat = Number(d.latitude);
      const lng = Number(d.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        bounds.extend({ lat, lng });
        hasValid = true;
      }
    });

    facilities.forEach((f) => {
      const lat = Number(f.latitude);
      const lng = Number(f.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        bounds.extend({ lat, lng });
        hasValid = true;
      }
    });

    if (hasValid) {
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  }, [map, disasters, facilities]);

  // Reset to default world view
  const handleResetView = useCallback(() => {
    if (!map) return;
    map.panTo(defaultCenter);
    map.setZoom(defaultZoom);
  }, [map]);

  // Zoom controls
  const handleZoomIn = () => {
    if (map) map.setZoom(map.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (map) map.setZoom(Math.max(2, map.getZoom() - 1));
  };

  // Toggle layers
  const toggleLayer = (layerName) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  // Handle map click for weather inspection
  const handleMapClick = (e) => {
    if (weatherInspectorActive && e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (onSetWeatherTarget) {
        onSetWeatherTarget({
          latitude: lat,
          longitude: lng,
          name: `Point (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
          type: 'weather_point',
        });
      }
    }
  };

  // Map options configuration
  const mapOptions = useMemo(
    () => ({
      styles: useDarkTheme && mapTypeId === 'roadmap' ? darkMapStyle : undefined,
      mapTypeId: mapTypeId,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      backgroundColor: '#142842',
      minZoom: 2,
      maxZoom: 18,
      gestureHandling: 'greedy',
      draggableCursor: weatherInspectorActive ? 'crosshair' : undefined,
    }),
    [useDarkTheme, mapTypeId, weatherInspectorActive]
  );

  // Fallback: If no Google Maps API Key is configured in .env
  if (!apiKey) {
    return (
      <div className="map-wrapper no-key-fallback">
        <div className="api-key-banner">
          <div className="api-key-header">
            <KeyRound size={28} className="key-icon" />
            <h3>Google Maps API Key Required</h3>
          </div>
          <p>
            To display the live interactive Google Map, add your Google Maps API Key to your frontend environment file:
          </p>
          <div className="code-snippet">
            <code>frontend/.env</code>
            <pre>VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here</pre>
          </div>
          <div className="key-steps">
            <strong>Quick Setup:</strong>
            <ol>
              <li>Go to <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noreferrer">Google Cloud Console &rarr; Maps JavaScript API</a></li>
              <li>Create or copy your API key</li>
              <li>Save it in <code>frontend/.env</code> under <code>VITE_GOOGLE_MAPS_API_KEY</code></li>
              <li>Restart Vite dev server or refresh this page</li>
            </ol>
          </div>
          <div className="fallback-disaster-list">
            <strong>Disaster Feed Available:</strong> {disasters.length} live disaster events currently loaded in the sidebar.
          </div>
        </div>
      </div>
    );
  }

  // Handle Load Error
  if (loadError) {
    return (
      <div className="map-wrapper map-error-fallback">
        <div className="api-key-banner">
          <AlertCircle size={28} className="error-icon" />
          <h3>Error Loading Google Maps</h3>
          <p>{loadError.message || 'Unable to authenticate with Google Maps JavaScript API. Please check your API Key and domain restrictions.'}</p>
        </div>
      </div>
    );
  }

  // Loading state while script loads
  if (!isLoaded) {
    return (
      <div className="map-wrapper map-loading-state">
        <div className="loading-box">
          <div className="spin-icon">🌐</div>
          <p>Loading Google Maps JavaScript API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onIdle={handleMapIdle}
        onClick={handleMapClick}
      >
        {/* User Geolocation Controls & Marker */}
        <UserLocation
          map={map}
          userCoords={userCoords}
          onLocationFound={onLocationFound}
        />

        {/* Live Evacuation Directions Safe Route on Map */}
        {directionsResult && (
          <DirectionsRenderer
            directions={directionsResult}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#38bdf8',
                strokeWeight: 6,
                strokeOpacity: 0.9,
              },
            }}
          />
        )}

        {/* Disaster Event Markers & Impact Radii */}
        {activeLayers.disasters &&
          disasters.map((disaster) => (
            <DisasterMarker
              key={disaster.id}
              disaster={disaster}
              isSelected={selectedDisaster?.id === disaster.id}
              onClick={onSelectDisaster}
              showRadius={showRadiusCircles}
            />
          ))}

        {/* Emergency Shelters & Relief Camps */}
        {activeLayers.shelters &&
          shelters.map((s) => {
            const isRec =
              s.recommended ||
              (recommendedShelter &&
                (recommendedShelter._id === s._id ||
                  (recommendedShelter.name === s.name &&
                    Math.abs(recommendedShelter.latitude - s.latitude) < 0.001)));

            return (
              <ShelterMarker
                key={s._id || `${s.name}-${s.latitude}`}
                shelter={s}
                isRecommended={isRec}
                isSelected={selectedShelter?._id === s._id || selectedShelter?.name === s.name}
                onClick={(sh) => {
                  if (onSelectShelter) onSelectShelter(sh);
                }}
                onClose={() => {
                  if (onSelectShelter) onSelectShelter(null);
                }}
                onNavigate={(sh) => {
                  calculateRoute(sh);
                }}
                onOpenDetails={(sh) => {
                  if (onOpenShelterDetails) onOpenShelterDetails(sh);
                }}
                userCoords={userCoords}
              />
            );
          })}

        {/* Google Places Nearby Emergency Facilities Markers */}
        {activeLayers.facilities &&
          facilities.map((place) => (
            <FacilityMarker
              key={place.id}
              facility={place}
              isSelected={selectedFacility?.id === place.id}
              onClick={(f) => setSelectedFacility(f)}
              onClose={() => setSelectedFacility(null)}
              searchOrigin={facilitiesOrigin}
              userCoords={userCoords}
            />
          ))}

        {/* Selected Disaster Info Window */}
        {selectedDisaster &&
          selectedDisaster.latitude !== null &&
          selectedDisaster.longitude !== null && (
            <InfoWindow
              position={{
                lat: Number(selectedDisaster.latitude),
                lng: Number(selectedDisaster.longitude),
              }}
              onCloseClick={() => onSelectDisaster(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -20),
              }}
            >
              <DisasterPopup
                disaster={selectedDisaster}
                userCoords={userCoords}
                onOpenWeather={onSetWeatherTarget}
                onOpenNavigation={() => {
                  if (onToggleNavTool) onToggleNavTool(true);
                }}
                onOpenFacilities={(origin) => {
                  if (onSetFacilitiesOrigin) onSetFacilitiesOrigin(origin);
                  if (onToggleFacilitiesPanel) onToggleFacilitiesPanel(true);
                }}
                onOpenDetails={onOpenDetails}
                onOpenSurvivalAcademy={onOpenSurvivalAcademy}
              />
            </InfoWindow>
          )}
      </GoogleMap>

      {/* Floating Active Evacuation Safe Route Banner */}
      {activeRouteInfo && (
        <div className="active-route-hud-banner">
          <div className="route-hud-icon">
            <Navigation size={18} className="text-cyan pulse-icon" />
          </div>
          <div className="route-hud-content">
            <span className="route-hud-badge">ACTIVE EVACUATION ROUTE</span>
            <h4 className="route-hud-title">{activeRouteInfo.destinationName}</h4>
            <div className="route-hud-stats">
              <span>📏 {activeRouteInfo.distance}</span>
              <span>⏱️ {activeRouteInfo.duration} travel time</span>
            </div>
          </div>
          <button
            onClick={() => {
              setDirectionsResult(null);
              setActiveRouteInfo(null);
              if (onClearNavigationRoute) onClearNavigationRoute();
            }}
            className="route-hud-close"
            title="Clear Route"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Floating Map Unified Command Dock */}
      <div className="map-floating-dock">
        {/* Navigation & Zoom Controls */}
        <div className="dock-group">
          <button onClick={handleZoomIn} className="dock-btn" title="Zoom In (+)">
            <ZoomIn size={16} />
          </button>
          <button onClick={handleZoomOut} className="dock-btn" title="Zoom Out (-)">
            <ZoomOut size={16} />
          </button>
          <button onClick={handleFitBounds} className="dock-btn" title="Fit All Events in View">
            <Maximize2 size={16} />
          </button>
          <button onClick={handleResetView} className="dock-btn" title="Reset World View">
            <Compass size={16} />
          </button>
        </div>

        <div className="dock-divider" aria-hidden="true"></div>

        {/* Crisis Incident Tools */}
        <div className="dock-group">
          <button
            onClick={() => {
              if (onToggleSheltersPanel) onToggleSheltersPanel(!showSheltersPanel);
            }}
            className={`dock-btn btn-shelters ${showSheltersPanel ? 'active' : ''}`}
            title="Emergency Shelters & Relief Camps Registry"
          >
            <Home size={16} />
          </button>

          <button
            onClick={() => {
              if (showFacilitiesPanel) {
                if (onToggleFacilitiesPanel) onToggleFacilitiesPanel(false);
              } else {
                if (selectedDisaster) {
                  if (onSetFacilitiesOrigin) {
                    onSetFacilitiesOrigin({
                      latitude: Number(selectedDisaster.latitude),
                      longitude: Number(selectedDisaster.longitude),
                      name: selectedDisaster.title,
                      type: 'disaster',
                    });
                  }
                } else if (userCoords) {
                  if (onSetFacilitiesOrigin) {
                    onSetFacilitiesOrigin({
                      latitude: Number(userCoords.latitude),
                      longitude: Number(userCoords.longitude),
                      name: 'Your Location',
                      type: 'user',
                    });
                  }
                }
                if (onToggleFacilitiesPanel) onToggleFacilitiesPanel(true);
              }
            }}
            className={`dock-btn btn-facilities ${showFacilitiesPanel ? 'active' : ''}`}
            title="Find Nearby Emergency Facilities (Google Places)"
          >
            <Hospital size={16} />
          </button>

          <button
            onClick={() => {
              if (weatherTarget) {
                onSetWeatherTarget(null);
              } else {
                if (selectedDisaster) {
                  onSetWeatherTarget({
                    latitude: Number(selectedDisaster.latitude),
                    longitude: Number(selectedDisaster.longitude),
                    name: selectedDisaster.title,
                    type: selectedDisaster.type,
                  });
                } else if (userCoords) {
                  onSetWeatherTarget({
                    latitude: Number(userCoords.latitude),
                    longitude: Number(userCoords.longitude),
                    name: 'Your Current Location',
                    type: 'user_location',
                  });
                } else if (map) {
                  const center = map.getCenter();
                  if (center) {
                    onSetWeatherTarget({
                      latitude: center.lat(),
                      longitude: center.lng(),
                      name: 'Map Center Position',
                      type: 'map_center',
                    });
                  }
                }
              }
            }}
            className={`dock-btn btn-weather ${weatherTarget ? 'active' : ''}`}
            title="Toggle Live Weather HUD"
          >
            <CloudSun size={17} />
          </button>

          <button
            onClick={() => {
              if (onToggleNavTool) onToggleNavTool(!showNavTool);
            }}
            className={`dock-btn btn-nav ${showNavTool ? 'active' : ''}`}
            title="Toggle Evacuation & Navigation Tool"
          >
            <Route size={16} />
          </button>

          <button
            onClick={() => setWeatherInspectorActive(!weatherInspectorActive)}
            className={`dock-btn btn-inspector ${weatherInspectorActive ? 'active-pulse' : ''}`}
            title={
              weatherInspectorActive
                ? 'Weather Inspector Active (Click map to read weather)'
                : 'Activate Weather Inspector (Click anywhere on map)'
            }
          >
            <HelpCircle size={16} />
          </button>
        </div>

        <div className="dock-divider" aria-hidden="true"></div>

        {/* View Modes & Layer Toggles */}
        <div className="dock-group">
          <button
            onClick={() => setShowRadiusCircles(!showRadiusCircles)}
            className={`dock-btn ${showRadiusCircles ? 'active' : ''}`}
            title={showRadiusCircles ? 'Hide impact radii' : 'Show impact radii'}
          >
            {showRadiusCircles ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          <button
            onClick={() => {
              const types = ['roadmap', 'satellite', 'hybrid', 'terrain'];
              const nextIdx = (types.indexOf(mapTypeId) + 1) % types.length;
              setMapTypeId(types[nextIdx]);
            }}
            className={`dock-btn btn-map-type ${mapTypeId !== 'roadmap' ? 'active' : ''}`}
            title={`Map Theme: ${mapTypeId.toUpperCase()} (Click to toggle)`}
          >
            <MapIcon size={16} />
          </button>

          <button
            onClick={() => setShowLayersMenu(!showLayersMenu)}
            className={`dock-btn ${showLayersMenu ? 'active' : ''}`}
            title="Toggle data layers"
          >
            <Layers size={16} />
          </button>
        </div>
      </div>

      {/* Weather Inspector Status Banner */}
      {weatherInspectorActive && (
        <div className="inspector-banner">
          <span>🎯 Weather Inspector Active: Click anywhere on map to fetch live weather</span>
          <button onClick={() => setWeatherInspectorActive(false)}>&times;</button>
        </div>
      )}

      {/* Live Weather HUD Widget */}
      {weatherTarget && (
        <WeatherWidget
          targetLocation={weatherTarget}
          onClose={() => onSetWeatherTarget(null)}
        />
      )}

      {/* Evacuation & Navigation Tool HUD */}
      {showNavTool && (
        <NavigationTool
          userCoords={userCoords}
          selectedDisaster={selectedDisaster}
          onClose={() => onToggleNavTool(false)}
        />
      )}

      {/* Nearby Emergency Facilities Panel (Google Places) */}
      {showFacilitiesPanel && (
        <NearbyFacilitiesPanel
          searchOrigin={facilitiesOrigin}
          facilities={facilities}
          onFacilitiesLoaded={onFacilitiesLoaded}
          selectedFacility={selectedFacility}
          onSelectFacility={setSelectedFacility}
          onClose={() => onToggleFacilitiesPanel(false)}
          userCoords={userCoords}
        />
      )}

      {/* Data Layers Menu Panel */}
      {showLayersMenu && (
        <div className="map-layers-panel">
          <div className="layers-header">
            <h4>Data Layers</h4>
            <span className="badge">Active Configuration</span>
          </div>
          <div className="layers-list">
            <label className="layer-item">
              <input
                type="checkbox"
                checked={activeLayers.disasters}
                onChange={() => toggleLayer('disasters')}
              />
              <span>🔴 Disaster Layer (Live Incident Feeds)</span>
              <span className="future-tag active-pill">Active</span>
            </label>

            <label className="layer-item">
              <input
                type="checkbox"
                checked={activeLayers.shelters}
                onChange={() => toggleLayer('shelters')}
              />
              <span>🏕️ Emergency Shelters &amp; Relief Camps</span>
              <span className="future-tag active-pill">Active</span>
            </label>

            <label className="layer-item">
              <input
                type="checkbox"
                checked={activeLayers.facilities}
                onChange={() => toggleLayer('facilities')}
              />
              <span>🏥 Hospitals &amp; Medical Centers</span>
              <span className="future-tag active-pill">Active</span>
            </label>

            <label className="layer-item">
              <input
                type="checkbox"
                checked={activeLayers.police}
                onChange={() => toggleLayer('police')}
              />
              <span>🚓 Police Stations</span>
              <span className="future-tag active-pill">Active</span>
            </label>

            <label className="layer-item">
              <input
                type="checkbox"
                checked={activeLayers.fire_station}
                onChange={() => toggleLayer('fire_station')}
              />
              <span>🚒 Fire Stations</span>
              <span className="future-tag active-pill">Active</span>
            </label>

            <div className="layers-sub-divider">Environmental Radar</div>

            <label className="layer-item future-layer">
              <input
                type="checkbox"
                checked={activeLayers.rainfall}
                onChange={() => toggleLayer('rainfall')}
              />
              <span>🌧️ Rainfall &amp; Precipitation Radar</span>
            </label>

            <label className="layer-item future-layer">
              <input
                type="checkbox"
                checked={activeLayers.weather}
                onChange={() => toggleLayer('weather')}
              />
              <span>⛅ Synoptic Weather Observations</span>
            </label>

            <label className="layer-item future-layer">
              <input
                type="checkbox"
                checked={activeLayers.lightning}
                onChange={() => toggleLayer('lightning')}
              />
              <span>⚡ Lightning Risk Forecast</span>
              <span className="future-tag">MOSDAC</span>
            </label>

            <label className="layer-item future-layer">
              <input
                type="checkbox"
                checked={activeLayers.cyclones}
                onChange={() => toggleLayer('cyclones')}
              />
              <span>🌀 Cyclone Satellite Tracking</span>
              <span className="future-tag">MOSDAC</span>
            </label>
          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="map-legend-box">
          <div className="legend-header">
            <h4 className="legend-title">Disaster &amp; Shelter Legend</h4>
            <button
              onClick={() => setShowLegend(false)}
              className="legend-close-btn"
              title="Close legend"
            >
              &times;
            </button>
          </div>
          <div className="legend-grid">
            <div className="legend-item"><span className="legend-symbol">⭐</span> Recommended Shelter</div>
            <div className="legend-item"><span className="legend-symbol">🏕️</span> Emergency Shelter</div>
            <div className="legend-item"><span className="legend-symbol">📍</span> Your Location</div>
            <div className="legend-item"><span className="legend-symbol">🏥</span> Hospital / Clinic</div>
            <div className="legend-item"><span className="legend-symbol">🚓</span> Police Station</div>
            <div className="legend-item"><span className="legend-symbol">🚒</span> Fire Station</div>
            <div className="legend-item"><span className="legend-symbol">🔴</span> Earthquake</div>
            <div className="legend-item"><span className="legend-symbol">🟠</span> Cyclone</div>
            <div className="legend-item"><span className="legend-symbol">🔵</span> Flood</div>
            <div className="legend-item"><span className="legend-symbol">🔥</span> Wildfire</div>
            <div className="legend-item"><span className="legend-symbol">🟣</span> Volcano</div>
            <div className="legend-item"><span className="legend-symbol">⛈️</span> Severe Storm</div>
          </div>
          <div className="legend-radius-note">
            <span className="radius-indicator"></span> Circle = Impact Radius &bull; Green = Open Shelter &bull; Gold = Recommended
          </div>
        </div>
      )}

      {!showLegend && (
        <button
          onClick={() => setShowLegend(true)}
          className="show-legend-btn"
          title="Show legend"
        >
          Legend
        </button>
      )}
    </div>
  );
};

export default DisasterMap;
