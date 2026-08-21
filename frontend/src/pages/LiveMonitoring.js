import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Maximize2, ShieldAlert, WifiOff } from 'lucide-react';
import { getLocale } from '../utils/dateHelper';
import { fetchDetectorStatus, getDetectorStreamUrl } from '../services/detectorApi';
import Layout from '../components/Layout';
import './LiveMonitoring.scss';

const LiveMonitoring = () => {
  const { t, i18n } = useTranslation();
  const { isThreatActive } = useSelector(state => state.simulation);
  const { incidents } = useSelector(state => state.incidents);
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());
  const [detectorStatus, setDetectorStatus] = useState(null);
  const [detectorReachable, setDetectorReachable] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [streamNonce, setStreamNonce] = useState(Date.now());
  const [connectionError, setConnectionError] = useState(null);
  const feedRef = useRef(null);
  const retryTimerRef = useRef(null);
  const locale = getLocale(i18n.language);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;

    const refreshStatus = async () => {
      try {
        const nextStatus = await fetchDetectorStatus();
        if (!mounted) return;
        setDetectorStatus(nextStatus);
        setDetectorReachable(true);
        setConnectionError(null);
      } catch (error) {
        if (!mounted) return;
        setDetectorReachable(false);
        setStreamReady(false);
        setConnectionError(error.message);
      }
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, []);

  const cameraOnline = detectorReachable && detectorStatus?.camera?.state === 'ONLINE';
  const detectorReady = detectorStatus?.detector?.state === 'READY';
  const detections = detectorStatus?.detections || [];
  const detectionCount = detections.length;
  const detectedLabel = detections[0]?.label || 'bottle';
  const cameraName = detectorStatus?.camera?.name || t('Main Gate (Cam-01)');
  const captureFps = detectorStatus?.camera?.captureFps || 0;
  const inferenceMs = detectorStatus?.detector?.inferenceMs || 0;
  const resolution = detectorStatus?.camera?.width && detectorStatus?.camera?.height
    ? `${detectorStatus.camera.width}×${detectorStatus.camera.height}`
    : '—';

  const handleStreamError = () => {
    setStreamReady(false);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => setStreamNonce(Date.now()), 2000);
  };

  const openFullscreen = () => {
    if (feedRef.current?.requestFullscreen) {
      feedRef.current.requestFullscreen();
    }
  };

  const activeIncident = incidents.find(i => i.status !== 'RESOLVED' && i.status !== 'FALSE_POSITIVE');

  return (
    <Layout>
      <div className="live-monitoring">
        <div className="container">
          <div className="page-header d-flex justify-between align-center" style={{marginBottom: '1.5rem'}}>
            <h2>{t('Live Feed')}</h2>
            <div className="view-controls">
              <button className="btn btn-outline btn-sm" onClick={openFullscreen} title={t('Fullscreen')}>
                <Maximize2 size={16}/>
              </button>
            </div>
          </div>

          <div className="monitoring-layout">
            <div className="main-feed">
              <div ref={feedRef} className={`video-container ${isThreatActive ? 'alert' : ''}`}>
                <div className="video-placeholder">
                  {!streamReady && (
                    <div className="offline-state">
                      <WifiOff size={48} />
                      <p>{cameraOnline ? t('Connecting to camera stream') : t('NO SIGNAL')}</p>
                      <span>{connectionError || detectorStatus?.camera?.error || t('Start the edge detector service')}</span>
                    </div>
                  )}
                </div>

                {detectorReachable && (
                  <img
                    key={streamNonce}
                    className={`stream-frame ${streamReady ? 'visible' : ''}`}
                    src={getDetectorStreamUrl(streamNonce)}
                    alt={t('Real camera stream')}
                    onLoad={() => setStreamReady(true)}
                    onError={handleStreamError}
                  />
                )}

                {streamReady && (
                  <>
                    <div className="hud-overlay top-left">
                      <div className="rec-badge">
                        <span className="dot"></span>
                        <span>REC</span>
                      </div>
                      <div className="camera-name">{cameraName}</div>
                    </div>

                    <div className="hud-overlay top-right">
                      <span className={`status ${cameraOnline ? 'online' : 'offline'}`}>
                        {t(cameraOnline ? 'ONLINE' : 'OFFLINE')}
                      </span>
                      <div className="quality">{resolution} | {captureFps.toFixed(1)} FPS</div>
                    </div>

                    <div className="hud-overlay bottom-left">
                      <div className="timestamp">{timeStr}</div>
                      <div className="engine">
                        {detectorReady ? `YOLOv8 Edge · ${inferenceMs.toFixed(1)}ms` : t('YOLO model is loading')}
                      </div>
                    </div>

                    <div className="hud-overlay bottom-right">
                      <div className="latency">{t('Inference')}: {inferenceMs.toFixed(1)}ms</div>
                    </div>
                  </>
                )}
              </div>

              {isThreatActive && (
                <div className="sos-banner">
                  <div className="sos-content">
                    <ShieldAlert size={28} />
                    <div>
                      <div className="sos-title">{t('SECURITY ALERT: Potential Weapon Detected')}</div>
                      <div className="sos-meta">
                        {t('Camera: {{camera}}. Confidence: {{confidence}}%', { camera: 'Main Gate (Cam-01)', confidence: 94 })}
                      </div>
                    </div>
                  </div>
                  {activeIncident && (
                    <Link to={`/incidents/${activeIncident.id}`} className="btn btn-secondary btn-sm">
                      {t('View Details')}
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="side-panel">
              <div className="panel-card">
                <h3>{t('System Status')}</h3>
                <div className="status-item">
                  <span className="label">{t('Camera Health')}</span>
                  <span className={`value ${cameraOnline ? 'online' : 'offline'}`}>
                    {t(cameraOnline ? 'ONLINE' : 'OFFLINE')}
                  </span>
                </div>
                <div className="status-item">
                  <span className="label">{t('Detection Engine')}</span>
                  <span className={`value ${detectorReady ? 'online' : ''}`}>
                    {t(detectorStatus?.detector?.state || 'DISCONNECTED')}
                  </span>
                </div>
                <div className="status-item">
                  <span className="label">{t('Detection State')}</span>
                  <span className={`value ${detectionCount > 0 ? 'error' : 'online'}`}>
                    {detectionCount > 0
                      ? t('Target object detected', { count: detectionCount, label: t(detectedLabel) })
                      : t('No target objects')}
                  </span>
                </div>
                <div className="status-item">
                  <span className="label">{t('Last Heartbeat')}</span>
                  <span className="value">
                    {detectorReachable ? new Date(detectorStatus?.heartbeatAt).toLocaleTimeString(locale) : '—'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="label">{t('Camera Source')}</span>
                  <span className="value mono">{String(detectorStatus?.camera?.source ?? '—')}</span>
                </div>
                <p className="stage-note">{t('When central delivery is configured, confirmed target detections create incidents automatically.')}</p>
              </div>

              {isThreatActive && activeIncident && (
                <div className="panel-card">
                  <h3><ShieldAlert size={18} style={{marginRight: '6px', verticalAlign: 'middle', color: 'var(--red-holberton)'}}/> {t('Active Incident')}</h3>
                  <div className="status-item">
                    <span className="label">{t('Incident ID')}</span>
                    <span className="value">#{activeIncident.id}</span>
                  </div>
                  <div className="status-item">
                    <span className="label">{t('Type')}</span>
                    <span className="value error">{t(activeIncident.detectionType)}</span>
                  </div>
                  <div className="status-item">
                    <span className="label">{t('Confidence')}</span>
                    <span className="value">{(activeIncident.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Link to={`/incidents/${activeIncident.id}`} className="btn btn-primary w-100 mt-3" style={{display: 'block', textAlign: 'center'}}>
                    {t('View Details')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveMonitoring;
