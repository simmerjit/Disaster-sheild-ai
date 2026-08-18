import React, { useState } from 'react';
import {
  ShieldAlert,
  Radio,
  MapPin,
  Users,
  Lock,
  Mail,
  User,
  Phone,
  Compass,
  Anchor,
  HeartPulse,
  Flame,
  Wind,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  UserPlus,
  Zap,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

const QUICK_PRESETS = [
  {
    teamName: 'NDRF 8th Bn - Alpha SAR Taskforce',
    teamCode: 'NDRF-ALPHA-08',
    email: 'ndrf.alpha8@gov.in',
    organization: 'National Disaster Response Force (NDRF)',
    specialization: 'urban_search_rescue',
    role: 'rescue_worker',
    icon: ShieldAlert,
    color: '#f59e0b',
    desc: 'Urban search & rescue, acoustic life detection, heavy extraction.',
  },
  {
    teamName: 'SDRF Coastal & Marine Flood Rescue',
    teamCode: 'SDRF-FLOOD-02',
    email: 'sdrf.coastal@kerala.gov.in',
    organization: 'State Disaster Response Force (SDRF)',
    specialization: 'flood_water',
    role: 'rescue_worker',
    icon: Anchor,
    color: '#06b6d4',
    desc: 'Swift-water evacuation, inflatable craft, marine sonar search.',
  },
  {
    teamName: 'Rapid Medical Evac & Trauma Response',
    teamCode: 'MED-EVAC-01',
    email: 'med.sar.delhi@emergency.org',
    organization: 'Disaster Health Response Network',
    specialization: 'medical_evac',
    role: 'rescue_worker',
    icon: HeartPulse,
    color: '#ec4899',
    desc: 'Mobile ICU, trauma stabilization, critical emergency triage.',
  },
  {
    teamName: 'Eastern Cyclone & Storm Strike Unit',
    teamCode: 'NDRF-CYCLONE-03',
    email: 'cyclone.strike@ndrf.gov.in',
    organization: 'National Disaster Response Force (NDRF)',
    specialization: 'cyclone_storm',
    role: 'rescue_worker',
    icon: Wind,
    color: '#a855f7',
    desc: 'Heavy dewatering, road clearance, structural evacuation.',
  },
];

export const AuthPortal = ({ onLoginSuccess }) => {
  const { login, registerOrSync } = useAuthContext();
  const [activeTab, setActiveTab] = useState('login'); // 'login' (first) | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login form state
  const [loginEmailOrCode, setLoginEmailOrCode] = useState('');
  const [loginPassword, setLoginPassword] = useState('rescue123');

  // Registration form state
  const [regRole, setRegRole] = useState('rescue_worker'); // 'rescue_worker', 'coordinator', 'citizen'
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: 'secure123Password',
    role: 'rescue_worker',
    organization: 'National Disaster Response Force (NDRF)',
    specialization: 'urban_search_rescue',
    teamCode: '',
    phoneNumber: '',
    address: 'Command Center, New Delhi',
    latitude: 28.6139,
    longitude: 77.209,
  });

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmailOrCode.trim()) {
      setError('Please enter your Email, Team Call Sign, or Identifier.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await login(loginEmailOrCode.trim(), loginPassword);
      if (data?.success) {
        if (onLoginSuccess) onLoginSuccess(data.user, data.rescueTeam);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Login
  const handleQuickPresetLogin = async (preset) => {
    setLoading(true);
    setError(null);
    try {
      const data = await login(preset.teamCode, 'rescue123');
      if (data?.success) {
        if (onLoginSuccess) onLoginSuccess(data.user, data.rescueTeam);
      }
    } catch (err) {
      // Fallback: register the preset on-the-fly
      try {
        const regData = await registerOrSync({
          name: preset.teamName,
          email: preset.email,
          role: preset.role,
          organization: preset.organization,
          specialization: preset.specialization,
          teamCode: preset.teamCode,
          location: { latitude: 28.6139, longitude: 77.209, address: 'Command Post' },
        });
        if (regData?.success) {
          if (onLoginSuccess) onLoginSuccess(regData.user, regData.rescueTeam);
        }
      } catch (e2) {
        setError(e2.message || 'Failed to authenticate preset.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Citizen Observer Login
  const handleCitizenQuickLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerOrSync({
        name: 'Citizen Observer',
        email: `citizen_${Date.now()}@disastershield.org`,
        role: 'citizen',
        organization: 'Public Network',
        location: { latitude: 28.6139, longitude: 77.209, address: 'New Delhi, India' },
      });
      if (data?.success) {
        if (onLoginSuccess) onLoginSuccess(data.user, null);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in as guest.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name.trim() || !regForm.email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...regForm,
        role: regRole,
        location: {
          latitude: Number(regForm.latitude) || 28.6139,
          longitude: Number(regForm.longitude) || 77.209,
          address: regForm.address || 'Field Headquarters',
        },
      };

      const data = await registerOrSync(payload);
      if (data?.success) {
        if (onLoginSuccess) onLoginSuccess(data.user, data.rescueTeam);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Detect GPS Location
  const handleDetectGPS = () => {
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
          console.warn('GPS error:', err);
        }
      );
    }
  };

  return (
    <div className="auth-portal-backdrop">
      {/* Animated background elements */}
      <div className="auth-bg-aurora" aria-hidden="true">
        <div className="aurora-orb aurora-orb-1"></div>
        <div className="aurora-orb aurora-orb-2"></div>
        <div className="aurora-orb aurora-orb-3"></div>
      </div>
      <div className="auth-bg-grid" aria-hidden="true"></div>

      <div className="auth-portal-card">
        {/* Top Branding Banner */}
        <div className="auth-brand-strip">
          <div className="brand-logo-cluster">
            <div className="brand-shield-glow">
              <ShieldAlert size={32} className="text-red" />
            </div>
            <div>
              <div className="auth-portal-tag">DISASTERSHIELD AI SECURE GATEWAY</div>
              <h1 className="auth-portal-title">Disaster Shield Command Network</h1>
            </div>
          </div>
          <p className="auth-portal-subtext">
            Official Emergency Response &bull; GDACS/USGS/ISRO Live Telemetry &bull; Rescuer Priority Dispatch
          </p>
        </div>

        {/* Auth Mode Tabs (Sign In FIRST) */}
        <div className="auth-portal-tabs">
          <button
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
          >
            <LogIn size={16} />
            <span>Sign In (First)</span>
          </button>
          <button
            className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
          >
            <UserPlus size={16} />
            <span>Create New Account / Register Unit</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="auth-error-chip">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ── TAB 1: SIGN IN (FIRST) ─────────────────────────── */}
        {activeTab === 'login' && (
          <div className="auth-tab-content">
            {/* Quick 1-Click Responder Taskforces */}
            <div className="quick-deploy-section">
              <div className="section-label-row">
                <Zap size={14} className="text-cyan" />
                <span className="section-label">1-CLICK QUICK ACCESS (FIELD RESPONDERS)</span>
              </div>
              <div className="quick-presets-grid">
                {QUICK_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <div
                      key={preset.teamCode}
                      className="preset-team-card"
                      onClick={() => handleQuickPresetLogin(preset)}
                    >
                      <div className="preset-top-row">
                        <div
                          className="preset-icon-box"
                          style={{ background: `${preset.color}22`, color: preset.color }}
                        >
                          <Icon size={18} />
                        </div>
                        <span className="preset-code">{preset.teamCode}</span>
                      </div>
                      <h4 className="preset-name">{preset.teamName}</h4>
                      <p className="preset-desc">{preset.desc}</p>
                      <div className="preset-action">
                        <span>Deploy Command Station</span>
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="auth-divider">
              <span>OR SIGN IN WITH CREDENTIALS</span>
            </div>

            {/* Custom Login Form */}
            <form onSubmit={handleLoginSubmit} className="auth-login-form">
              <div className="form-group">
                <label className="form-label">
                  <Mail size={14} /> Email Address or Team Radio Call Sign
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. NDRF-ALPHA-08 or rescuer@emergency.gov.in"
                  value={loginEmailOrCode}
                  onChange={(e) => setLoginEmailOrCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={14} /> Security Passkey / Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter responder passkey"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <div className="login-actions-column">
                <button type="submit" className="auth-submit-btn primary" disabled={loading}>
                  {loading ? <span className="rescue-spinner"></span> : <LogIn size={16} />}
                  <span>Sign In to DisasterShield Network</span>
                </button>

                <div className="auth-switch-helper">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    className="switch-tab-link"
                    onClick={() => {
                      setActiveTab('register');
                      setError(null);
                    }}
                  >
                    Register as Citizen, Coordinator, or Rescue Unit
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Citizen Access */}
            <div className="auth-divider">
              <span>OR EXPLORE AS A CITIZEN</span>
            </div>

            <button
              type="button"
              className="auth-submit-btn citizen-quick-btn"
              onClick={handleCitizenQuickLogin}
              disabled={loading}
            >
              {loading ? <span className="rescue-spinner"></span> : <Shield size={16} />}
              <span>Continue as Citizen Observer</span>
              <ArrowRight size={14} className="citizen-arrow" />
            </button>
            <p className="citizen-helper-text">
              Access live disaster map, weather, shelters &amp; AI assistant — no account needed
            </p>
          </div>
        )}

        {/* ── TAB 2: REGISTER NEW ACCOUNT / UNIT ──────────────── */}
        {activeTab === 'register' && (
          <div className="auth-tab-content">
            <form onSubmit={handleRegisterSubmit} className="auth-register-form">
              {/* Role Selection */}
              <div className="form-group col-span-2">
                <label className="form-label">Select Account Type / Operational Role</label>
                <div className="role-selector-cards">
                  <div
                    className={`role-card ${regRole === 'rescue_worker' ? 'selected' : ''}`}
                    onClick={() => {
                      setRegRole('rescue_worker');
                      setRegForm((p) => ({ ...p, role: 'rescue_worker', organization: 'National Disaster Response Force (NDRF)' }));
                    }}
                  >
                    <ShieldAlert size={20} className="role-icon text-red" />
                    <div>
                      <div className="role-title">Rescue Responder Taskforce</div>
                      <div className="role-sub">Access priority dispatch, live tactical map, and SOS triage</div>
                    </div>
                  </div>

                  <div
                    className={`role-card ${regRole === 'coordinator' ? 'selected' : ''}`}
                    onClick={() => {
                      setRegRole('coordinator');
                      setRegForm((p) => ({ ...p, role: 'coordinator', organization: 'State Disaster Management Authority' }));
                    }}
                  >
                    <Compass size={20} className="role-icon text-cyan" />
                    <div>
                      <div className="role-title">Disaster Coordinator</div>
                      <div className="role-sub">Monitor regional emergency logistics &amp; shelters</div>
                    </div>
                  </div>

                  <div
                    className={`role-card ${regRole === 'citizen' ? 'selected' : ''}`}
                    onClick={() => {
                      setRegRole('citizen');
                      setRegForm((p) => ({ ...p, role: 'citizen', organization: 'General Public' }));
                    }}
                  >
                    <User size={20} className="role-icon text-emerald" />
                    <div>
                      <div className="role-title">Citizen / Volunteer</div>
                      <div className="role-sub">Early warning alerts, live weather &amp; evacuation tools</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Details */}
              <div className="form-group">
                <label className="form-label">
                  <User size={14} /> Full Name / Officer In Charge *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Commander Vikram Singh"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={14} /> Official Email Address *
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. v.singh@ndrf.gov.in"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  required
                />
              </div>

              {regRole === 'rescue_worker' && (
                <>
                  <div className="form-group">
                    <label className="form-label">
                      <Radio size={14} /> Unit Call Sign / Identifier
                    </label>
                    <input
                      type="text"
                      className="form-input text-uppercase"
                      placeholder="e.g. SAR-NORTH-04"
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
                    <label className="form-label">Rescue Specialization</label>
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
                </>
              )}

              <div className="form-group">
                <label className="form-label">
                  <Phone size={14} /> Emergency Contact Phone
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 XXXXX XXXXX"
                  value={regForm.phoneNumber}
                  onChange={(e) => setRegForm({ ...regForm, phoneNumber: e.target.value })}
                />
              </div>

              {/* Location Coordinates */}
              <div className="form-group col-span-2">
                <div className="location-header-row">
                  <label className="form-label">Base Location &amp; Coordinates</label>
                  <button type="button" className="detect-gps-btn" onClick={handleDetectGPS}>
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
                    placeholder="Base / Station Address"
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn primary col-span-2" disabled={loading}>
                {loading ? <span className="rescue-spinner"></span> : <UserPlus size={16} />}
                <span>Create Registered Profile &amp; Launch Station</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPortal;
