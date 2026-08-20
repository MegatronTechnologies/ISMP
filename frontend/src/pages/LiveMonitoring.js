import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { ShieldAlert, VideoOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import './LiveMonitoring.scss';

const LiveMonitoring = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isThreatActive, demoCameraStatus } = useSelector(state => state.simulation);
  const { incidents } = useSelector(state => state.incidents);
  
  // Find active incident if any
  const activeIncident = incidents.find(i => i.status === 'NEW' || i.status === 'ACKNOWLEDGED');

  return (
    <Layout>
      <div className="live-monitoring">
        <div className="container">
          <div className="monitoring-layout">
            
            <div className="main-feed">
              <div className={`video-container ${isThreatActive ? 'alert' : ''}`}>
                <div className="hud-overlay top-left">
                  <div className="rec-badge"><span className="dot"></span> REC</div>
                  <div className="quality">1080p | 30 FPS</div>
                </div>
                
                <div className="hud-overlay top-right text-right">
                  <div className="engine">YOLOv8: Active</div>
                  <div className="latency">14ms</div>
                </div>
                
                <div className="hud-overlay bottom-left">
                  <div className="timestamp">{new Date().toLocaleString()}</div>
                  <div className="camera-name">Demo Camera • GLOBAL</div>
                </div>
                
                <div className="hud-overlay bottom-right">
                  <div className={`status ${demoCameraStatus.toLowerCase()}`}>{demoCameraStatus}</div>
                </div>

                {isThreatActive && (
                  <div className="bounding-box weapon">
                    <span className="label">WEAPON 94%</span>
                  </div>
                )}
                
                {/* Fallback pattern for video */}
                <div className="video-placeholder">
                  {demoCameraStatus === 'ONLINE' ? (
                    <div className="grid-pattern"></div>
                  ) : (
                    <div className="offline-state">
                      <VideoOff size={48} />
                      <span>NO SIGNAL</span>
                    </div>
                  )}
                </div>
              </div>

              {isThreatActive && (
                <div className="sos-banner">
                  <div className="sos-content">
                    <ShieldAlert size={28} />
                    <div className="sos-text">
                      <div className="sos-title">{t('SECURITY ALERT: Potential Weapon Detected')}</div>
                      <div className="sos-meta">Demo Camera • {new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                  {activeIncident && (
                    <Link to={`/incidents/${activeIncident.id}`} className="btn btn-outline" style={{borderColor: 'white', color: 'white', textDecoration: 'none'}}>
                      {t('View Incident')}
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
                  <span className={`value ${demoCameraStatus.toLowerCase()}`}>{demoCameraStatus}</span>
                </div>
                
                <div className="status-item">
                  <span className="label">{t('Detection Engine')}</span>
                  <span className="value">YOLOv8 — Active</span>
                </div>
                
                <div className="status-item">
                  <span className="label">{t('Detection State')}</span>
                  {isThreatActive ? (
                    <span className="value error">{t('Active Threat')}</span>
                  ) : (
                    <span className="value success">{t('No Active Threat')}</span>
                  )}
                </div>
                
                <div className="status-item">
                  <span className="label">{t('Last Heartbeat')}</span>
                  <span className="value mono">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveMonitoring;
