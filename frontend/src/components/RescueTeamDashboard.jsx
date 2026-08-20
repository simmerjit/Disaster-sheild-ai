import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Circle,
  Polyline,
} from '@react-google-maps/api';
import {
  ShieldAlert,
  Radio,
  MapPin,
  Users,
  Compass,
  AlertTriangle,
  Flame,
  Wind,
  Anchor,
  HeartPulse,
  Route,
  Navigation,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sliders,
  Award,
  Zap,
  Activity,
  Layers,
  PhoneCall,
  BellRing,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Crosshair,
  ArrowRight,
  ShieldCheck,
  LifeBuoy,
} from 'lucide-react';
import {
  fetchPrioritizedRescues,
  updateRescueTeamStatus,
  sendMissionAction,
  fetchAllSOS,
  createSOSAlert,
  updateSOSAlert,
} from '../services/rescueApi';
import { darkMapStyle } from '../utils/mapStyles';

const SPECIALIZATION_MAP = {
  general_sar: { label: 'General SAR', icon: Compass, color: '#38bdf8' },
  urban_search_rescue: { label: 'Urban Collapse (USAR)', icon: ShieldAlert, color: '#f59e0b' },
  flood_water: { label: 'Flood & Marine Rescue', icon: Anchor, color: '#06b6d4' },
  medical_evac: { label: 'Trauma & Medical Evac', icon: HeartPulse, color: '#ec4899' },
  fire_hazmat: { label: 'Wildfire & Hazmat', icon: Flame, color: '#f97316' },
  cyclone_storm: { label: 'Cyclone & Extreme Storm', icon: Wind, color: '#a855f7' },
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '16px',
};

