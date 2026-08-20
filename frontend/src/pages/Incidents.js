import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Filter, Search, Grid, List } from 'lucide-react';
import Layout from '../components/Layout';
import './Incidents.scss';

const Incidents = () => {
  const { t } = useTranslation();
  const [view, setView] = useState('table'); // 'table' | 'grid'
  const { incidents } = useSelector(state => state.incidents);

  return (
    <Layout>
      <div className="incidents-page">
        <div className="container">
          <div className="page-header">
            <h2>{t('Incidents')}</h2>
            
            <div className="header-controls">
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder={t('Search incidents...')} />
              </div>
              
              <button className="btn btn-outline filter-btn">
                <Filter size={18} /> {t('Filter')}
              </button>
              
              <div className="view-toggle">
                <button 
                  className={view === 'table' ? 'active' : ''} 
                  onClick={() => setView('table')}
                ><List size={18} /></button>
                <button 
                  className={view === 'grid' ? 'active' : ''} 
                  onClick={() => setView('grid')}
                ><Grid size={18} /></button>
              </div>
            </div>
          </div>

          <div className="incidents-content">
            {view === 'table' ? (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('Incident ID')}</th>
                      <th>{t('Thumbnail')}</th>
                      <th>{t('Camera')}</th>
                      <th>{t('Type')}</th>
                      <th>{t('Time')}</th>
                      <th>{t('Confidence')}</th>
                      <th>{t('Status')}</th>
                      <th>{t('Response Time')}</th>
                      <th>{t('Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map(inc => (
                      <tr key={inc.id}>
                        <td className="mono">{inc.id}</td>
                        <td>
                          <div className="thumbnail-placeholder"></div>
                        </td>
                        <td>{inc.cameraName}</td>
                        <td><span className="badge threat">{t(inc.detectionType)}</span></td>
                        <td>{new Date(inc.startedAt).toLocaleString()}</td>
                        <td className="mono">{(inc.confidence * 100).toFixed(0)}%</td>
                        <td>
                          <span className={`status-badge ${inc.status.toLowerCase()}`}>{t(inc.status.replace('_', ' '))}</span>
                        </td>
                        <td>{inc.responseTime || '-'}</td>
                        <td>
                          <Link to={`/incidents/${inc.id}`} className="btn-link">{t('View Details')}</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="incidents-grid">
                {incidents.map(inc => (
                  <div className="incident-card" key={inc.id}>
                    <div className="card-thumb">
                      <div className="status-overlay">
                        <span className={`status-badge ${inc.status.toLowerCase()}`}>{t(inc.status.replace('_', ' '))}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="card-meta d-flex justify-between">
                        <span className="mono id">{inc.id}</span>
                        <span className="time">{new Date(inc.startedAt).toLocaleTimeString()}</span>
                      </div>
                      <h4>{inc.cameraName}</h4>
                      <div className="card-footer d-flex justify-between align-center">
                        <span className="badge threat">{t(inc.detectionType)}</span>
                        <Link to={`/incidents/${inc.id}`} className="btn-link">{t('View Details')}</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Incidents;
