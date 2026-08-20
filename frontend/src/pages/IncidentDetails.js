import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Camera, MapPin, Activity, ShieldAlert, ArrowLeft } from 'lucide-react';
import { acknowledgeDemoIncident, resolveDemoIncident } from '../redux/actions/demoActions';
import { getLocale } from '../utils/dateHelper';
import Layout from '../components/Layout';
import './Incidents.scss';

const IncidentDetails = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { incidents } = useSelector(state => state.incidents);
  const { user } = useSelector(state => state.auth);
  const locale = getLocale(i18n.language);

  const incident = incidents.find(i => i.id === id);

  if (!incident) {
    return (
      <Layout>
        <div className="container" style={{padding: '2rem 0'}}>
          <h2>{t('Incident not found')}</h2>
          <Link to="/incidents" className="btn btn-outline" style={{marginTop: '1rem'}}>{t('Back to Incidents')}</Link>
        </div>
      </Layout>
    );
  }

  const canAcknowledge = user && (user.role === 'USER' || user.role === 'ORGANIZATION_ADMIN' || user.role === 'SUPERADMIN');
  const canResolve = user && (user.role === 'ORGANIZATION_ADMIN' || user.role === 'SUPERADMIN');

  return (
    <Layout>
      <div className="incident-details">
        <div className="container">
          <div className="page-header">
            <Link to="/incidents" className="back-link"><ArrowLeft size={18} /> {t('Back to Incidents')}</Link>
            <div className="d-flex justify-between align-center" style={{marginTop: '1rem'}}>
              <h2>{t('Incident')} {incident.id}</h2>
              <span className={`status-badge ${incident.status.toLowerCase()}`}>{t(incident.status)}</span>
            </div>
          </div>

          <div className="details-layout">
            <div className="media-panel">
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
            </div>

            <div className="meta-panel">
              <div className="meta-card">
                <h3>{t('Details')}</h3>
                <div className="meta-row">
                  <span className="label"><Camera size={16}/> {t('Camera')}</span>
                  <span className="value">{incident.cameraName}</span>
                </div>
                <div className="meta-row">
                  <span className="label"><MapPin size={16}/> {t('Scope')}</span>
                  <span className="value mono">{incident.cameraScope}</span>
                </div>
                <div className="meta-row">
                  <span className="label"><ShieldAlert size={16}/> {t('Threat Type')}</span>
                  <span className="value error">{t(incident.detectionType)}</span>
                </div>
                <div className="meta-row">
                  <span className="label"><Activity size={16}/> {t('Confidence')}</span>
                  <span className="value mono">{(incident.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="meta-row">
                  <span className="label">{t('Start Time')}</span>
                  <span className="value">{new Date(incident.startedAt).toLocaleString(locale)}</span>
                </div>
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
                {incident.status === 'NEW' && canAcknowledge && (
                  <button className="btn btn-outline w-100" onClick={() => dispatch(acknowledgeDemoIncident(incident.id))}>{t('Acknowledge')}</button>
                )}
                {incident.status === 'ACKNOWLEDGED' && canResolve && (
                  <>
                    <button className="btn btn-primary w-100 mb-2" onClick={() => dispatch(resolveDemoIncident(incident.id, 'RESOLVED'))}>{t('Resolve')}</button>
                    <button className="btn btn-outline w-100" onClick={() => dispatch(resolveDemoIncident(incident.id, 'FALSE_POSITIVE'))}>{t('Mark False Positive')}</button>
                  </>
                )}
                {incident.status === 'NEW' && !canAcknowledge && (
                  <p className="error" style={{fontSize: '0.85rem'}}>{t('You need USER or higher permissions to acknowledge.')}</p>
                )}
                {incident.status === 'ACKNOWLEDGED' && !canResolve && (
                  <p className="error" style={{fontSize: '0.85rem'}}>{t('You need ORGANIZATION_ADMIN or higher permissions to resolve.')}</p>
                )}
                <div className="workflow-history mt-3">
                  <p className="history-item">
                    <span className="time">{new Date(incident.startedAt).toLocaleTimeString(locale)}</span>
                    <span>{t('System created incident')}</span>
                  </p>
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
