import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Camera, 
  MapPin, 
  Activity, 
  ShieldAlert, 
  ArrowLeft, 
  Cpu, 
  Lock, 
  ImageIcon, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Building,
  X,
  PlayCircle
} from 'lucide-react';
import { acknowledgeDemoIncident, resolveDemoIncident } from '../redux/actions/demoActions';
import { getLocale } from '../utils/dateHelper';
import { fetchCentralIncidentById, resolveEvidenceUrl } from '../services/centralIncidentApi';
import { upsertSingleRealIncident } from '../redux/slices/incidentSlice';
import Layout from '../components/Layout';
import './Incidents.scss';

const IncidentDetails = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { incidents } = useSelector((state) => state.incidents);
  const { user } = useSelector((state) => state.auth);
  const locale = getLocale(i18n.language);

  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  const [isLoadingDirect, setIsLoadingDirect] = useState(false);
  const [directFetchError, setDirectFetchError] = useState(null);
  const [brokenEvidenceImages, setBrokenEvidenceImages] = useState({});
  const [expandedEvidenceIndex, setExpandedEvidenceIndex] = useState(null);
  const [recordingError, setRecordingError] = useState(false);

  const storeIncident = incidents.find((i) => i.id === id);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const loadDirect = async () => {
      // If not present in store or doesn't have evidence array yet, fetch direct
      if (!storeIncident || storeIncident.source === 'YOLO_EDGE') {
        setIsLoadingDirect(true);
        setDirectFetchError(null);
        try {
          const directData = await fetchCentralIncidentById(id, { signal: controller.signal });
          if (!isCancelled && directData) {
            dispatch(upsertSingleRealIncident(directData));
          }
        } catch (err) {
          if (!isCancelled && err.name !== 'AbortError') {
            // Only show direct fetch error if we don't already have storeIncident
            if (!storeIncident) {
              setDirectFetchError(err.message || 'Incident not found');
            }
          }
        } finally {
          if (!isCancelled) {
            setIsLoadingDirect(false);
          }
        }
      }
    };

    loadDirect();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [id, dispatch]);

  useEffect(() => {
    setSelectedEvidenceIndex(0);
    setBrokenEvidenceImages({});
    setExpandedEvidenceIndex(null);
    setRecordingError(false);
  }, [id]);

  useEffect(() => {
    if (expandedEvidenceIndex === null) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setExpandedEvidenceIndex(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [expandedEvidenceIndex]);

  const incident = storeIncident;

  if (isLoadingDirect && !incident) {
    return (
      <Layout>
        <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
          <RefreshCw size={32} className="spin-icon" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3>{t('Loading incident details...')}</h3>
        </div>
      </Layout>
    );
  }

  if (!incident && directFetchError) {
    return (
      <Layout>
        <div className="container" style={{ padding: '3rem 0' }}>
          <h2>{t('Incident not found')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{directFetchError}</p>
          <Link to="/incidents" className="btn btn-outline" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> {t('Back to Incidents')}
          </Link>
        </div>
      </Layout>
    );
  }

  if (!incident) {
    return (
      <Layout>
        <div className="container" style={{ padding: '3rem 0' }}>
          <h2>{t('Incident not found')}</h2>
          <Link to="/incidents" className="btn btn-outline" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> {t('Back to Incidents')}
          </Link>
        </div>
      </Layout>
    );
  }

  const isReal = incident.source === 'YOLO_EDGE';
  const evidenceList = Array.isArray(incident.evidence) ? incident.evidence : [];
  const currentEvidence = evidenceList[selectedEvidenceIndex] || evidenceList[0] || null;
  const expandedEvidence = expandedEvidenceIndex === null
    ? null
    : evidenceList[expandedEvidenceIndex] || null;
  const recording = incident.recording || null;
  const evidenceImageKey = (evidence, index) => evidence?.id || evidence?.url || String(index);
  const currentEvidenceKey = currentEvidence
    ? evidenceImageKey(currentEvidence, selectedEvidenceIndex)
    : null;

  const markEvidenceImageBroken = (evidence, index) => {
    const key = evidenceImageKey(evidence, index);
    setBrokenEvidenceImages((previous) => ({ ...previous, [key]: true }));
  };

  const canAcknowledge = user && (user.role === 'USER' || user.role === 'ORGANIZATION_ADMIN' || user.role === 'SUPERADMIN');
  const canResolve = user && (user.role === 'ORGANIZATION_ADMIN' || user.role === 'SUPERADMIN');

  return (
    <Layout>
      <div className="incident-details">
        <div className="container">
          <div className="page-header">
            <Link to="/incidents" className="back-link">
              <ArrowLeft size={18} /> {t('Back to Incidents')}
            </Link>
            <div className="d-flex justify-between align-center" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="d-flex align-center" style={{ gap: '1rem' }}>
                <h2>{t('Incident')} {incident.id}</h2>
                <span className={`source-badge ${isReal ? 'source-edge' : 'source-sim'}`}>
                  {isReal ? t('Edge AI (YOLO)') : t('Simulated')}
                </span>
              </div>
              <span className={`status-badge ${(incident.status || 'NEW').toLowerCase()}`}>
                {t(incident.status || 'NEW')}
              </span>
            </div>
          </div>

          <div className="details-layout">
            {/* Media & Evidence Panel */}
            <div className="media-panel">
              {isReal ? (
                <div className="edge-evidence-viewer">
                  {recording?.url && !recordingError ? (
                    <div className="incident-recording-section">
                      <h4 className="media-section-title">
                        <PlayCircle size={18} /> {t('Incident Video Replay')}
                      </h4>
                      <div className="incident-video-container">
                        <video
                          src={resolveEvidenceUrl(recording.url)}
                          poster={currentEvidence?.url ? resolveEvidenceUrl(currentEvidence.url) : undefined}
                          className="incident-video"
                          controls
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          onError={() => setRecordingError(true)}
                        >
                          {t('Your browser cannot play this incident recording.')}
                        </video>
                      </div>
                      <div className="recording-summary">
                        <span>{t('Duration')}: {Number(recording.durationSeconds || 0).toFixed(1)}s</span>
                        <span>{t('Video Frames')}: {recording.frameCount || 0}</span>
                      </div>
                    </div>
                  ) : (
                  <div className="evidence-main-preview">
                    {currentEvidence && currentEvidence.url ? (
                      <div className="evidence-image-container">
                        {brokenEvidenceImages[currentEvidenceKey] ? (
                          <div className="evidence-image-fallback">
                            <ImageIcon size={36} />
                            <span>{t('Evidence image unavailable')}</span>
                          </div>
                        ) : (
                          <>
                            <img
                              src={resolveEvidenceUrl(currentEvidence.url)}
                              alt={t('Evidence capture for incident {{id}}', { id: incident.id })}
                              className="evidence-large-img"
                              onError={() => markEvidenceImageBroken(currentEvidence, selectedEvidenceIndex)}
                            />
                            <div className="evidence-overlay-bar">
                              <span className="evidence-index-pill">
                                <ImageIcon size={14} /> {t('Frame {{current}} of {{total}}', {
                                  current: selectedEvidenceIndex + 1,
                                  total: evidenceList.length,
                                })}
                              </span>
                              {currentEvidence.confidence !== undefined && (
                                <span className="evidence-conf-pill mono">
                                  {t('Frame Confidence')}: {(Number(currentEvidence.confidence) * 100).toFixed(0)}%
                                </span>
                              )}
                              {currentEvidence.capturedAt && (
                                <span className="evidence-time-pill">
                                  <Clock size={12} />
                                  {new Date(currentEvidence.capturedAt).toLocaleTimeString(locale)}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="video-player">
                        <div className="video-placeholder">
                          <Cpu size={36} style={{ marginBottom: '0.75rem', opacity: 0.8 }} />
                          <span className="mono">{t('Awaiting Edge Evidence Frame...')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {recordingError && (
                    <div className="recording-error-notice">
                      <AlertCircle size={16} />
                      <span>{t('Recorded incident video is unavailable. Showing captured photos instead.')}</span>
                    </div>
                  )}

                  {/* Thumbnail Gallery Strip */}
                  {evidenceList.length > 0 && (
                    <div className="thumbnail-gallery">
                      <h4>
                        {t('Evidence Captures')} ({evidenceList.length})
                      </h4>
                      <div className="thumbs evidence-collage">
                        {evidenceList.map((ev, idx) => {
                          const isSelected = idx === selectedEvidenceIndex;
                          const imageKey = evidenceImageKey(ev, idx);
                          return (
                            <button
                              key={ev.id || idx}
                              type="button"
                              className={`thumb-item thumb-button ${isSelected ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedEvidenceIndex(idx);
                                setExpandedEvidenceIndex(idx);
                              }}
                              title={t('Open Frame {{number}}', { number: idx + 1 })}
                            >
                              {ev.url && !brokenEvidenceImages[imageKey] ? (
                                <img
                                  src={resolveEvidenceUrl(ev.url)}
                                  alt={t('Evidence thumbnail {{number}}', { number: idx + 1 })}
                                  className="thumb-img"
                                  loading="lazy"
                                  onError={() => markEvidenceImageBroken(ev, idx)}
                                />
                              ) : (
                                <div className="thumb-fallback">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                              <span className="thumb-index-badge">#{idx + 1}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="evidence-footer-note">
                    <AlertCircle size={14} />
                    <span>{t('Real Edge AI Evidence: JPEG snapshots captured autonomously during detection.')}</span>
                  </div>

                  {expandedEvidence && (
                    <div
                      className="evidence-lightbox"
                      role="dialog"
                      aria-modal="true"
                      aria-label={t('Expanded Evidence Frame')}
                      onClick={() => setExpandedEvidenceIndex(null)}
                    >
                      <div className="evidence-lightbox-content" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="evidence-lightbox-close"
                          onClick={() => setExpandedEvidenceIndex(null)}
                          aria-label={t('Close image viewer')}
                        >
                          <X size={22} />
                        </button>
                        {brokenEvidenceImages[evidenceImageKey(expandedEvidence, expandedEvidenceIndex)] ? (
                          <div className="evidence-lightbox-fallback">
                            <ImageIcon size={48} />
                            <span>{t('Evidence image unavailable')}</span>
                          </div>
                        ) : (
                          <img
                            src={resolveEvidenceUrl(expandedEvidence.url)}
                            alt={t('Expanded evidence frame {{number}}', { number: expandedEvidenceIndex + 1 })}
                            onError={() => markEvidenceImageBroken(expandedEvidence, expandedEvidenceIndex)}
                          />
                        )}
                        <div className="evidence-lightbox-caption">
                          <strong>{t('Frame {{current}} of {{total}}', {
                            current: expandedEvidenceIndex + 1,
                            total: evidenceList.length,
                          })}</strong>
                          {expandedEvidence.capturedAt && (
                            <span>{new Date(expandedEvidence.capturedAt).toLocaleString(locale)}</span>
                          )}
                          {expandedEvidence.confidence !== undefined && (
                            <span>{t('Confidence')}: {(Number(expandedEvidence.confidence) * 100).toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="video-player">
                    <div className="video-placeholder">
                      <span className="mono">{t('RECORDING UNAVAILABLE (SIMULATION)')}</span>
                    </div>
                  </div>
                  <div className="thumbnail-gallery">
                    <h4>{t('Keyframes')}</h4>
                    <div className="thumbs">
                      <div className="thumb-item active"></div>
                      <div className="thumb-item"></div>
                      <div className="thumb-item"></div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Metadata & Workflow Panel */}
            <div className="meta-panel">
              <div className="meta-card">
                <h3>{t('Details')}</h3>
                <div className="meta-row">
                  <span className="label"><Camera size={16}/> {t('Camera')}</span>
                  <span className="value">{incident.cameraName || t('Camera')}</span>
                </div>
                {incident.cameraId && (
                  <div className="meta-row">
                    <span className="label"><Cpu size={16}/> {t('Camera ID')}</span>
                    <span className="value mono">{incident.cameraId}</span>
                  </div>
                )}
                {incident.cameraScope && (
                  <div className="meta-row">
                    <span className="label"><MapPin size={16}/> {t('Scope')}</span>
                    <span className="value mono">{t(incident.cameraScope)}</span>
                  </div>
                )}
                {incident.organizationId && (
                  <div className="meta-row">
                    <span className="label"><Building size={16}/> {t('Organization')}</span>
                    <span className="value mono">{incident.organizationId}</span>
                  </div>
                )}
                <div className="meta-row">
                  <span className="label"><ShieldAlert size={16}/> {t('Threat Type')}</span>
                  <span className="value error">{t(incident.detectionType)}</span>
                </div>
                <div className="meta-row">
                  <span className="label"><Activity size={16}/> {t('Confidence')}</span>
                  <span className="value mono">{(Number(incident.confidence || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="meta-row">
                  <span className="label">{t('Start Time')}</span>
                  <span className="value">{new Date(incident.startedAt).toLocaleString(locale)}</span>
                </div>
                {incident.evidenceCount !== undefined && (
                  <div className="meta-row">
                    <span className="label">{t('Evidence Frames')}</span>
                    <span className="value mono">{incident.evidenceCount || evidenceList.length}</span>
                  </div>
                )}
                {(incident.status === 'RESOLVED' || incident.status === 'FALSE_POSITIVE') && incident.resolvedAt && (
                  <div className="meta-row">
                    <span className="label">{t('End Time')}</span>
                    <span className="value">{new Date(incident.resolvedAt).toLocaleString(locale)}</span>
                  </div>
                )}
                {incident.responseTime && (
                  <div className="meta-row">
                    <span className="label">{t('Response Time')}</span>
                    <span className="value mono">{incident.responseTime}</span>
                  </div>
                )}
              </div>

              <div className="meta-card actions-card">
                <h3>{t('Workflow')}</h3>

                {isReal ? (
                  <div className="readonly-workflow-notice">
                    <div className="d-flex align-center" style={{ gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      <Lock size={16} />
                      <strong>{t('Edge AI Control Plane')}</strong>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {t('This incident is read-only. Status changes will become available after the authenticated central workflow API is implemented.')}
                    </p>
                  </div>
                ) : (
                  <>
                    {incident.status === 'NEW' && canAcknowledge && (
                      <button className="btn btn-outline w-100" onClick={() => dispatch(acknowledgeDemoIncident(incident.id))}>
                        {t('Acknowledge')}
                      </button>
                    )}
                    {incident.status === 'ACKNOWLEDGED' && canResolve && (
                      <>
                        <button className="btn btn-primary w-100 mb-2" onClick={() => dispatch(resolveDemoIncident(incident.id, 'RESOLVED'))}>
                          {t('Resolve')}
                        </button>
                        <button className="btn btn-outline w-100" onClick={() => dispatch(resolveDemoIncident(incident.id, 'FALSE_POSITIVE'))}>
                          {t('Mark False Positive')}
                        </button>
                      </>
                    )}
                    {incident.status === 'NEW' && !canAcknowledge && (
                      <p className="error" style={{ fontSize: '0.85rem' }}>
                        {t('You need USER or higher permissions to acknowledge.')}
                      </p>
                    )}
                    {incident.status === 'ACKNOWLEDGED' && !canResolve && (
                      <p className="error" style={{ fontSize: '0.85rem' }}>
                        {t('You need ORGANIZATION_ADMIN or higher permissions to resolve.')}
                      </p>
                    )}
                  </>
                )}

                <div className="workflow-history mt-3">
                  <p className="history-item">
                    <span className="time">{new Date(incident.startedAt).toLocaleTimeString(locale)}</span>
                    <span>
                      {isReal 
                        ? t('YOLO edge detector identified threat') 
                        : t('System created incident')}
                    </span>
                  </p>
                  {isReal && evidenceList.length > 0 && (
                    <p className="history-item">
                      <span className="time">{new Date(evidenceList[0].capturedAt || incident.startedAt).toLocaleTimeString(locale)}</span>
                      <span>{t(
                        evidenceList.length === 1
                          ? 'Ingested {{count}} evidence frame'
                          : 'Ingested {{count}} evidence frames',
                        { count: evidenceList.length },
                      )}</span>
                    </p>
                  )}
                  {incident.acknowledgedAt && (
                    <p className="history-item">
                      <span className="time">{new Date(incident.acknowledgedAt).toLocaleTimeString(locale)}</span>
                      <span>{t('Incident acknowledged')}</span>
                    </p>
                  )}
                  {incident.resolvedAt && (
                    <p className="history-item">
                      <span className="time">{new Date(incident.resolvedAt).toLocaleTimeString(locale)}</span>
                      <span>{t('Incident closed as')} {t(incident.status)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IncidentDetails;

