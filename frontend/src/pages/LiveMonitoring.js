import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ShieldAlert, VideoOff } from 'lucide-react';
import Layout from '../components/Layout';
import { simulateThreat, resolveThreat } from '../redux/slices/simulationSlice';
import './LiveMonitoring.scss';

const LiveMonitoring = () => {
  const dispatch = useDispatch();
  const { isThreatActive, demoCameraStatus } = useSelector(state => state.simulation);

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
                      <div className="sos-title">SECURITY ALERT: Potential Weapon Detected</div>
                      <div className="sos-meta">Demo Camera • {new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <button className="btn btn-outline" style={{borderColor: 'white', color: 'white'}}>View Incident</button>
                </div>
              )}
            </div>

            <div className="side-panel">
              <div className="panel-card">
                <h3>System Status</h3>
                
                <div className="status-item">
                  <span className="label">Camera Health</span>
                  <span className={`value ${demoCameraStatus.toLowerCase()}`}>{demoCameraStatus}</span>
                </div>
                
                <div className="status-item">
                  <span className="label">Detection Engine</span>
                  <span className="value">YOLOv8 — Active</span>
                </div>
                
                <div className="status-item">
                  <span className="label">Detection State</span>
                  {isThreatActive ? (
                    <span className="value error">Active Threat</span>
                  ) : (
                    <span className="value success">No Active Threat</span>
                  )}
                </div>
                
                <div className="status-item">
                  <span className="label">Last Heartbeat</span>
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
