import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Filter, Search, Grid, List } from 'lucide-react';
import Layout from '../components/Layout';
import './Incidents.scss';

const mockIncidents = [
  { id: 'INC-1042', camera: 'Demo Camera', type: 'WEAPON', time: '10 mins ago', status: 'NEW', response: '-', conf: '94%' },
  { id: 'INC-1041', camera: 'Demo Camera', type: 'WEAPON', time: '1 hour ago', status: 'ACKNOWLEDGED', response: '45s', conf: '91%' },
  { id: 'INC-1040', camera: 'Demo Camera', type: 'WEAPON', time: '5 hours ago', status: 'RESOLVED', response: '2m', conf: '88%' },
  { id: 'INC-1039', camera: 'North Gate', type: 'WEAPON', time: '1 day ago', status: 'FALSE_POSITIVE', response: '30s', conf: '76%' },
];

const Incidents = () => {
  const { t } = useTranslation();
  const [view, setView] = useState('table'); // 'table' | 'grid'

  return (
    <Layout>
      <div className="incidents-page">
        <div className="container">
          <div className="page-header">
            <h2>{t('Incidents')}</h2>
            
            <div className="header-controls">
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="Search incidents..." />
              </div>
              
              <button className="btn btn-outline filter-btn">
                <Filter size={18} /> Filter
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
                      <th>Incident ID</th>
                      <th>Thumbnail</th>
                      <th>Camera</th>
                      <th>Type</th>
                      <th>Time</th>
                      <th>Confidence</th>
                      <th>Status</th>
                      <th>Response Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockIncidents.map(inc => (
                      <tr key={inc.id}>
                        <td className="mono">{inc.id}</td>
                        <td>
                          <div className="thumbnail-placeholder"></div>
                        </td>
                        <td>{inc.camera}</td>
                        <td><span className="badge threat">{inc.type}</span></td>
                        <td>{inc.time}</td>
                        <td className="mono">{inc.conf}</td>
                        <td>
                          <span className={`status-badge ${inc.status.toLowerCase()}`}>{inc.status.replace('_', ' ')}</span>
                        </td>
                        <td>{inc.response}</td>
                        <td>
                          <Link to={`/incidents/${inc.id}`} className="btn-link">View Details</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="incidents-grid">
                {mockIncidents.map(inc => (
                  <div className="incident-card" key={inc.id}>
                    <div className="card-thumb">
                      <div className="status-overlay">
                        <span className={`status-badge ${inc.status.toLowerCase()}`}>{inc.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="card-meta d-flex justify-between">
                        <span className="mono id">{inc.id}</span>
                        <span className="time">{inc.time}</span>
                      </div>
                      <h4>{inc.camera}</h4>
                      <div className="card-footer d-flex justify-between align-center">
                        <span className="badge threat">{inc.type}</span>
                        <Link to={`/incidents/${inc.id}`} className="btn-link">View Details</Link>
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
