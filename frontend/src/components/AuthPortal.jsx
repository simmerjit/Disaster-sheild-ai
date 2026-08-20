import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  Radio,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import SoftAurora from './SoftAurora';

const RESPONDER_PRESETS = [
  {
    teamName: 'NDRF 8th Bn - Alpha SAR Taskforce',
    teamCode: 'NDRF-ALPHA-08',
    email: 'ndrf.alpha8@gov.in',
    organization: 'National Disaster Response Force (NDRF)',
    specialization: 'urban_search_rescue',
    role: 'rescue_worker',
    badge: 'USAR 08',
    desc: 'Urban search & rescue extraction unit',
  },
  {
    teamName: 'SDRF Coastal & Marine Flood Rescue',
    teamCode: 'SDRF-FLOOD-02',
    email: 'sdrf.coastal@kerala.gov.in',
    organization: 'State Disaster Response Force (SDRF)',
    specialization: 'flood_water',
    role: 'rescue_worker',
    badge: 'FLOOD 02',
    desc: 'Swift-water evacuation & marine search',
  },
  {
    teamName: 'Rapid Medical Evac & Trauma Response',
    teamCode: 'MED-EVAC-01',
    email: 'med.sar.delhi@emergency.org',
    organization: 'Disaster Health Response Network',
    specialization: 'medical_evac',
    role: 'rescue_worker',
    badge: 'MEDEVAC',
    desc: 'Trauma stabilization & mobile ICU triage',
  },
  {
    teamName: 'Eastern Cyclone & Storm Strike Unit',
    teamCode: 'NDRF-CYCLONE-03',
    email: 'cyclone.strike@ndrf.gov.in',
    organization: 'National Disaster Response Force (NDRF)',
    specialization: 'cyclone_storm',
    role: 'rescue_worker',
    badge: 'CYCLONE 03',
    desc: 'Storm clearance & structural rescue',
  },
];

