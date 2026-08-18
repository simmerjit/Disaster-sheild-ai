import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  MapPin,
  Users,
  Award,
  Lock,
  PlusCircle,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  X,
  Compass,
  Anchor,
  HeartPulse,
  Flame,
  Wind,
} from 'lucide-react';
import { loginRescueTeam, registerRescueTeam, fetchRescueTeams } from '../services/rescueApi';

const SPECIALIZATION_CONFIG = {
  general_sar: { label: 'General SAR & Evacuation', icon: Compass, color: '#38bdf8' },
  urban_search_rescue: { label: 'Urban Collapse SAR (USAR)', icon: ShieldAlert, color: '#f59e0b' },
  flood_water: { label: 'Flood & Marine Rescue', icon: Anchor, color: '#06b6d4' },
  medical_evac: { label: 'Trauma & Medical Evacuation', icon: HeartPulse, color: '#ec4899' },
  fire_hazmat: { label: 'Wildfire & Hazmat Containment', icon: Flame, color: '#f97316' },
  cyclone_storm: { label: 'Cyclone & Extreme Storm SAR', icon: Wind, color: '#a855f7' },
};

export const RescueLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('quick'); // 'quick', 'login', 'register'
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login form state
  const [teamCode, setTeamCode] = useState('');
  const [password, setPassword] = useState('rescue123');

  // Register form state
  const [regForm, setRegForm] = useState({
    teamName: '',
    teamCode: '',
    organization: 'National Disaster Response Force (NDRF)',
    specialization: 'urban_search_rescue',
    leaderName: '',
    contactPhone: '',
    email: '',
    capacityMembers: 12,
    address: 'Command Station, Field Sector',
    latitude: 28.6139,
    longitude: 77.209,
  });

  // Load standard units
  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const res = await fetchRescueTeams();
      if (res && res.data) {
        setAvailableTeams(res.data);
      }
    } catch (err) {
      console.warn('Could not load teams list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (team) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginRescueTeam({ teamCode: team.teamCode });
      if (res.success && res.team) {
        onLoginSuccess(res.team);
        onClose();
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to authenticate team.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    if (!teamCode.trim()) {
      setError('Please enter your Rescue Team Call Sign or Code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await loginRescueTeam({ teamCode: teamCode.trim().toUpperCase(), password });
      if (res.success && res.team) {
        onLoginSuccess(res.team);
        onClose();
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.teamName.trim()) {
      setError('Team name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...regForm,
        capacityMembers: Number(regForm.capacityMembers) || 10,
        location: {
          latitude: Number(regForm.latitude) || 28.6139,
          longitude: Number(regForm.longitude) || 77.209,
          address: regForm.address || 'Field Station',
        },
      };
      const res = await registerRescueTeam(payload);
      if (res.success && res.team) {
        onLoginSuccess(res.team);
        onClose();
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register unit.');
    } finally {
      setLoading(false);
    }
  };

  // Browser GPS Geolocation helper
  const detectCoordinates = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRegForm((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
            address: `GPS: ${pos.coords.latitude.toFixed(3)}°N, ${pos.coords.longitude.toFixed(3)}°E`,
          }));
        },
        (err) => {
          console.warn('Geolocation denied or failed:', err);
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rescue-modal-backdrop" onClick={onClose}>
      <div
        className="rescue-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="rescue-modal-header">
          <div className="rescue-brand-header">
            <div className="rescue-badge-icon">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="rescue-badge-tag">RESCUE COMMAND PORTAL</div>
              <h2 className="rescue-modal-title">Responder Authentication &amp; Dispatch</h2>
            </div>
          </div>
          <button className="rescue-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="rescue-tab-nav">
          <button
            className={`rescue-tab-btn ${activeTab === 'quick' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('quick');
              setError(null);
            }}
          >
            <Radio size={16} />
            <span>Quick-Deploy Units (1-Click)</span>
          </button>
          <button
            className={`rescue-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
          >
            <LogIn size={16} />
            <span>Call Sign Login</span>
          </button>
          <button
            className={`rescue-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
          >
            <PlusCircle size={16} />
            <span>Register New Unit</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="rescue-modal-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="rescue-modal-body">
          {/* TAB 1: QUICK DEPLOY PRESETS */}
          {activeTab === 'quick' && (
            <div className="quick-teams-container">
              <p className="quick-deploy-subtext">
                Select an authorized response taskforce to instantly access real-time location-based dispatch priorities:
              </p>

              {loading && availableTeams.length === 0 ? (
                <div className="rescue-loading-box">
                  <span className="rescue-spinner"></span>
                  <span>Loading official responder taskforces...</span>
                </div>
              ) : (
                <div className="quick-team-grid">
                  {availableTeams.map((team) => {
                    const spec = SPECIALIZATION_CONFIG[team.specialization] || SPECIALIZATION_CONFIG.general_sar;
                    const SpecIcon = spec.icon;
                    return (
                      <div
                        key={team._id || team.teamCode}
                        className="quick-team-card"
                        onClick={() => handleQuickLogin(team)}
                      >
                        <div className="quick-team-top">
                          <div
                            className="spec-icon-chip"
                            style={{ background: `${spec.color}22`, color: spec.color }}
                          >
                            <SpecIcon size={18} />
                          </div>
                          <span className="team-code-badge">{team.teamCode}</span>
                        </div>

                        <h4 className="quick-team-name">{team.teamName}</h4>
                        <p className="quick-team-org">{team.organization}</p>

                        <div className="quick-team-meta">
                          <div className="meta-pill">
                            <MapPin size={13} />
                            <span>{team.location?.address?.split(',')?.[0] || 'Field Station'}</span>
                          </div>
                          <div className="meta-pill">
                            <Users size={13} />
                            <span>{team.capacityMembers || 12} Operatives</span>
                          </div>
                        </div>

                        <div className="quick-team-footer">
                          <div className="team-stats-strip">
                            <span>🏆 {team.stats?.peopleRescued || 0} Rescued</span>
                            <span>🎯 {team.stats?.missionsCompleted || 0} Missions</span>
                          </div>
                          <button className="quick-deploy-action-btn">
                            <span>Launch Station</span>
                            <CheckCircle2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CALL SIGN LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleCustomLogin} className="rescue-form">
              <div className="form-group">
                <label className="form-label">
                  <Radio size={14} /> Team Call Sign / Code
                </label>
                <input
                  type="text"
                  className="form-input text-uppercase"
                  placeholder="e.g. NDRF-ALPHA-08 or SDRF-FLOOD-02"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  required
                />
                <span className="input-helper">
                  Use your team's assigned radio call sign or station identifier.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={14} /> Security Access Code / Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter responder passkey"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="input-helper">Default responder passkey: <code>rescue123</code></span>
              </div>

              <button type="submit" className="rescue-submit-btn" disabled={loading}>
                {loading ? <span className="rescue-spinner"></span> : <LogIn size={16} />}
                <span>Authorize &amp; Open Command Dashboard</span>
              </button>
            </form>
          )}

          {/* TAB 3: REGISTER NEW UNIT */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="rescue-form register-form-grid">
              <div className="form-group col-span-2">
                <label className="form-label">Unit / Taskforce Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Disaster Response Taskforce 4"
                  value={regForm.teamName}
                  onChange={(e) => setRegForm({ ...regForm, teamName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Call Sign / Code (Optional)</label>
                <input
                  type="text"
                  className="form-input text-uppercase"
                  placeholder="e.g. SAR-DELHI-99"
                  value={regForm.teamCode}
                  onChange={(e) => setRegForm({ ...regForm, teamCode: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Agency / Organization</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. NDRF, SDRF, Coast Guard, Red Cross"
                  value={regForm.organization}
                  onChange={(e) => setRegForm({ ...regForm, organization: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Specialization</label>
                <select
                  className="form-select"
                  value={regForm.specialization}
                  onChange={(e) => setRegForm({ ...regForm, specialization: e.target.value })}
                >
                  <option value="urban_search_rescue">Urban Search &amp; Collapse SAR (USAR)</option>
                  <option value="flood_water">Flood &amp; Swift Water Rescue</option>
                  <option value="medical_evac">Trauma &amp; Emergency Medical Evac</option>
                  <option value="cyclone_storm">Cyclone &amp; Extreme Storm SAR</option>
                  <option value="fire_hazmat">Wildfire &amp; Hazmat Containment</option>
                  <option value="general_sar">General Emergency SAR</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Active Operatives Count</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="100"
                  value={regForm.capacityMembers}
                  onChange={(e) => setRegForm({ ...regForm, capacityMembers: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Team Commander / Leader</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Officer Name"
                  value={regForm.leaderName}
                  onChange={(e) => setRegForm({ ...regForm, leaderName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 XXXXX XXXXX"
                  value={regForm.contactPhone}
                  onChange={(e) => setRegForm({ ...regForm, contactPhone: e.target.value })}
                />
              </div>

              <div className="form-group col-span-2">
                <div className="location-header-row">
                  <label className="form-label">Base Location &amp; Coordinates</label>
                  <button type="button" className="detect-gps-btn" onClick={detectCoordinates}>
                    <MapPin size={13} />
                    <span>Detect My Current GPS</span>
                  </button>
                </div>
                <div className="coord-inputs-row">
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    placeholder="Latitude"
                    value={regForm.latitude}
                    onChange={(e) => setRegForm({ ...regForm, latitude: e.target.value })}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    placeholder="Longitude"
                    value={regForm.longitude}
                    onChange={(e) => setRegForm({ ...regForm, longitude: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Base / Station address"
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="rescue-submit-btn col-span-2" disabled={loading}>
                {loading ? <span className="rescue-spinner"></span> : <PlusCircle size={16} />}
                <span>Register Responder Unit &amp; Enter Dashboard</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescueLoginModal;
