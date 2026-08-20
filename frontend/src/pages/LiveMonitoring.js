import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Camera, Maximize2, ShieldAlert, Activity, Wifi, WifiOff } from 'lucide-react';
import Layout from '../components/Layout';
import './LiveMonitoring.scss';

const LiveMonitoring = () => {
  const { t } = useTranslation();
  const { isThreatActive, demoCameraStatus } = useSelector(state => state.simulation);
  const { incidents } = useSelector(state => state.incidents);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let interval;
    if (demoCameraStatus === 'ONLINE') {
      interval = setInterval(() => setPulse(p => !p), 1000);
    }
    return () => clearInterval(interval);
  }, [demoCameraStatus]);

  const activeIncident = incidents.find(i => i.status !== 'RESOLVED' && i.status !== 'FALSE_POSITIVE');

  return (
    <Layout>
      <div className="live-monitoring">
        <div className="container">
          <div className="page-header d-flex justify-between align-center">
            <h2>{t('Live Feed')}</h2>
            <div className="view-controls">
              <button className="btn btn-outline btn-sm"><Maximize2 size={16}/></button>
            </div>
          </div>

          <div className="monitoring-layout">
            <div className="video-grid">
              <div className={`video-container ${isThreatActive ? 'threat-active' : ''}`}>
                <div className="video-overlay">
                  <div className="camera-info">
                    <span className="name">Main Gate (Cam-01)</span>
                    <span className="location">Zone A - Global</span>
                  </div>
                  <div className="status-indicators">
                    {demoCameraStatus === 'ONLINE' ? (
                      <span className={`badge success ${pulse ? 'pulse' : ''}`}><Wifi size={12}/> {t('ONLINE')}</span>
                    ) : (
                      <span className="badge error"><WifiOff size={12}/> {t('OFFLINE')}</span>
                    )}
                  </div>
                </div>

                {demoCameraStatus === 'OFFLINE' ? (
                   <div className="offline-placeholder">
                     <WifiOff size={48} />
                     <p>{t('NO SIGNAL')}</p>
                   </div>
                ) : (
                  <div className="simulated-feed">
                    <div className="grid-overlay"></div>
                    {isThreatActive && (
                      <div className="threat-bounding-box" style={{top: '30%', left: '40%', width: '150px', height: '250px'}}>
                        <div className="label">
                          <ShieldAlert size={14} /> 
                          {t('WEAPON')} 94%
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="side-panel">
              <div className="panel-card">
                <h3>{t('System Status')}</h3>
                <div className="status-row">
                  <span className="label">{t('Camera Health')}</span>
                  <span className={`value ${demoCameraStatus === 'ONLINE' ? 'success' : 'error'}`}>{t(demoCameraStatus)}</span>
                </div>
                <div className="status-row">
                  <span className="label">{t('Detection Engine')}</span>
                  <span className="value">YOLOv8 Edge</span>
                </div>
                <div className="status-row">
                  <span className="label">{t('Detection State')}</span>
                  <span className={`value ${isThreatActive ? 'error' : 'success'}`}>
                    {isThreatActive ? t('Active Threat') : t('No Active Threat')}
                  </span>
                </div>
                <div className="status-row">
                  <span className="label">{t('Last Heartbeat')}</span>
                  <span className="value mono">12ms ago</span>
                </div>
              </div>

              {isThreatActive && activeIncident && (
                <div className="panel-card threat-card">
                  <h3><ShieldAlert size={18}/> {t('Active Incident')}</h3>
                  <div className="threat-details">
                    <p><strong>{t('ID')}:</strong> {activeIncident.id}</p>
                    <p><strong>{t('Type')}:</strong> {t(activeIncident.detectionType)}</p>
                    <p><strong>{t('Confidence')}:</strong> {(activeIncident.confidence * 100).toFixed(0)}%</p>
                    <button className="btn btn-primary w-100 mt-2" onClick={() => window.location.href=`/incidents/${activeIncident.id}`}>{t('View Incident')}</button>
                  </div>
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
