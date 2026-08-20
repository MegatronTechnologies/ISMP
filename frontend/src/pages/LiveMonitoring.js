import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Camera, Maximize2, ShieldAlert, Activity, Wifi, WifiOff } from 'lucide-react';
import { getLocale } from '../utils/dateHelper';
import Layout from '../components/Layout';
import './LiveMonitoring.scss';

const LiveMonitoring = () => {
  const { t, i18n } = useTranslation();
  const { isThreatActive, demoCameraStatus } = useSelector(state => state.simulation);
  const { incidents } = useSelector(state => state.incidents);
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());
  const locale = getLocale(i18n.language);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeIncident = incidents.find(i => i.status !== 'RESOLVED' && i.status !== 'FALSE_POSITIVE');

  return (
    <Layout>
      <div className="live-monitoring">
        <div className="container">
          <div className="page-header d-flex justify-between align-center" style={{marginBottom: '1.5rem'}}>
            <h2>{t('Live Feed')}</h2>
            <div className="view-controls">
              <button className="btn btn-outline btn-sm"><Maximize2 size={16}/></button>
            </div>
          </div>

          <div className="monitoring-layout">
            <div className="main-feed">
              <div className={`video-container ${isThreatActive ? 'alert' : ''}`}>
                <div className="video-placeholder">
                  {demoCameraStatus === 'ONLINE' ? (
                    <div className="grid-pattern"></div>
                  ) : (
                    <div className="offline-state">
                      <WifiOff size={48} />
                      <p>{t('NO SIGNAL')}</p>
                    </div>
                  )}
                </div>

                {demoCameraStatus === 'ONLINE' && (
                  <>
                    <div className="hud-overlay top-left">
                      <div className="rec-badge">
                        <span className="dot"></span>
                        <span>REC</span>
                      </div>
                      <div className="camera-name">{t('Main Gate (Cam-01)')}</div>
                    </div>

                    <div className="hud-overlay top-right">
                      <span className={`status ${demoCameraStatus === 'ONLINE' ? 'online' : 'offline'}`}>
                        {t(demoCameraStatus)}
                      </span>
                      <div className="quality">1080P | 30FPS</div>
                    </div>

                    <div className="hud-overlay bottom-left">
                      <div className="timestamp">{timeStr}</div>
                      <div className="engine">YOLOv8 Edge · 12ms</div>
                    </div>

                    <div className="hud-overlay bottom-right">
                      <div className="latency">LATENCY: 12ms</div>
                    </div>

                    {isThreatActive && (
                      <div className="bounding-box weapon">
                        <span className="label">
                          <ShieldAlert size={12} style={{marginRight: '4px', verticalAlign: 'middle'}} />
                          {t('WEAPON')} 94%
                        </span>
                      </div>
                    )}
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
                  <span className={`value ${demoCameraStatus === 'ONLINE' ? 'online' : 'offline'}`}>
                    {t(demoCameraStatus)}
                  </span>
                </div>
                <div className="status-item">
                  <span className="label">{t('Detection Engine')}</span>
                  <span className="value">YOLOv8 Edge</span>
                </div>
                <div className="status-item">
                  <span className="label">{t('Detection State')}</span>
                  <span className={`value ${isThreatActive ? 'error' : 'online'}`}>
                    {isThreatActive ? t('Active Threat') : t('No Active Threat')}
                  </span>
                </div>
                <div className="status-item">
                  <span className="label">{t('Last Heartbeat')}</span>
                  <span className="value">12ms ago</span>
                </div>
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
