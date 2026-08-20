import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { Camera, MapPin, Activity, ShieldAlert, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import './Incidents.scss';

const IncidentDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  // Mock specific incident
  const incident = {
    id: id || 'INC-1042',
    camera: 'Demo Camera',
    scope: 'GLOBAL',
    type: 'WEAPON',
    conf: '94%',
    startTime: '2026-08-20T10:30:12Z',
    endTime: '2026-08-20T10:30:45Z',
    status: 'NEW',
    responseTime: '-',
  };

  return (
    <Layout>
      <div className="incident-details">
        <div className="container">
          <div className="page-header">
            <Link to="/incidents" className="back-link"><ArrowLeft size={18} /> Back to Incidents</Link>
            <div className="d-flex justify-between align-center" style={{marginTop: '1rem'}}>
              <h2>Incident {incident.id}</h2>
              <span className={`status-badge \${incident.status.toLowerCase()}`}>{incident.status}</span>
            </div>
          </div>

          <div className="details-layout">
            <div className="media-panel">
              <div className="video-player">
                <div className="video-placeholder">
                  <span className="mono">RECORDING UNAVAILABLE (SIMULATION)</span>
                </div>
              </div>
              <div className="thumbnail-gallery">
                <h4>Keyframes</h4>
                <div className="thumbs">
                  <div className="thumb-item active"></div>
                  <div className="thumb-item"></div>
                  <div className="thumb-item"></div>
                </div>
              </div>
            </div>

            <div className="meta-panel">
              <div className="meta-card">
                <h3>Details</h3>
                <div className="meta-row">
                  <span className="label"><Camera size={16}/> Camera</span>
                  <span className="value">{incident.camera}</span>
                </div>
                <div className="meta-row">
                  <span className="label"><MapPin size={16}/> Scope</span>
                  <span className="value mono">{incident.scope}</span>
                </div>
                <div className="meta-row">
                  <span className="label"><ShieldAlert size={16}/> Threat Type</span>
                  <span className="value error">{incident.type}</span>
                </div>
                <div className="meta-row">
                  <span className="label"><Activity size={16}/> Confidence</span>
                  <span className="value mono">{incident.conf}</span>
                </div>
                <div className="meta-row">
                  <span className="label">Start Time</span>
                  <span className="value">{new Date(incident.startTime).toLocaleString()}</span>
                </div>
                <div className="meta-row">
                  <span className="label">End Time</span>
                  <span className="value">{new Date(incident.endTime).toLocaleString()}</span>
                </div>
              </div>

              <div className="meta-card actions-card">
                <h3>Workflow</h3>
                {incident.status === 'NEW' && (
                  <button className="btn btn-outline w-100">Acknowledge</button>
                )}
                {incident.status === 'ACKNOWLEDGED' && (
                  <>
                    <button className="btn btn-primary w-100 mb-2">Resolve</button>
                    <button className="btn btn-outline w-100">Mark False Positive</button>
                  </>
                )}
                <div className="workflow-history mt-3">
                  <p className="history-item">
                    <span className="time">{new Date(incident.startTime).toLocaleTimeString()}</span>
                    <span>System created incident</span>
                  </p>
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
