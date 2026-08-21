import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Activity, 
  Tv, 
  Layers, 
  Shield, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal,
  HelpCircle,
  Eye
} from 'lucide-react';
import { fetchCentralCameras } from '../services/centralCameraApi';
import { getLocale } from '../utils/dateHelper';
import './CentralCameraRegistry.scss';

const CentralCameraRegistry = ({ orgFilter = null }) => {
  const { t, i18n } = useTranslation();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCameraId, setExpandedCameraId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pollTimerRef = useRef(null);
  const locale = getLocale(i18n.language);

  const loadCameras = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await fetchCentralCameras();
      setCameras(Array.isArray(data) ? data : []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Failed to load central cameras:', err);
      setError(err.message || t('Central API Unavailable'));
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadCameras();

    // Auto-poll central registry every 5 seconds
    pollTimerRef.current = setInterval(() => {
      loadCameras(false);
    }, 5000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadCameras]);

  const toggleExpand = (cameraId) => {
    setExpandedCameraId(prev => prev === cameraId ? null : cameraId);
  };

  const formatHeartbeat = (timestamp) => {
    if (!timestamp) return t('No heartbeat received');
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return String(timestamp);
    
    const now = new Date();
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
    
    if (diffSeconds < 5) return t('Just now');
    if (diffSeconds < 60) return t('{{seconds}}s ago', { seconds: diffSeconds });
    if (diffSeconds < 3600) return t('{{minutes}}m ago', { minutes: Math.floor(diffSeconds / 60) });
    return date.toLocaleTimeString(locale);
  };

  // Filter cameras
  const filteredCameras = cameras.filter(cam => {
    if (orgFilter && cam.organizationId !== orgFilter) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (cam.name && cam.name.toLowerCase().includes(query)) ||
      (cam.id && cam.id.toLowerCase().includes(query)) ||
      (cam.platform && cam.platform.toLowerCase().includes(query)) ||
      (cam.organizationId && String(cam.organizationId).toLowerCase().includes(query))
    );
  });

  const onlineCount = cameras.filter(c => c.connectionState === 'ONLINE').length;
  const totalCount = cameras.length;

  return (
    <div className="central-camera-registry">
      {/* Registry Top Header / Toolbar */}
      <div className="registry-toolbar">
        <div className="toolbar-left">
          <div className="status-indicator-pill">
            <span className={`pulse-dot ${error ? 'dot-error' : onlineCount > 0 ? 'dot-online' : 'dot-waiting'}`}></span>
            <span className="pill-text">
              {error 
                ? t('Central Control Plane Offline') 
                : t('{{online}} of {{total}} Cameras Online', { online: onlineCount, total: totalCount })
              }
            </span>
          </div>

          {lastUpdated && (
            <span className="last-updated-text">
              <Clock size={13} />
              {t('Synced at')}: {lastUpdated.toLocaleTimeString(locale)}
            </span>
          )}
        </div>

        <div className="toolbar-right">
          <input
            type="text"
            className="search-input"
            placeholder={t('Search by ID or name...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            type="button" 
            className="btn btn-secondary btn-sm refresh-btn"
            onClick={() => loadCameras(true)}
            disabled={isRefreshing}
            title={t('Refresh central cameras')}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
            <span>{t('Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="registry-loading-state">
          <div className="loading-spinner"></div>
          <p>{t('Connecting to central camera registry...')}</p>
        </div>
      )}

      {/* Connection Error State */}
      {!loading && error && (
        <div className="registry-error-banner">
          <div className="error-icon-box">
            <AlertTriangle size={24} />
          </div>
          <div className="error-content">
            <h4>{t('Central API Unavailable')}</h4>
            <p>
              {t('Could not connect to the central camera control plane. Verify that the backend service is running.')}
            </p>
            <span className="error-raw-message">{error}</span>
            <div className="error-actions">
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => loadCameras(true)}
              >
                <RefreshCw size={13} /> {t('Retry Connection')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State with Setup Guidance */}
      {!loading && !error && cameras.length === 0 && (
        <div className="registry-empty-card">
          <div className="empty-icon-box">
            <Camera size={36} />
          </div>
          <h3>{t('No cameras registered yet')}</h3>
          <p className="empty-desc">
            {t('The central camera control plane is active, but no edge camera services have enrolled.')}
          </p>

          <div className="enrollment-guide-box">
            <div className="guide-header">
              <Terminal size={16} />
              <span>{t('How to enroll an edge camera')}</span>
            </div>
            <ol className="guide-steps">
              <li>
                <strong>{t('Set enrollment secret')}:</strong> {t('Ensure EDGE_ENROLLMENT_SECRET is configured in backend environment and detector/.env')}
              </li>
              <li>
                <strong>{t('Launch edge service')}:</strong> {t('Run the camera server in detector/ using run_windows.ps1 or start_windows.cmd')}
              </li>
              <li>
                <strong>{t('Automatic Handshake')}:</strong> {t('The camera will securely register, acquire a per-device token, and start streaming heartbeats')}
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Camera Cards List */}
      {!loading && !error && cameras.length > 0 && (
        <div className="cameras-grid-list">
          {filteredCameras.length === 0 ? (
            <div className="no-filter-match">
              <p>{t('No cameras match the current search query.')}</p>
            </div>
          ) : (
            filteredCameras.map((camera) => {
              const isOnline = camera.connectionState === 'ONLINE';
              const isExpanded = expandedCameraId === camera.id;
              const telemetry = camera.telemetry || {};
              const cameraTelemetry = telemetry.camera || {};
              const detectorTelemetry = telemetry.detector || {};
              const streamTelemetry = telemetry.stream || {};
              const serviceTelemetry = telemetry.service || {};

              const resolution = cameraTelemetry.width && cameraTelemetry.height 
                ? `${cameraTelemetry.width}×${cameraTelemetry.height}` 
                : '—';
              const captureFps = cameraTelemetry.captureFps !== null && cameraTelemetry.captureFps !== undefined
                ? `${Number(cameraTelemetry.captureFps).toFixed(1)} FPS`
                : '—';
              const inferenceMs = detectorTelemetry.inferenceMs !== null && detectorTelemetry.inferenceMs !== undefined
                ? `${Number(detectorTelemetry.inferenceMs).toFixed(1)} ms`
                : '—';
              const detectionCount = telemetry.detectionCount ?? 0;
              const safeError = cameraTelemetry.error || detectorTelemetry.error;

              return (
                <div key={camera.id} className={`camera-record-card ${isOnline ? 'card-online' : 'card-offline'}`}>
                  {/* Card Main Bar */}
                  <div className="card-primary-row">
                    <div className="camera-identity">
                      <div className="camera-avatar">
                        <Camera size={20} />
                      </div>
                      <div className="camera-names">
                        <div className="name-and-badges">
                          <h4 className="camera-name">{camera.name || t('Unnamed Camera')}</h4>
                          <span className={`status-pill ${isOnline ? 'pill-active' : 'pill-offline'}`}>
                            {isOnline ? (
                              <><Wifi size={11} /> {t('ONLINE')}</>
                            ) : (
                              <><WifiOff size={11} /> {t('OFFLINE')}</>
                            )}
                          </span>
                          <span className="scope-pill">{camera.scope || 'LOCAL'}</span>
                        </div>
                        <div className="camera-id-row">
                          <code className="camera-id-code" title={camera.id}>{camera.id}</code>
                          <span className="org-label">
                            <Shield size={12} /> {t('Org')}: #{camera.organizationId || '1'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="camera-quick-metrics">
                      <div className="quick-metric-item">
                        <span className="q-label">{t('Last Heartbeat')}</span>
                        <span className="q-val">{formatHeartbeat(camera.lastHeartbeatAt)}</span>
                      </div>

                      <div className="quick-metric-item">
                        <span className="q-label">{t('Resolution / FPS')}</span>
                        <span className="q-val">{resolution} · {captureFps}</span>
                      </div>

                      <div className="quick-metric-item">
                        <span className="q-label">{t('AI Engine')}</span>
                        <span className="q-val highlight">{detectorTelemetry.state || 'UNKNOWN'} ({inferenceMs})</span>
                      </div>
                    </div>

                    <div className="camera-card-actions">
                      <Link 
                        to="/live-monitoring" 
                        className="btn btn-outline btn-sm action-link-btn"
                        title={t('View in Live Monitoring')}
                      >
                        <Eye size={14} />
                        <span>{t('View Stream')}</span>
                      </Link>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm details-toggle-btn"
                        onClick={() => toggleExpand(camera.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>{isExpanded ? t('Less') : t('Telemetry')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Safe Error Alert Banner on Card if present */}
                  {safeError && (
                    <div className="card-error-notice">
                      <AlertTriangle size={14} />
                      <span>{t('Safe Error')}: {safeError}</span>
                    </div>
                  )}

                  {/* Expanded Telemetry Drawer */}
                  {isExpanded && (
                    <div className="card-expanded-telemetry">
                      <div className="telemetry-grid">
                        <div className="telemetry-block">
                          <h5><Cpu size={14} /> {t('Camera Hardware Status')}</h5>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Hardware State')}:</span>
                            <span className="field-val">{cameraTelemetry.state || 'UNKNOWN'}</span>
                          </div>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Video Source')}:</span>
                            <span className="field-val mono">{String(cameraTelemetry.source ?? '0')}</span>
                          </div>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Capture Backend')}:</span>
                            <span className="field-val">{cameraTelemetry.backend || 'AUTO'}</span>
                          </div>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Capture FPS')}:</span>
                            <span className="field-val">{captureFps}</span>
                          </div>
                        </div>

                        <div className="telemetry-block">
                          <h5><Activity size={14} /> {t('AI Detector Status')}</h5>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Detector State')}:</span>
                            <span className={`field-val ${detectorTelemetry.state === 'READY' ? 'text-success' : ''}`}>
                              {detectorTelemetry.state || 'UNKNOWN'}
                            </span>
                          </div>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Model Path')}:</span>
                            <span className="field-val mono">{detectorTelemetry.model || 'yolov8n.pt'}</span>
                          </div>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Inference Latency')}:</span>
                            <span className="field-val">{inferenceMs}</span>
                          </div>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Target Detections')}:</span>
                            <span className="field-val">{detectionCount}</span>
                          </div>
                        </div>

                        <div className="telemetry-block">
                          <h5><Tv size={14} /> {t('Stream & Edge Host')}</h5>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Stream State')}:</span>
                            <span className="field-val">{streamTelemetry.state || 'UNKNOWN'}</span>
                          </div>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Active Clients')}:</span>
                            <span className="field-val">{streamTelemetry.clients ?? 0}</span>
                          </div>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Host Platform')}:</span>
                            <span className="field-val">{camera.platform || serviceTelemetry.platform || 'Windows'}</span>
                          </div>
                          <div className="telemetry-field">
                            <span className="field-label">{t('Edge Version')}:</span>
                            <span className="field-val mono">v{camera.edgeVersion || '0.2.0'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="telemetry-footer-bar">
                        <span>{t('Registered At')}: {camera.registeredAt ? new Date(camera.registeredAt).toLocaleString(locale) : '—'}</span>
                        <span>{t('Edge Timestamp')}: {telemetry.edgeTimestamp ? new Date(telemetry.edgeTimestamp).toLocaleTimeString(locale) : '—'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CentralCameraRegistry;
