import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Search, 
  Grid, 
  List, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Camera, 
  ShieldAlert, 
  Cpu, 
  ImageIcon,
  Filter,
  Video
} from 'lucide-react';
import { getLocale } from '../utils/dateHelper';
import { resolveEvidenceUrl, fetchCentralIncidents } from '../services/centralIncidentApi';
import { setRealIncidents, setIncidentSyncError } from '../redux/slices/incidentSlice';
import Layout from '../components/Layout';
import './Incidents.scss';

const Incidents = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [view, setView] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [brokenImages, setBrokenImages] = useState({});

  const { incidents, error: syncError, lastSyncedAt } = useSelector((state) => state.incidents);
  const locale = getLocale(i18n.language);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      const data = await fetchCentralIncidents();
      dispatch(setRealIncidents(data));
    } catch (err) {
      dispatch(setIncidentSyncError(err.message || 'Manual refresh failed'));
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const handleImageError = (id) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Status filter
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter === 'YOLO_EDGE' && inc.source !== 'YOLO_EDGE') {
        return false;
      }
      if (sourceFilter === 'SIMULATED' && inc.source === 'YOLO_EDGE') {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        (inc.id && inc.id.toLowerCase().includes(query)) ||
        (inc.cameraName && inc.cameraName.toLowerCase().includes(query)) ||
        (inc.cameraId && inc.cameraId.toLowerCase().includes(query)) ||
        (inc.detectionType && inc.detectionType.toLowerCase().includes(query)) ||
        (inc.status && inc.status.toLowerCase().includes(query)) ||
        (inc.source && inc.source.toLowerCase().includes(query))
      );
    });
  }, [incidents, statusFilter, sourceFilter, searchQuery]);

  const realIncidentsCount = incidents.filter((i) => i.source === 'YOLO_EDGE').length;
  const simulatedIncidentsCount = incidents.length - realIncidentsCount;

  return (
    <Layout>
      <div className="incidents-page">
        <div className="container">
          {/* Header Toolbar */}
          <div className="page-header">
            <div className="header-title-block">
              <h2>{t('Incidents')}</h2>
              <div className="header-sync-pill">
                <span className={`pulse-dot ${syncError ? 'dot-error' : 'dot-online'}`}></span>
                <span className="sync-text">
                  {syncError 
                    ? t('Sync Warning: Showing cached incidents') 
                    : t('{{total}} incidents ({{central}} central, {{simulated}} simulated)', {
                        total: incidents.length,
                        central: realIncidentsCount,
                        simulated: simulatedIncidentsCount,
                      })
                  }
                </span>
                {lastSyncedAt && (
                  <span className="last-sync-time">
                    <Clock size={12} />
                    {new Date(lastSyncedAt).toLocaleTimeString(locale)}
                  </span>
                )}
              </div>
            </div>

            <div className="header-controls">
              <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder={t('Search incidents...')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="filter-select-wrapper">
                <select 
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">{t('All Statuses')}</option>
                  <option value="NEW">{t('NEW')}</option>
                  <option value="ACKNOWLEDGED">{t('ACKNOWLEDGED')}</option>
                  <option value="RESOLVED">{t('RESOLVED')}</option>
                  <option value="FALSE_POSITIVE">{t('FALSE_POSITIVE')}</option>
                </select>
              </div>

              {/* Source Filter */}
              <div className="filter-select-wrapper">
                <select 
                  className="filter-select"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="ALL">{t('All Sources')}</option>
                  <option value="YOLO_EDGE">{t('Edge AI (YOLO)')}</option>
                  <option value="SIMULATED">{t('Simulated')}</option>
                </select>
              </div>

              <button 
                type="button"
                className="btn btn-outline btn-sm refresh-incidents-btn"
                onClick={handleManualRefresh}
                disabled={isManualRefreshing}
                title={t('Refresh central incidents')}
              >
                <RefreshCw size={14} className={isManualRefreshing ? 'spin-icon' : ''} />
                <span>{t('Refresh')}</span>
              </button>

              <div className="view-toggle">
                <button 
                  type="button"
                  className={view === 'table' ? 'active' : ''} 
                  onClick={() => setView('table')}
                  title={t('Table view')}
                >
                  <List size={18} />
                </button>
                <button 
                  type="button"
                  className={view === 'grid' ? 'active' : ''} 
                  onClick={() => setView('grid')}
                  title={t('Grid view')}
                >
                  <Grid size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Sync Error Banner if any */}
          {syncError && (
            <div className="incidents-sync-error-banner">
              <AlertTriangle size={18} />
              <div className="error-text">
                <strong>{t('Central API Notice')}:</strong> {syncError}. {t('Showing available records.')}
              </div>
              <button 
                type="button"
                className="btn btn-outline btn-sm retry-btn"
                onClick={handleManualRefresh}
              >
                <RefreshCw size={13} /> {t('Retry')}
              </button>
            </div>
          )}

          {/* Incidents Table / Grid */}
          <div className="incidents-content">
            {filteredIncidents.length === 0 ? (
              <div className="incidents-empty-state">
                <ShieldAlert size={40} className="empty-icon" />
                <h3>{t('No incidents found')}</h3>
                <p>{t('There are no recorded incident events matching the selected filters.')}</p>
              </div>
            ) : view === 'table' ? (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('Incident ID')}</th>
                      <th>{t('Thumbnail')}</th>
                      <th>{t('Camera')}</th>
                      <th>{t('Source')}</th>
                      <th>{t('Type')}</th>
                      <th>{t('Time')}</th>
                      <th>{t('Confidence')}</th>
                      <th>{t('Status')}</th>
                      <th>{t('Evidence')}</th>
                      <th>{t('Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.map((inc) => {
                      const isReal = inc.source === 'YOLO_EDGE';
                      const firstEvidence = inc.evidence && inc.evidence.length > 0 ? inc.evidence[0] : null;
                      const hasImage = firstEvidence && firstEvidence.url && !brokenImages[inc.id];
                      const evidenceCount = inc.evidenceCount ?? (inc.evidence?.length || 0);

                      return (
                        <tr key={inc.id} className={isReal ? 'row-edge' : 'row-simulated'}>
                          <td>
                            <div className="id-cell">
                              <span className="mono id-text">{inc.id}</span>
                            </div>
                          </td>
                          <td>
                            <div className="thumbnail-box">
                              {hasImage ? (
                                <img 
                                  src={resolveEvidenceUrl(firstEvidence.url)} 
                                  alt={t('Evidence for incident {{id}}', { id: inc.id })}
                                  className="incident-thumb-img"
                                  onError={() => handleImageError(inc.id)}
                                  loading="lazy"
                                />
                              ) : (
                                <div className="thumbnail-placeholder">
                                  {isReal ? <Cpu size={18} /> : <Camera size={18} />}
                                </div>
                              )}
                              {evidenceCount > 0 && (
                                <span
                                  className="evidence-count-badge"
                                  title={t(
                                    evidenceCount === 1 ? '{{count}} Evidence capture' : '{{count}} Evidence captures',
                                    { count: evidenceCount },
                                  )}
                                >
                                  {evidenceCount}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="camera-cell">
                              <span className="camera-name">{inc.cameraName || t('Camera')}</span>
                              {inc.cameraId && <span className="camera-sub mono">{inc.cameraId}</span>}
                            </div>
                          </td>
                          <td>
                            <span className={`source-badge ${isReal ? 'source-edge' : 'source-sim'}`}>
                              {isReal ? t('Edge AI (YOLO)') : t('Simulated')}
                            </span>
                          </td>
                          <td>
                            <span className="badge threat">{t(inc.detectionType)}</span>
                          </td>
                          <td>{new Date(inc.startedAt).toLocaleString(locale)}</td>
                          <td className="mono">{(Number(inc.confidence || 0) * 100).toFixed(0)}%</td>
                          <td>
                            <span className={`status-badge ${(inc.status || 'NEW').toLowerCase()}`}>
                              {t(inc.status || 'NEW')}
                            </span>
                          </td>
                          <td>
                            <span className="evidence-summary-text">
                              <span>
                                {isReal
                                  ? t(evidenceCount === 1 ? '{{count}} capture' : '{{count}} captures', { count: evidenceCount })
                                  : inc.responseTime || '-'
                                }
                              </span>
                              {isReal && inc.recording?.url && (
                                <span className="video-ready-pill">
                                  <Video size={12} /> {t('Video ready')}
                                </span>
                              )}
                            </span>
                          </td>
                          <td>
                            <Link to={`/incidents/${inc.id}`} className="btn-link">
                              {t('View Details')}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="incidents-grid">
                {filteredIncidents.map((inc) => {
                  const isReal = inc.source === 'YOLO_EDGE';
                  const firstEvidence = inc.evidence && inc.evidence.length > 0 ? inc.evidence[0] : null;
                  const hasImage = firstEvidence && firstEvidence.url && !brokenImages[inc.id];
                  const evidenceCount = inc.evidenceCount ?? (inc.evidence?.length || 0);

                  return (
                    <div className={`incident-card ${isReal ? 'card-edge' : 'card-simulated'}`} key={inc.id}>
                      <div className="card-thumb">
                        {hasImage ? (
                          <img 
                            src={resolveEvidenceUrl(firstEvidence.url)} 
                            alt={t('Evidence for incident {{id}}', { id: inc.id })}
                            className="grid-thumb-img"
                            onError={() => handleImageError(inc.id)}
                            loading="lazy"
                          />
                        ) : (
                          <div className="grid-thumb-placeholder">
                            {isReal ? <Cpu size={32} /> : <Camera size={32} />}
                          </div>
                        )}
                        <div className="status-overlay">
                          <span className={`status-badge ${(inc.status || 'NEW').toLowerCase()}`}>
                            {t(inc.status || 'NEW')}
                          </span>
                        </div>
                        <div className="source-overlay">
                          <span className={`source-badge ${isReal ? 'source-edge' : 'source-sim'}`}>
                            {isReal ? t('Edge AI') : t('Simulated')}
                          </span>
                        </div>
                        {evidenceCount > 0 && (
                            <div className="evidence-overlay">
                              <span className="evidence-pill">
                                <ImageIcon size={12} /> {t(
                                  evidenceCount === 1 ? '{{count}} frame' : '{{count}} frames',
                                  { count: evidenceCount },
                                )}
                              </span>
                            </div>
                        )}
                        {isReal && inc.recording?.url && (
                          <div className="video-overlay">
                            <span className="video-ready-pill">
                              <Video size={12} /> {t('Video ready')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="card-body">
                        <div className="card-meta d-flex justify-between align-center">
                          <span className="mono id">{inc.id}</span>
                          <span className="time">{new Date(inc.startedAt).toLocaleTimeString(locale)}</span>
                        </div>
                        <h4>{inc.cameraName || t('Camera')}</h4>
                        <div className="card-confidence-row">
                          <span className="conf-label">{t('Confidence')}:</span>
                          <span className="conf-val mono">{(Number(inc.confidence || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="card-footer d-flex justify-between align-center">
                          <span className="badge threat">{t(inc.detectionType)}</span>
                          <Link to={`/incidents/${inc.id}`} className="btn-link">
                            {t('View Details')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Incidents;