export const RescueTeamDashboard = ({
  team,
  onUpdateTeam,
  onLogout,
  onSwitchToPublicMap,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const [missions, setMissions] = useState([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'critical', 'sos', 'specialist', 'near'
  const [maxRadius, setMaxRadius] = useState(5000); // in km
  const [selectedMission, setSelectedMission] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Map state
  const mapRef = useRef(null);
  const [mapCenter, setMapCenter] = useState({
    lat: team?.location?.latitude || 28.6139,
    lng: team?.location?.longitude || 77.209,
  });
  const [mapZoom, setMapZoom] = useState(6);

  // Status & Telemetry state
  const [currentStatus, setCurrentStatus] = useState(team?.status || 'available');
  const [teamLocation, setTeamLocation] = useState({
    latitude: team?.location?.latitude || 28.6139,
    longitude: team?.location?.longitude || 77.209,
    address: team?.location?.address || 'Command HQ',
  });
  const [isSyncingLocation, setIsSyncingLocation] = useState(false);
  const [activeActionLoading, setActiveActionLoading] = useState(false);

  // Rescued logger modal/prompt state
  const [rescueLogTarget, setRescueLogTarget] = useState(null);
  const [logRescuedCount, setLogRescuedCount] = useState(1);
  const [logInjuredCount, setLogInjuredCount] = useState(0);

  // SOS Creation dialog state
  const [showCreateSOSModal, setShowCreateSOSModal] = useState(false);
  const [newSOSForm, setNewSOSForm] = useState({
    message: '',
    senderName: '',
    senderPhone: '',
    peopleTrapped: 1,
    urgency: 'critical',
    emergencyType: 'general_distress',
    address: '',
    latitude: teamLocation.latitude,
    longitude: teamLocation.longitude,
  });

  // Fetch prioritized rescue targets
  const loadPrioritizedMissions = useCallback(async () => {
    setLoadingMissions(true);
    try {
      const res = await fetchPrioritizedRescues({
        latitude: teamLocation.latitude,
        longitude: teamLocation.longitude,
        specialization: team.specialization || 'general_sar',
        radius: maxRadius,
        teamId: team._id,
      });

      if (res && res.data) {
        setMissions(res.data);
      }
    } catch (err) {
      console.error('Failed to load prioritized missions:', err);
    } finally {
      setLoadingMissions(false);
    }
  }, [teamLocation.latitude, teamLocation.longitude, team.specialization, team._id, maxRadius]);

  useEffect(() => {
    loadPrioritizedMissions();
  }, [loadPrioritizedMissions]);

  // Operational status changer
  const handleStatusChange = async (newStatus) => {
    setCurrentStatus(newStatus);
    try {
      const res = await updateRescueTeamStatus(team._id, { status: newStatus });
      if (res.success && res.team) {
        onUpdateTeam(res.team);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Sync with device GPS
  const handleSyncDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsSyncingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newCoords = {
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          address: `Field GPS: ${pos.coords.latitude.toFixed(3)}°N, ${pos.coords.longitude.toFixed(3)}°E`,
        };
        setTeamLocation(newCoords);
        setMapCenter({ lat: newCoords.latitude, lng: newCoords.longitude });
        setMapZoom(9);
        try {
          const res = await updateRescueTeamStatus(team._id, { location: newCoords });
          if (res.success && res.team) {
            onUpdateTeam(res.team);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSyncingLocation(false);
        }
      },
      (err) => {
        console.warn('GPS sync error:', err.message);
        setIsSyncingLocation(false);
        alert('Could not acquire device GPS. Please check browser location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Mission dispatch action handler
  const handleExecuteMissionAction = async (target, action) => {
    setActiveActionLoading(true);
    try {
      const res = await sendMissionAction({
        teamId: team._id,
        targetId: target.targetId,
        action,
        title: target.title,
        latitude: target.latitude,
        longitude: target.longitude,
        address: target.address,
      });

      if (res.success && res.team) {
        onUpdateTeam(res.team);
        if (action === 'accept_mission') {
          setCurrentStatus('en_route');
        } else if (action === 'on_scene') {
          setCurrentStatus('on_scene');
        }
      }
      // Reload missions
      loadPrioritizedMissions();
    } catch (err) {
      console.error('Failed to dispatch action:', err);
    } finally {
      setActiveActionLoading(false);
    }
  };

  // Complete mission & log rescues
  const handleCompleteMissionWithCount = async () => {
    if (!rescueLogTarget) return;
    setActiveActionLoading(true);
    try {
      const res = await sendMissionAction({
        teamId: team._id,
        targetId: rescueLogTarget.targetId,
        action: 'complete_mission',
        rescuedCount: Number(logRescuedCount) || 0,
        injuredCount: Number(logInjuredCount) || 0,
      });

      if (res.success && res.team) {
        onUpdateTeam(res.team);
        setCurrentStatus('available');
      }
      setRescueLogTarget(null);
      setLogRescuedCount(1);
      setLogInjuredCount(0);
      loadPrioritizedMissions();
    } catch (err) {
      console.error('Failed to record completed mission:', err);
    } finally {
      setActiveActionLoading(false);
    }
  };

  // SOS Creation handler
  const handleCreateSOS = async (e) => {
    e.preventDefault();
    if (!newSOSForm.message.trim()) return;
    try {
      await createSOSAlert({
        ...newSOSForm,
        latitude: Number(newSOSForm.latitude) || teamLocation.latitude,
        longitude: Number(newSOSForm.longitude) || teamLocation.longitude,
      });
      setShowCreateSOSModal(false);
      setNewSOSForm({
        message: '',
        senderName: '',
        senderPhone: '',
        peopleTrapped: 1,
        urgency: 'critical',
        emergencyType: 'general_distress',
        address: '',
        latitude: teamLocation.latitude,
        longitude: teamLocation.longitude,
      });
      loadPrioritizedMissions();
    } catch (err) {
      console.error('Failed to create SOS:', err);
    }
  };

  // Focus mission on map
  const handleFocusMission = (m) => {
    setSelectedMission(m);
    setMapCenter({ lat: m.latitude, lng: m.longitude });
    setMapZoom(9);
  };

  // Client-side filtering of missions
  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      if (filterTab === 'critical') return m.priorityTier === 'CRITICAL' || m.priorityScore >= 80;
      if (filterTab === 'sos') return m.type === 'sos_distress';
      if (filterTab === 'near') return m.distanceKm <= 75;
      if (filterTab === 'specialist') {
        const spec = team.specialization || '';
        const titleLower = (m.title + ' ' + (m.disasterType || '') + ' ' + (m.emergencyType || '')).toLowerCase();
        if (spec === 'flood_water') return titleLower.includes('flood') || titleLower.includes('water') || titleLower.includes('cyclone');
        if (spec === 'urban_search_rescue') return titleLower.includes('collapse') || titleLower.includes('earthquake') || titleLower.includes('landslide');
        if (spec === 'medical_evac') return titleLower.includes('medical') || m.urgency === 'critical';
        if (spec === 'fire_hazmat') return titleLower.includes('fire') || titleLower.includes('hazmat');
        if (spec === 'cyclone_storm') return titleLower.includes('storm') || titleLower.includes('cyclone');
        return true;
      }
      return true;
    });
  }, [missions, filterTab, team.specialization]);

  const specInfo = SPECIALIZATION_MAP[team.specialization] || SPECIALIZATION_MAP.general_sar;
  const SpecIcon = specInfo.icon;

  // Active mission matching
  const isTargetCurrentMission = (targetId) => {
    return team.currentMission?.disasterId === targetId;
  };

  return (
    <div className="rescue-dashboard-container">
      {/* ── TOP TELEMETRY HUD HEADER ──────────────────────────── */}
      <header className="rescue-hud-header">
        {/* Brand & Team ID */}
        <div className="hud-team-profile">
          <div className="hud-spec-avatar" style={{ background: `${specInfo.color}22`, color: specInfo.color }}>
            <SpecIcon size={24} />
          </div>
          <div>
            <div className="hud-code-row">
              <span className="hud-code-badge">{team.teamCode}</span>
              <span className="hud-spec-name">{specInfo.label}</span>
            </div>
            <h2 className="hud-team-title">{team.teamName}</h2>
            <div className="hud-submeta">
              <span>{team.organization}</span>
              <span>&bull;</span>
              <span>Commander: {team.leaderName || 'Officer in Charge'}</span>
              <span>&bull;</span>
              <span>{team.capacityMembers || 12} Responders</span>
            </div>
          </div>
        </div>

        {/* Live GPS Coordinates & Location Controller */}
        <div className="hud-location-card">
          <div className="hud-card-header">
            <MapPin size={14} className="text-cyan" />
            <span className="hud-card-title">TEAM BASE / GPS LOCATION</span>
            <button
              onClick={handleSyncDeviceLocation}
              className={`hud-gps-sync-btn ${isSyncingLocation ? 'spinning' : ''}`}
              title="Sync with current Device GPS"
            >
              <Crosshair size={13} />
              <span>{isSyncingLocation ? 'Acquiring...' : 'Sync GPS'}</span>
            </button>
          </div>
          <div className="hud-coords-value">
            {teamLocation.latitude.toFixed(4)}°N, {teamLocation.longitude.toFixed(4)}°E
          </div>
          <div className="hud-location-subtext">{teamLocation.address}</div>
        </div>

        {/* Operational Status Selector */}
        <div className="hud-status-selector-card">
          <div className="hud-card-header">
            <Activity size={14} className="text-emerald" />
            <span className="hud-card-title">OPERATIONAL STATUS</span>
          </div>
          <div className="status-button-group">
            <button
              className={`status-btn available ${currentStatus === 'available' ? 'active' : ''}`}
              onClick={() => handleStatusChange('available')}
            >
              <span className="status-dot green"></span>
              <span>Available</span>
            </button>
            <button
              className={`status-btn en_route ${currentStatus === 'en_route' ? 'active' : ''}`}
              onClick={() => handleStatusChange('en_route')}
            >
              <span className="status-dot yellow"></span>
              <span>En Route</span>
            </button>
            <button
              className={`status-btn on_scene ${currentStatus === 'on_scene' ? 'active' : ''}`}
              onClick={() => handleStatusChange('on_scene')}
            >
              <span className="status-dot red"></span>
              <span>On Scene</span>
            </button>
            <button
              className={`status-btn standby ${currentStatus === 'standby' ? 'active' : ''}`}
              onClick={() => handleStatusChange('standby')}
            >
              <span className="status-dot gray"></span>
              <span>Standby</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="hud-global-controls">
          <button
            onClick={() => setShowCreateSOSModal(true)}
            className="hud-action-btn sos-broadcast-btn"
            title="Dispatch / Broadcast Citizen Emergency SOS"
          >
            <BellRing size={15} />
            <span>Broadcast SOS</span>
          </button>

          <button
            onClick={onSwitchToPublicMap}
            className="hud-action-btn secondary"
            title="Return to Public Global Live Map"
          >
            <Layers size={15} />
            <span>Public Map</span>
          </button>

          <button
            onClick={onLogout}
            className="hud-action-btn logout"
            title="Sign out / Switch Rescue Team"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── STATS & RADAR TELEMETRY BAR ────────────────────────── */}
      <div className="rescue-telemetry-ribbon">
        <div className="telemetry-stat-cell">
          <Award size={18} className="text-amber" />
          <div>
            <div className="telemetry-value">{team.stats?.peopleRescued || 0}</div>
            <div className="telemetry-label">Citizens Rescued</div>
          </div>
        </div>

        <div className="telemetry-stat-cell">
          <CheckCircle2 size={18} className="text-emerald" />
          <div>
            <div className="telemetry-value">{team.stats?.missionsCompleted || 0}</div>
            <div className="telemetry-label">Missions Completed</div>
          </div>
        </div>

        <div className="telemetry-stat-cell">
          <HeartPulse size={18} className="text-pink" />
          <div>
            <div className="telemetry-value">{team.stats?.casualtiesTreated || 0}</div>
            <div className="telemetry-label">Casualties Treated</div>
          </div>
        </div>

        <div className="telemetry-stat-cell highlight">
          <Zap size={18} className="text-cyan" />
          <div>
            <div className="telemetry-value">
              {missions.filter((m) => m.priorityTier === 'CRITICAL').length}
            </div>
            <div className="telemetry-label">Critical Priority Zones in Sector</div>
          </div>
        </div>

        {team.currentMission && (
          <div className="active-mission-banner">
            <span className="live-pulse-dot"></span>
            <div className="mission-text-box">
              <span className="mission-sub">ACTIVE MISSION:</span>
              <span className="mission-title">{team.currentMission.title}</span>
            </div>
            <button
              onClick={() => {
                setRescueLogTarget({ targetId: team.currentMission.disasterId, title: team.currentMission.title });
              }}
              className="quick-complete-mission-btn"
            >
              <span>Record Rescues &amp; Close</span>
              <CheckCircle2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN WORKSPACE: SPLIT SCREEN (PRIORITY LIST + TACTICAL MAP) ── */}
      <div className="rescue-main-split">
        {/* LEFT COLUMN: LOCATION-BASED RESCUE PRIORITY QUEUE */}
        <div className="priority-queue-pane">
          {/* Controls & Filter Tabs */}
          <div className="queue-header-area">
            <div className="queue-title-row">
              <div className="queue-title-brand">
                <ShieldAlert size={18} className="text-red" />
                <h3>LOCATION-BASED RESCUE DISPATCH QUEUE</h3>
              </div>
              <button
                onClick={loadPrioritizedMissions}
                className="queue-refresh-btn"
                title="Recalculate Priorities"
              >
                <RefreshCw size={14} className={loadingMissions ? 'spin-icon' : ''} />
                <span>Refresh Matrix</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="queue-tab-bar">
              <button
                className={`queue-filter-tab ${filterTab === 'all' ? 'active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All Targets ({missions.length})
              </button>
              <button
                className={`queue-filter-tab critical ${filterTab === 'critical' ? 'active' : ''}`}
                onClick={() => setFilterTab('critical')}
              >
                🚨 Critical Priority ({missions.filter((m) => m.priorityTier === 'CRITICAL').length})
              </button>
              <button
                className={`queue-filter-tab sos ${filterTab === 'sos' ? 'active' : ''}`}
                onClick={() => setFilterTab('sos')}
              >
                🆘 Active SOS ({missions.filter((m) => m.type === 'sos_distress').length})
              </button>
              <button
                className={`queue-filter-tab specialist ${filterTab === 'specialist' ? 'active' : ''}`}
                onClick={() => setFilterTab('specialist')}
              >
                🌊 Specialization Match
              </button>
              <button
                className={`queue-filter-tab ${filterTab === 'near' ? 'active' : ''}`}
                onClick={() => setFilterTab('near')}
              >
                📍 &lt; 75 km
              </button>
            </div>
          </div>

          {/* Mission Target Cards List */}
          <div className="queue-cards-scroll">
            {loadingMissions ? (
              <div className="queue-loading-state">
                <span className="rescue-spinner"></span>
                <p>Calculating multi-factor rescue priority vectors based on team location...</p>
              </div>
            ) : filteredMissions.length === 0 ? (
              <div className="queue-empty-state">
                <ShieldCheck size={36} className="text-emerald" />
                <h4>No Emergency Incidents Matching Filters</h4>
                <p>Your team sector is currently stable or within safe parameters.</p>
              </div>
            ) : (
              filteredMissions.map((m, index) => {
                const isSelected = selectedMission?.targetId === m.targetId;
                const isExpanded = expandedCardId === m.targetId;
                const isCurrentMission = isTargetCurrentMission(m.targetId);

                // Priority Badge Class
                const tierClass =
                  m.priorityTier === 'CRITICAL'
                    ? 'tier-critical'
                    : m.priorityTier === 'HIGH'
                    ? 'tier-high'
                    : 'tier-medium';

                return (
                  <div
                    key={m.targetId || index}
                    className={`mission-priority-card ${tierClass} ${isSelected ? 'selected' : ''} ${
                      isCurrentMission ? 'active-mission-highlight' : ''
                    }`}
                    onClick={() => handleFocusMission(m)}
                  >
                    {/* Card Top Strip */}
                    <div className="mission-card-top">
                      <div className="mission-rank-badge">
                        <span className="rank-hash">#{index + 1}</span>
                        <span className={`priority-pill ${tierClass}`}>
                          {m.priorityTier} PRIORITY &bull; {m.priorityScore}/100
                        </span>
                      </div>

                      <div className="mission-dist-badge">
                        <Route size={13} />
                        <span>{m.distanceKm != null ? `${m.distanceKm} km away` : 'Proximity Calculated'}</span>
                      </div>
                    </div>

                    {/* Mission Header */}
                    <div className="mission-header-info">
                      <h4 className="mission-card-title">{m.title}</h4>
                      <div className="mission-card-loc">
                        <MapPin size={13} />
                        <span>{m.address}</span>
                      </div>
                    </div>

                    <p className="mission-card-desc">{m.description}</p>

                    {/* Action Recommendation Banner */}
                    <div className="mission-recommendation-box">
                      <Zap size={14} className="rec-icon" />
                      <div>
                        <strong>Recommended Protocol:</strong> {m.actionRecommendation}
                      </div>
                    </div>

                    {/* Expandable Score Breakdown */}
                    <div className="score-breakdown-wrapper">
                      <button
                        className="score-breakdown-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCardId(isExpanded ? null : m.targetId);
                        }}
                      >
                        <span>Priority Algorithm Factors ({m.scoreBreakdown?.length || 0})</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isExpanded && (
                        <div className="score-breakdown-list" onClick={(e) => e.stopPropagation()}>
                          {m.scoreBreakdown?.map((factor, fIdx) => (
                            <div key={fIdx} className="factor-item">
                              <span className="factor-dot"></span>
                              <span>{factor}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Footer Buttons */}
                    <div className="mission-card-actions" onClick={(e) => e.stopPropagation()}>
                      {!isCurrentMission ? (
                        <button
                          onClick={() => handleExecuteMissionAction(m, 'accept_mission')}
                          className="dispatch-action-btn primary"
                          disabled={activeActionLoading}
                        >
                          <LifeBuoy size={14} />
                          <span>Accept &amp; Dispatch Team</span>
                        </button>
                      ) : (
                        <div className="active-mission-controls-row">
                          <button
                            onClick={() => handleExecuteMissionAction(m, 'on_scene')}
                            className="dispatch-action-btn on-scene"
                            disabled={activeActionLoading}
                          >
                            <CheckCircle2 size={14} />
                            <span>Mark On Scene</span>
                          </button>
                          <button
                            onClick={() => setRescueLogTarget(m)}
                            className="dispatch-action-btn complete"
                            disabled={activeActionLoading}
                          >
                            <Award size={14} />
                            <span>Evac Complete / Log</span>
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => handleFocusMission(m)}
                        className="dispatch-action-btn secondary"
                      >
                        <Navigation size={14} />
                        <span>Map Focus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TACTICAL RESCUE MAP */}
        <div className="tactical-map-pane">
          <div className="tactical-map-overlay-hud">
            <div className="map-hud-chip">
              <span className="radar-blip"></span>
              <span>LIVE TACTICAL RESCUE RADAR</span>
            </div>
            <div className="map-hud-range">
              <span>RINGS: 15km / 50km / 150km</span>
            </div>
          </div>

          {!isLoaded ? (
            <div className="map-loading-overlay">
              <div className="loading-box">
                <span className="rescue-spinner"></span>
                <p>Initializing tactical satellite radar coordinates...</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={mapZoom}
              options={{
                styles: darkMapStyle,
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
              onLoad={(map) => {
                mapRef.current = map;
              }}
            >
              {/* Team Current Base / Responder Location Marker */}
              <Marker
                position={{ lat: teamLocation.latitude, lng: teamLocation.longitude }}
                title={`RESPONDER BASE: ${team.teamName}`}
              />

            {/* Radar Range Rings around Responder Team */}
            <Circle
              center={{ lat: teamLocation.latitude, lng: teamLocation.longitude }}
              radius={15000} // 15 km immediate zone
              options={{
                strokeColor: '#38bdf8',
                strokeOpacity: 0.8,
                strokeWeight: 1.5,
                fillColor: '#38bdf8',
                fillOpacity: 0.06,
                clickable: false,
              }}
            />
            <Circle
              center={{ lat: teamLocation.latitude, lng: teamLocation.longitude }}
              radius={50000} // 50 km sector zone
              options={{
                strokeColor: '#f59e0b',
                strokeOpacity: 0.5,
                strokeWeight: 1,
                fillColor: '#f59e0b',
                fillOpacity: 0.03,
                clickable: false,
              }}
            />

            {/* Prioritized Target Markers */}
            {filteredMissions.map((m) => {
              const isSelected = selectedMission?.targetId === m.targetId;
              const isCritical = m.priorityTier === 'CRITICAL';
              const isSOS = m.type === 'sos_distress';

              const color = isSOS ? '#ef4444' : isCritical ? '#dc2626' : m.priorityTier === 'HIGH' ? '#f97316' : '#eab308';

              return (
                <Marker
                  key={m.targetId}
                  position={{ lat: m.latitude, lng: m.longitude }}
                  title={`${m.title} [Priority ${m.priorityScore}]`}
                  onClick={() => setSelectedMission(m)}
                  icon={{
                    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                    scale: isSelected ? 12 : 8,
                    fillColor: color,
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: isSelected ? 3 : 1.5,
                  }}
                />
              );
            })}

            {/* Polyline Route Line from Team to Selected Target */}
            {selectedMission && (
              <Polyline
                path={[
                  { lat: teamLocation.latitude, lng: teamLocation.longitude },
                  { lat: selectedMission.latitude, lng: selectedMission.longitude },
                ]}
                options={{
                  strokeColor: '#38bdf8',
                  strokeOpacity: 0.9,
                  strokeWeight: 3,
                  icons: [
                    {
                      icon: { path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW || 1 },
                      offset: '100%',
                    },
                  ],
                }}
              />
            )}

            {/* Info Window for Selected Mission */}
            {selectedMission && (
              <InfoWindow
                position={{ lat: selectedMission.latitude, lng: selectedMission.longitude }}
                onCloseClick={() => setSelectedMission(null)}
              >
                <div className="tactical-info-window">
                  <div className="info-window-top">
                    <span className="info-priority-badge">{selectedMission.priorityTier}</span>
                    <span className="info-dist-badge">{selectedMission.distanceKm} km away</span>
                  </div>
                  <h4 className="info-title">{selectedMission.title}</h4>
                  <p className="info-address">{selectedMission.address}</p>
                  <p className="info-desc">{selectedMission.description}</p>
                  <div className="info-rec">
                    <strong>Protocol:</strong> {selectedMission.actionRecommendation}
                  </div>
                  <button
                    onClick={() => handleExecuteMissionAction(selectedMission, 'accept_mission')}
                    className="info-dispatch-btn"
                  >
                    <span>Accept &amp; Deploy Unit</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
          )}
        </div>
      </div>

      {/* ── MODAL: RECORD RESCUES & COMPLETE MISSION DIALOG ───── */}
      {rescueLogTarget && (
        <div className="rescue-modal-backdrop" onClick={() => setRescueLogTarget(null)}>
          <div className="rescue-modal-card log-rescue-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rescue-modal-header">
              <div className="rescue-brand-header">
                <div className="rescue-badge-icon" style={{ background: '#10b98122', color: '#10b981' }}>
                  <Award size={24} />
                </div>
                <div>
                  <div className="rescue-badge-tag text-emerald">MISSION DEBRIEF &amp; CASUALTY LOG</div>
                  <h3 className="rescue-modal-title">Record Rescued Civilians</h3>
                </div>
              </div>
            </div>

            <div className="rescue-modal-body">
              <p className="log-rescue-sub">
                Target: <strong>{rescueLogTarget.title}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Number of People Successfully Rescued</label>
                <div className="quick-counter-row">
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={logRescuedCount}
                    onChange={(e) => setLogRescuedCount(e.target.value)}
                  />
                  <button type="button" className="counter-chip" onClick={() => setLogRescuedCount((c) => Number(c) + 1)}>
                    +1
                  </button>
                  <button type="button" className="counter-chip" onClick={() => setLogRescuedCount((c) => Number(c) + 5)}>
                    +5
                  </button>
                  <button type="button" className="counter-chip" onClick={() => setLogRescuedCount((c) => Number(c) + 10)}>
                    +10
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Casualties / Injured Administered Medical First Aid</label>
                <div className="quick-counter-row">
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={logInjuredCount}
                    onChange={(e) => setLogInjuredCount(e.target.value)}
                  />
                  <button type="button" className="counter-chip" onClick={() => setLogInjuredCount((c) => Number(c) + 1)}>
                    +1
                  </button>
                  <button type="button" className="counter-chip" onClick={() => setLogInjuredCount((c) => Number(c) + 5)}>
                    +5
                  </button>
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="dispatch-action-btn secondary"
                  onClick={() => setRescueLogTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dispatch-action-btn primary"
                  onClick={handleCompleteMissionWithCount}
                  disabled={activeActionLoading}
                >
                  <CheckCircle2 size={16} />
                  <span>Save Log &amp; Conclude Mission</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: BROADCAST CITIZEN EMERGENCY SOS ────────────── */}
      {showCreateSOSModal && (
        <div className="rescue-modal-backdrop" onClick={() => setShowCreateSOSModal(false)}>
          <div className="rescue-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rescue-modal-header">
              <div className="rescue-brand-header">
                <div className="rescue-badge-icon" style={{ background: '#ef444422', color: '#ef4444' }}>
                  <BellRing size={24} />
                </div>
                <div>
                  <div className="rescue-badge-tag text-red">EMERGENCY DISTRESS BEACON</div>
                  <h3 className="rescue-modal-title">Broadcast Citizen SOS Alert</h3>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateSOS} className="rescue-modal-body rescue-form">
              <div className="form-group">
                <label className="form-label">SOS Distress Description *</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Describe emergency, people trapped, rising water, fire, or collapse..."
                  value={newSOSForm.message}
                  onChange={(e) => setNewSOSForm({ ...newSOSForm, message: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Caller / Contact Person</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Citizen Name"
                  value={newSOSForm.senderName}
                  onChange={(e) => setNewSOSForm({ ...newSOSForm, senderName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 XXXXX XXXXX"
                  value={newSOSForm.senderPhone}
                  onChange={(e) => setNewSOSForm({ ...newSOSForm, senderPhone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">People Trapped / At Immediate Risk</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="100"
                  value={newSOSForm.peopleTrapped}
                  onChange={(e) => setNewSOSForm({ ...newSOSForm, peopleTrapped: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Urgency Level</label>
                <select
                  className="form-select"
                  value={newSOSForm.urgency}
                  onChange={(e) => setNewSOSForm({ ...newSOSForm, urgency: e.target.value })}
                >
                  <option value="critical">🔴 Critical (Life-Threatening / Immediate)</option>
                  <option value="high">🟠 High (Severe Danger)</option>
                  <option value="medium">🟡 Medium (Urgent Evac)</option>
                  <option value="low">🟢 Low (Standby)</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="dispatch-action-btn secondary"
                  onClick={() => setShowCreateSOSModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="dispatch-action-btn primary">
                  <BellRing size={16} />
                  <span>Broadcast SOS to Rescue Network</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RescueTeamDashboard;