export const AuthPortal = ({ onLoginSuccess }) => {
  const { login, registerOrSync } = useAuthContext();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmailOrCode, setLoginEmailOrCode] = useState('');
  const [loginPassword, setLoginPassword] = useState('rescue123');

  // Registration form state
  const [regRole, setRegRole] = useState('rescue_worker');
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: 'secure123Password',
    role: 'rescue_worker',
    organization: 'National Disaster Response Force (NDRF)',
    specialization: 'urban_search_rescue',
    teamCode: '',
    phoneNumber: '',
    address: 'Command Headquarters, New Delhi',
    latitude: 28.6139,
    longitude: 77.209,
  });

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmailOrCode.trim()) {
      setError('Please enter your email or unit identifier.');
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
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Responder Preset Login
  const handlePresetLogin = async (preset) => {
    setLoading(true);
    setError(null);
    try {
      const data = await login(preset.teamCode, 'rescue123');
      if (data?.success) {
        if (onLoginSuccess) onLoginSuccess(data.user, data.rescueTeam);
      }
    } catch (err) {
      try {
        const regData = await registerOrSync({
          name: preset.teamName,
          email: preset.email,
          role: preset.role,
          organization: preset.organization,
          specialization: preset.specialization,
          teamCode: preset.teamCode,
          location: { latitude: 28.6139, longitude: 77.209, address: 'Command Base' },
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

  // Quick Guest / Citizen Access
  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerOrSync({
        name: 'Guest Observer',
        email: `guest_${Date.now()}@disastershield.org`,
        role: 'citizen',
        organization: 'Public Network',
        location: { latitude: 28.6139, longitude: 77.209, address: 'New Delhi, India' },
      });
      if (data?.success) {
        if (onLoginSuccess) onLoginSuccess(data.user, null);
      }
    } catch (err) {
      setError(err.message || 'Failed to start guest session.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name.trim() || !regForm.email.trim()) {
      setError('Name and email are required.');
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
          address: regForm.address || 'Field Station',
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
    <div className="auth-minimal-backdrop">
      {/* ── 1. Minimal Floating Navbar ───────────────────────── */}
      <header className="auth-minimal-nav">
        <div className="nav-brand">
          <div className="nav-logo-box">
            <Shield size={16} strokeWidth={2.2} />
          </div>
          <span className="nav-title">DisasterShield</span>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-link-btn"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            Live Map
          </button>
          <button
            type="button"
            className="nav-outline-btn"
            onClick={() => {
              setActiveTab(activeTab === 'login' ? 'register' : 'login');
              setError(null);
            }}
          >
            {activeTab === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </header>

      {/* ── 2. Fullscreen React Bits Soft Aurora Layer ──────── */}
      <SoftAurora
speed={0.6}
  scale={1.5}
  brightness={1}
  color1="#f7f7f7"
  color2="#e100ff"
  noiseFrequency={2.5}
  noiseAmplitude={1}
  bandHeight={0.5}
  bandSpread={1}
  octaveDecay={0.1}
  layerOffset={0}
  colorSpeed={1}
  enableMouseInteraction
  mouseInfluence={0.25}
      />

      {/* ── 4. Centered Minimal Auth Card (Pixel Matched) ────── */}
      <div className="auth-minimal-card-wrap">
        <div className="auth-minimal-card">
          {/* Header Typography */}
          <div className="auth-card-header">
            <h1 className="auth-card-title">
              {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="auth-card-subtitle">
              {activeTab === 'login'
                ? 'Enter your credentials or choose a quick deployment profile'
                : 'Register your rescue unit, coordinator profile, or citizen account'}
            </p>
          </div>

          {/* Minimal Horizontal Tabs */}
          <div className="auth-minimal-tabs">
            <button
              type="button"
              className={`minimal-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`minimal-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="auth-minimal-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* ── TAB 1: LOGIN ─────────────────────────────────── */}
          {activeTab === 'login' && (
            <div className="auth-card-body">
              <form onSubmit={handleLoginSubmit} className="minimal-form">
                <div className="input-group">
                  <label className="input-label">Email or Callsign</label>
                  <div className="input-field-wrap">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="text"
                      className="minimal-input"
                      placeholder="name@agency.gov or NDRF-ALPHA-08"
                      value={loginEmailOrCode}
                      onChange={(e) => setLoginEmailOrCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <div className="label-row">
                    <label className="input-label">Password</label>
                    <button
                      type="button"
                      className="forgot-pass-btn"
                      onClick={() => setLoginPassword('rescue123')}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-field-wrap">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="minimal-input"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary-white"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="minimal-spinner"></span>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </form>

              {/* Minimal Divider */}
              <div className="minimal-divider">
                <span>or quick access</span>
              </div>

              {/* Quick Presets Grid (2x2) */}
              <div className="minimal-presets-grid">
                {RESPONDER_PRESETS.map((preset) => (
                  <button
                    key={preset.teamCode}
                    type="button"
                    className="minimal-preset-card"
                    onClick={() => handlePresetLogin(preset)}
                    disabled={loading}
                  >
                    <div className="preset-card-top">
                      <span className="preset-badge">{preset.badge}</span>
                      <ArrowRight size={13} className="preset-arrow" />
                    </div>
                    <div className="preset-card-name">{preset.teamName}</div>
                    <div className="preset-card-desc">{preset.desc}</div>
                  </button>
                ))}
              </div>

              {/* Guest Access Button */}
              <button
                type="button"
                className="btn-secondary-outline guest-btn"
                onClick={handleGuestLogin}
                disabled={loading}
              >
                <span>Continue as Guest Observer</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* ── TAB 2: REGISTER ──────────────────────────────── */}
          {activeTab === 'register' && (
            <div className="auth-card-body">
              <form onSubmit={handleRegisterSubmit} className="minimal-form">
                {/* Role Switcher */}
                <div className="input-group">
                  <label className="input-label">Account Type</label>
                  <div className="minimal-role-pills">
                    <button
                      type="button"
                      className={`role-pill ${regRole === 'rescue_worker' ? 'active' : ''}`}
                      onClick={() => {
                        setRegRole('rescue_worker');
                        setRegForm((p) => ({
                          ...p,
                          role: 'rescue_worker',
                          organization: 'National Disaster Response Force (NDRF)',
                        }));
                      }}
                    >
                      Rescue Unit
                    </button>
                    <button
                      type="button"
                      className={`role-pill ${regRole === 'coordinator' ? 'active' : ''}`}
                      onClick={() => {
                        setRegRole('coordinator');
                        setRegForm((p) => ({
                          ...p,
                          role: 'coordinator',
                          organization: 'State Disaster Management Authority',
                        }));
                      }}
                    >
                      Coordinator
                    </button>
                    <button
                      type="button"
                      className={`role-pill ${regRole === 'citizen' ? 'active' : ''}`}
                      onClick={() => {
                        setRegRole('citizen');
                        setRegForm((p) => ({
                          ...p,
                          role: 'citizen',
                          organization: 'Public Safety Network',
                        }));
                      }}
                    >
                      Citizen
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <div className="input-field-wrap">
                    <User size={16} className="input-icon" />
                    <input
                      type="text"
                      className="minimal-input"
                      placeholder="Vikram Singh"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <div className="input-field-wrap">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      className="minimal-input"
                      placeholder="v.singh@agency.gov"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {regRole === 'rescue_worker' && (
                  <>
                    <div className="input-row-split">
                      <div className="input-group">
                        <label className="input-label">Unit Callsign</label>
                        <div className="input-field-wrap">
                          <Radio size={16} className="input-icon" />
                          <input
                            type="text"
                            className="minimal-input"
                            placeholder="SAR-UNIT-04"
                            value={regForm.teamCode}
                            onChange={(e) => setRegForm({ ...regForm, teamCode: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="input-label">Specialization</label>
                        <select
                          className="minimal-select"
                          value={regForm.specialization}
                          onChange={(e) => setRegForm({ ...regForm, specialization: e.target.value })}
                        >
                          <option value="urban_search_rescue">Urban SAR (USAR)</option>
                          <option value="flood_water">Flood &amp; Marine Rescue</option>
                          <option value="medical_evac">Medical Evac &amp; Trauma</option>
                          <option value="cyclone_storm">Cyclone &amp; Extreme Weather</option>
                          <option value="general_sar">General SAR</option>
                        </select>
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Organization</label>
                      <input
                        type="text"
                        className="minimal-input"
                        placeholder="National Disaster Response Force (NDRF)"
                        value={regForm.organization}
                        onChange={(e) => setRegForm({ ...regForm, organization: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="input-group">
                  <div className="label-row">
                    <label className="input-label">Base Location</label>
                    <button
                      type="button"
                      className="text-action-btn"
                      onClick={handleDetectGPS}
                    >
                      <MapPin size={12} />
                      <span>Detect GPS</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    className="minimal-input"
                    placeholder="Command Post Address or Coordinates"
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary-white"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="minimal-spinner"></span>
                  ) : (
                    <span>Create Profile</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPortal;
