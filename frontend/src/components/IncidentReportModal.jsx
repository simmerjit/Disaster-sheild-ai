import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Crosshair, MapPin, Send, X } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { fetchIncidentReports, submitIncidentReport } from '../services/reportApi';

const emptyForm = {
  title: '',
  description: '',
  latitude: '',
  longitude: '',
  imageUrl: '',
};

export const IncidentReportModal = ({ isOpen, onClose, defaultLocation, disaster }) => {
  const { currentUser } = useAuthContext();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentReports, setRecentReports] = useState([]);

  const targetLocation = useMemo(() => {
    if (defaultLocation && defaultLocation.latitude != null && defaultLocation.longitude != null) {
      return defaultLocation;
    }

    if (disaster && disaster.latitude != null && disaster.longitude != null) {
      return {
        latitude: Number(disaster.latitude),
        longitude: Number(disaster.longitude),
        title: disaster.title || 'Selected disaster',
      };
    }

    return null;
  }, [defaultLocation, disaster]);

  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setSuccess('');

    const lat = targetLocation?.latitude ?? '';
    const lng = targetLocation?.longitude ?? '';

    setForm((prev) => ({
      ...prev,
      latitude: lat === '' ? prev.latitude : String(lat),
      longitude: lng === '' ? prev.longitude : String(lng),
      title: prev.title || (disaster ? `${disaster.type || 'Incident'} report near ${disaster.location || disaster.country || 'area'}` : prev.title),
    }));

    const loadRecent = async () => {
      try {
        const res = await fetchIncidentReports({ status: 'pending' });
        const reports = Array.isArray(res?.data) ? res.data : [];
        setRecentReports(reports.slice(0, 3));
      } catch {
        setRecentReports([]);
      }
    };

    loadRecent();
  }, [isOpen, targetLocation, disaster]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Location is not supported by this browser. Enter coordinates manually.');
      return;
    }

    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((prev) => ({
          ...prev,
          latitude: coords.latitude.toFixed(5),
          longitude: coords.longitude.toFixed(5),
        }));
        setLocating(false);
      },
      (locationError) => {
        setError(`Could not get your location: ${locationError.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      setError('Please provide both a report title and a short description.');
      return;
    }

    if (form.latitude === '' || form.longitude === '') {
      setError('A latitude and longitude are required for a valid incident report.');
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError('Latitude and longitude must be valid numbers.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        latitude,
        longitude,
        userName: currentUser?.name || 'Citizen Reporter',
        email: currentUser?.email || `citizen_${Date.now()}@disastershield.local`,
        disasterId: disaster?._id || disaster?.id || null,
      };

      const result = await submitIncidentReport(payload);
      setSuccess(result?.message || 'Report sent to the coordination desk.');
      setForm(emptyForm);

      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="incident-report-modal-backdrop" onClick={onClose}>
      <div
        className="incident-report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-report-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="incident-report-header">
          <div>
            <p className="incident-report-kicker">Citizen field report</p>
            <h3 id="incident-report-title">Report an incident</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className="incident-report-body">
          <form className="incident-report-form" onSubmit={handleSubmit}>
            <label className="field-label">
              Report title
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Flooded street near market square"
                maxLength={140}
                required
              />
            </label>

            <label className="field-label">
              Description
              <textarea
                rows="5"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what is happening, who is affected, and the urgency."
                maxLength={3000}
                required
              />
            </label>

            <div className="incident-report-grid">
              <label className="field-label">
                Latitude
                <input
                  type="number"
                  step="0.0001"
                  min="-90"
                  max="90"
                  value={form.latitude}
                  onChange={(e) => handleChange('latitude', e.target.value)}
                  placeholder="28.6139"
                />
              </label>

              <label className="field-label">
                Longitude
                <input
                  type="number"
                  step="0.0001"
                  min="-180"
                  max="180"
                  value={form.longitude}
                  onChange={(e) => handleChange('longitude', e.target.value)}
                  placeholder="77.2090"
                />
              </label>
            </div>
            <button
              type="button"
              className="incident-use-location-btn"
              onClick={handleUseCurrentLocation}
              disabled={locating}
            >
              <Crosshair size={15} />
              {locating ? 'Getting location...' : 'Use my current location'}
            </button>

            <label className="field-label">
              Image URL (optional)
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                placeholder="https://example.com/incident.jpg"
                maxLength={2048}
              />
            </label>

            {targetLocation && (
              <div className="incident-location-banner">
                <MapPin size={14} />
                <span>
                  {targetLocation.title || 'Location'} • {targetLocation.latitude}, {targetLocation.longitude}
                </span>
              </div>
            )}

            {error && (
              <div className="incident-form-message error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="incident-form-message success">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <button type="submit" className="incident-submit-btn" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
          </form>

          <div className="incident-report-sidepanel">
            <h4>Recent reports</h4>
            {recentReports.length === 0 ? (
              <p className="incident-side-empty">No recent reports yet. Be the first to share an incident.</p>
            ) : (
              <ul className="incident-side-list">
                {recentReports.map((item) => (
                  <li key={item._id || item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.status || 'pending'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentReportModal;
