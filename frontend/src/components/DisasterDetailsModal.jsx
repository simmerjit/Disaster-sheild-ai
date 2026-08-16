import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Activity,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  LifeBuoy,
  HeartPulse,
  UserX,
  Skull,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Clock,
  Radio,
  Ambulance,
  Home,
  HeartHandshake,
  Navigation,
  Phone,
  Layers,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { fetchFullIncidentDetails } from '../services/incidentApi';
import { formatDistance, getGoogleMapsDirectionsUrl } from '../utils/geoUtils';

const typeEmojis = {
  earthquake: '🔴',
  cyclone: '🟠',
  flood: '🔵',
  wildfire: '🔥',
  volcano: '🟣',
  drought: '🌾',
  tsunami: '🌊',
  storm: '⛈️',
  landslide: '⛰️',
  other: '⚠️',
};

const severityColors = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export const DisasterDetailsModal = ({
  disaster,
  onClose,
  userCoords,
  onOpenFacilities,
  onOpenWeather,
}) => {
  const [activeTab, setActiveTab] = useState('impact'); // 'impact' | 'updates' | 'rescue' | 'shelters' | 'relief'
  const [loading, setLoading] = useState(true);
  const [incidentData, setIncidentData] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!disaster) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFullIncidentDetails(disaster);
      setIncidentData(data);
    } catch (err) {
      console.error('Failed to load full incident details:', err);
      setError('Unable to load some incident data. Showing basic disaster information.');
    } finally {
      setLoading(false);
    }
  }, [disaster]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!disaster) return null;

  const {
    id,
    title,
    type = 'other',
    severity = 'medium',
    location,
    country,
    magnitude,
    depth,
    affectedRadius,
    timestamp,
    source,
    description,
    link,
    latitude,
    longitude,
    instruction,
    urgency,
    certainty,
    effective,
    expires,
    sender,
  } = disaster;

  const isSachet = (source || '').toUpperCase() === 'SACHET';
  const emoji = typeEmojis[type.toLowerCase()] || '⚠️';
  const sevColor = severityColors[severity.toLowerCase()] || '#eab308';
  const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';
  const impact = incidentData?.impact;
  const updates = incidentData?.updates || [];
  const rescueOps = incidentData?.rescueOps || [];
  const shelters = incidentData?.shelters || [];
  const reliefOrgs = incidentData?.reliefOrgs || [];

  const userLat = userCoords ? Number(userCoords.latitude) : null;
  const userLng = userCoords ? Number(userCoords.longitude) : null;
  const directionsUrl = getGoogleMapsDirectionsUrl(
    userLat,
    userLng,
    Number(latitude),
    Number(longitude)
  );

  return (
    <div className="incident-modal-backdrop" onClick={onClose}>
      <div className="incident-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="incident-modal-header" style={{ borderTopColor: sevColor }}>
          <div className="modal-title-area">
            <div className="title-top-row">
              <span className="type-badge">
                <span>{emoji}</span>
                <span>{type.toUpperCase()}</span>
              </span>
              <span
                className="severity-pill"
                style={{ backgroundColor: `${sevColor}20`, color: sevColor, borderColor: sevColor }}
              >
                {severity.toUpperCase()} SEVERITY
              </span>
              {isSachet ? (
                <span className="sachet-badge">✓ NDMA SACHET (India)</span>
              ) : (
                <span className="source-tag">Source: {source || 'Official Feed'}</span>
              )}
            </div>

            <h2 className="modal-incident-title">{title}</h2>

            <div className="modal-meta-row">
              <div className="meta-item">
                <MapPin size={13} className="meta-icon" />
                <span>{location || country || 'Global Coordinates'}</span>
              </div>
              <div className="meta-item">
                <Activity size={13} className="meta-icon" />
                <span>
                  {latitude ? Number(latitude).toFixed(4) : 'N/A'}°,{' '}
                  {longitude ? Number(longitude).toFixed(4) : 'N/A'}°
                </span>
              </div>
              <div className="meta-item">
                <Calendar size={13} className="meta-icon" />
                <span>{effective ? new Date(effective).toLocaleString() : formattedDate}</span>
              </div>
              {affectedRadius && (
                <div className="meta-item">
                  <Layers size={13} className="meta-icon" />
                  <span>Impact Radius: ~{affectedRadius} km</span>
                </div>
              )}
            </div>
          </div>

          <button onClick={onClose} className="modal-close-btn" title="Close details">
            <X size={18} />
          </button>
        </div>

        {/* Modal Tab Bar */}
        <div className="incident-modal-tabs">
          <button
            onClick={() => setActiveTab('impact')}
            className={`modal-tab-btn ${activeTab === 'impact' ? 'active' : ''}`}
          >
            <Users size={14} />
            <span>Impact & Casualties</span>
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`modal-tab-btn ${activeTab === 'updates' ? 'active' : ''}`}
          >
            <Radio size={14} />
            <span>Verified Updates ({updates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rescue')}
            className={`modal-tab-btn ${activeTab === 'rescue' ? 'active' : ''}`}
          >
            <Ambulance size={14} />
            <span>Rescue Ops ({rescueOps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shelters')}
            className={`modal-tab-btn ${activeTab === 'shelters' ? 'active' : ''}`}
          >
            <Home size={14} />
            <span>Verified Shelters ({shelters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('relief')}
            className={`modal-tab-btn ${activeTab === 'relief' ? 'active' : ''}`}
          >
            <HeartHandshake size={14} />
            <span>Relief & Aid ({reliefOrgs.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="incident-modal-body">
          {loading && (
            <div className="modal-loading-box">
              <RefreshCw size={24} className="spin-icon" />
              <p>Loading verified incident records, rescue ops, and shelter data...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* TAB 1: IMPACT & CASUALTIES */}
              {activeTab === 'impact' && (
                <div className="tab-pane impact-pane">
                  {/* Official SACHET Alert Banner */}
                  {isSachet && (
                    <div className="sachet-alert-banner">
                      <div className="sachet-banner-header">
                        <ShieldCheck size={16} className="text-green" />
                        <strong>Official NDMA SACHET Emergency Warning</strong>
                        {sender && <span className="sachet-sender-chip">{sender}</span>}
                      </div>
                      {instruction && (
                        <div className="sachet-instruction-callout">
                          <strong>⚠️ Emergency Instruction:</strong> {instruction}
                        </div>
                      )}
                      <div className="sachet-meta-badges">
                        {urgency && <span>Urgency: <strong>{urgency}</strong></span>}
                        {certainty && <span>Certainty: <strong>{certainty}</strong></span>}
                        {expires && (
                          <span>
                            Expires: <strong>{new Date(expires).toLocaleTimeString()}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pane-section-header">
                    <h3>Official Disaster Impact Assessment</h3>
                    {impact?.verified && (
                      <span className="verified-badge">
                        <ShieldCheck size={13} />
                        <span>VERIFIED OFFICIAL STATS</span>
                      </span>
                    )}
                  </div>

                  {description && (
                    <div className="incident-desc-box">
                      <h4>Incident Overview</h4>
                      <p>{description}</p>
                    </div>
                  )}

                  {/* Impact Stats Grid */}
                  <div className="impact-stats-grid">
                    {/* Affected */}
                    <div className="stat-card stat-affected">
                      <div className="stat-icon-wrapper">
                        <Users size={18} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">Total Affected</span>
                        <strong className="stat-value">
                          {impact?.affected !== null && impact?.affected !== undefined
                            ? impact.affected.toLocaleString()
                            : 'Pending official report'}
                        </strong>
                      </div>
                    </div>

                    {/* Rescued */}
                    <div className="stat-card stat-rescued">
                      <div className="stat-icon-wrapper">
                        <LifeBuoy size={18} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">People Rescued</span>
                        <strong className="stat-value text-green">
                          {impact?.rescued !== null && impact?.rescued !== undefined
                            ? impact.rescued.toLocaleString()
                            : 'Pending official report'}
                        </strong>
                      </div>
                    </div>

                    {/* Injured */}
                    <div className="stat-card stat-injured">
                      <div className="stat-icon-wrapper">
                        <HeartPulse size={18} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">Reported Injured</span>
                        <strong className="stat-value text-amber">
                          {impact?.injured !== null && impact?.injured !== undefined
                            ? impact.injured.toLocaleString()
                            : 'Pending official report'}
                        </strong>
                      </div>
                    </div>

                    {/* Missing */}
                    <div className="stat-card stat-missing">
                      <div className="stat-icon-wrapper">
                        <UserX size={18} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">Reported Missing</span>
                        <strong className="stat-value">
                          {impact?.missing !== null && impact?.missing !== undefined
                            ? impact.missing.toLocaleString()
                            : 'Pending official report'}
                        </strong>
                      </div>
                    </div>

                    {/* Deceased */}
                    <div className="stat-card stat-deceased">
                      <div className="stat-icon-wrapper">
                        <Skull size={18} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-label">Confirmed Deceased</span>
                        <strong className="stat-value text-red">
                          {impact?.deceased !== null && impact?.deceased !== undefined
                            ? impact.deceased.toLocaleString()
                            : 'Pending official report'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Impact Source Footer */}
                  <div className="impact-provenance-box">
                    <div className="provenance-left">
                      <strong>Reporting Agency:</strong>{' '}
                      <span>{impact?.source || source || 'Pending official casualty report'}</span>
                      {impact?.updatedAt && (
                        <span className="updated-tag">
                          Last Updated: {new Date(impact.updatedAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {impact?.sourceUrl && (
                      <a
                        href={impact.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="provenance-link"
                      >
                        <span>Official Source Link</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* Quick Action Navigation Bar */}
                  <div className="modal-quick-actions">
                    {onOpenFacilities && (
                      <button
                        onClick={() => {
                          onOpenFacilities({
                            latitude: Number(latitude),
                            longitude: Number(longitude),
                            name: title,
                            type: 'disaster',
                          });
                          onClose();
                        }}
                        className="modal-action-btn btn-facilities"
                      >
                        <span>🏥 Find Nearby Facilities</span>
                      </button>
                    )}

                    {onOpenWeather && (
                      <button
                        onClick={() => {
                          onOpenWeather({
                            latitude: Number(latitude),
                            longitude: Number(longitude),
                            name: title,
                            type,
                          });
                          onClose();
                        }}
                        className="modal-action-btn btn-weather"
                      >
                        <span>⛅ Inspect Live Weather</span>
                      </button>
                    )}

                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="modal-action-btn btn-directions"
                    >
                      <Navigation size={13} />
                      <span>Directions</span>
                    </a>

                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="modal-action-btn btn-report"
                      >
                        <span>Official GDACS/USGS Report</span>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: VERIFIED UPDATES FEED */}
              {activeTab === 'updates' && (
                <div className="tab-pane updates-pane">
                  <div className="pane-section-header">
                    <h3>Verified Incident Timeline & Alerts</h3>
                    <span className="feed-count">{updates.length} Updates</span>
                  </div>

                  {updates.length === 0 ? (
                    <div className="empty-tab-state">
                      <Radio size={28} className="empty-icon" />
                      <h4>No updates posted yet</h4>
                      <p>Official alerts and field reports will appear here in chronological order as issued by emergency agencies.</p>
                    </div>
                  ) : (
                    <div className="updates-timeline">
                      {updates.map((item) => (
                        <div key={item._id || item.id} className="timeline-card">
                          <div className="timeline-header">
                            <span className={`update-type-badge type-${item.type}`}>
                              {item.type?.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="timeline-time">
                              <Clock size={11} />
                              {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent'}
                            </span>
                          </div>

                          <h4 className="timeline-title">{item.title}</h4>
                          <p className="timeline-content">{item.content}</p>

                          <div className="timeline-footer">
                            <span className="timeline-source">
                              Source: <strong>{item.source}</strong>
                              {item.verified && (
                                <span className="inline-verified">
                                  <ShieldCheck size={11} />
                                  <span>Verified</span>
                                </span>
                              )}
                            </span>

                            {item.sourceUrl && (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="timeline-link"
                              >
                                <span>Source</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RESCUE OPERATIONS */}
              {activeTab === 'rescue' && (
                <div className="tab-pane rescue-pane">
                  <div className="pane-section-header">
                    <h3>Active Rescue & Evacuation Operations</h3>
                    <span className="feed-count">{rescueOps.length} Operations</span>
                  </div>

                  {rescueOps.length === 0 ? (
                    <div className="empty-tab-state">
                      <Ambulance size={28} className="empty-icon" />
                      <h4>No rescue operations currently deployed</h4>
                      <p>Rescue teams deployed by NDRF, SDRF, or state disaster authorities will be tracked here.</p>
                    </div>
                  ) : (
                    <div className="rescue-ops-grid">
                      {rescueOps.map((op) => (
                        <div key={op._id || op.id} className="rescue-card">
                          <div className="rescue-card-header">
                            <div className="rescue-title-block">
                              <h4>{op.title}</h4>
                              <span className="org-tag">{op.organization}</span>
                            </div>
                            <div className="rescue-status-tags">
                              <span className={`status-pill status-${op.status}`}>
                                {op.status?.toUpperCase()}
                              </span>
                              <span className={`priority-pill priority-${op.priority}`}>
                                {op.priority?.toUpperCase()} PRIORITY
                              </span>
                            </div>
                          </div>

                          {op.description && <p className="rescue-desc">{op.description}</p>}

                          <div className="rescue-metrics-row">
                            <div className="rescue-metric">
                              <span className="metric-label">Teams Deployed</span>
                              <strong className="metric-val">{op.teamsDeployed || 1}</strong>
                            </div>
                            <div className="rescue-metric">
                              <span className="metric-label">People Rescued</span>
                              <strong className="metric-val text-green">{op.peopleRescued || 0}</strong>
                            </div>
                            <div className="rescue-metric">
                              <span className="metric-label">Injured Treated</span>
                              <strong className="metric-val text-amber">{op.peopleInjured || 0}</strong>
                            </div>
                          </div>

                          <div className="rescue-card-footer">
                            <span className="rescue-source">
                              Authority: <strong>{op.source}</strong>
                            </span>
                            {op.location?.address && (
                              <span className="rescue-loc">📍 {op.location.address}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: VERIFIED SHELTERS (MongoDB) */}
              {activeTab === 'shelters' && (
                <div className="tab-pane shelters-pane">
                  <div className="pane-section-header">
                    <h3>Verified Emergency Shelters (MongoDB Registry)</h3>
                    <span className="feed-count">{shelters.length} Shelters within 50 km</span>
                  </div>

                  {shelters.length === 0 ? (
                    <div className="empty-tab-state">
                      <Home size={28} className="empty-icon" />
                      <h4>No verified shelters found in the immediate vicinity</h4>
                      <p>Shelters added to the official MongoDB database within 50 km will be displayed here.</p>
                    </div>
                  ) : (
                    <div className="shelters-list">
                      {shelters.map((s) => {
                        const occupancyPercent =
                          s.capacity > 0
                            ? Math.min(100, Math.round(((s.currentOccupancy || 0) / s.capacity) * 100))
                            : 0;

                        const shelterNavUrl = getGoogleMapsDirectionsUrl(
                          userLat,
                          userLng,
                          Number(s.latitude),
                          Number(s.longitude)
                        );

                        return (
                          <div key={s.id || s._id} className="shelter-card">
                            <div className="shelter-header">
                              <div>
                                <h4 className="shelter-name">🏠 {s.name}</h4>
                                <p className="shelter-addr">{s.address}</p>
                              </div>
                              <span className="shelter-dist-pill">
                                📍 ~{formatDistance(s.distanceKm)}
                              </span>
                            </div>

                            {/* Occupancy bar */}
                            <div className="shelter-occupancy-section">
                              <div className="occupancy-labels">
                                <span>Occupancy: {s.currentOccupancy || 0} / {s.capacity}</span>
                                <span>{occupancyPercent}%</span>
                              </div>
                              <div className="occupancy-track">
                                <div
                                  className="occupancy-fill"
                                  style={{
                                    width: `${occupancyPercent}%`,
                                    backgroundColor:
                                      occupancyPercent > 85
                                        ? '#ef4444'
                                        : occupancyPercent > 60
                                        ? '#eab308'
                                        : '#22c55e',
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div className="shelter-footer">
                              {s.contact && (
                                <div className="shelter-contact">
                                  <Phone size={12} />
                                  <span>{s.contact}</span>
                                </div>
                              )}

                              <a
                                href={shelterNavUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shelter-nav-btn"
                              >
                                <Navigation size={12} />
                                <span>Directions to Shelter</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: RELIEF & DONATION ORGANIZATIONS */}
              {activeTab === 'relief' && (
                <div className="tab-pane relief-pane">
                  <div className="pane-section-header">
                    <h3>Verified Disaster Relief & Humanitarian Aid</h3>
                    <span className="feed-count">{reliefOrgs.length} Verified Organizations</span>
                  </div>

                  <div className="relief-safety-banner">
                    <ShieldCheck size={15} className="safety-icon" />
                    <p>
                      <strong>Fraud Prevention Guarantee:</strong> All listed relief organizations are verified by emergency authorities. Donation links connect directly to official organizational portals.
                    </p>
                  </div>

                  {reliefOrgs.length === 0 ? (
                    <div className="empty-tab-state">
                      <HeartHandshake size={28} className="empty-icon" />
                      <h4>No relief organizations listed for this region yet</h4>
                      <p>Verified humanitarian aid organizations supporting this disaster area will be listed here.</p>
                    </div>
                  ) : (
                    <div className="relief-orgs-grid">
                      {reliefOrgs.map((org) => (
                        <div key={org._id || org.id} className="relief-card">
                          <div className="relief-header">
                            <div>
                              <h4 className="org-name">❤️ {org.name}</h4>
                              {org.verified && (
                                <span className="verified-badge">
                                  <ShieldCheck size={11} />
                                  <span>Verified Organization</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {org.description && <p className="org-desc">{org.description}</p>}

                          {/* Services Provided */}
                          {org.services && org.services.length > 0 && (
                            <div className="org-services">
                              <span className="services-label">Services Provided:</span>
                              <div className="service-tags">
                                {org.services.map((svc) => (
                                  <span key={svc} className="service-tag">
                                    {svc.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Links */}
                          <div className="relief-actions">
                            {org.website && (
                              <a
                                href={org.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relief-link-btn btn-web"
                              >
                                <span>Visit Website</span>
                                <ExternalLink size={11} />
                              </a>
                            )}

                            {org.donationUrl && (
                              <a
                                href={org.donationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relief-link-btn btn-donate"
                              >
                                <span>Official Donation Portal</span>
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>

                          {/* Verification Citation */}
                          {org.verificationSource && (
                            <div className="org-verification-citation">
                              <small>
                                Verification Source: <strong>{org.verificationSource}</strong>
                              </small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisasterDetailsModal;
