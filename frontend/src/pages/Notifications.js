import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, ShieldAlert, CheckCheck, RefreshCw, Clock } from 'lucide-react';
import { markAllAsRead, markAsRead, setRealNotifications, setNotificationSyncError } from '../redux/slices/notificationSlice';
import { fetchCentralNotifications } from '../services/centralIncidentApi';
import { getLocale } from '../utils/dateHelper';
import Layout from '../components/Layout';
import './Notifications.scss';

const Notifications = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { notifications, error: syncError, lastSyncedAt } = useSelector((state) => state.notifications);
  const locale = getLocale(i18n.language);

  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'CRITICAL'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchCentralNotifications();
      dispatch(setRealNotifications(data));
    } catch (err) {
      dispatch(setNotificationSyncError(err.message || 'Notification refresh failed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredNotifications = notifications.filter((note) => {
    if (filter === 'UNREAD') return !note.read;
    if (filter === 'CRITICAL') return note.type === 'critical';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotificationTitle = (note) => {
    const payload = {
      ...(note.payload || {}),
      detectionType: t(note.payload?.detectionType || note.detectionType || 'Threat'),
    };

    if (note.titleKey) {
      return t(note.titleKey, payload);
    }
    return t(note.title, payload);
  };

  const renderNotificationDesc = (note) => {
    const payload = {
      ...(note.payload || {}),
      detectionType: t(note.payload?.detectionType || note.detectionType || 'Threat'),
    };

    if (note.messageKey) {
      return t(note.messageKey, payload);
    }
    return t(note.desc || note.message, payload);
  };

  return (
    <Layout>
      <div className="notifications-page">
        <div className="container">
          <div className="page-header d-flex justify-between align-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="header-title-block">
              <h2>{t('Notifications')}</h2>
              <div className="header-sync-info">
                {unreadCount > 0 && (
                  <span className="badge-unread-count">
                    {t('{{count}} Unread', { count: unreadCount })}
                  </span>
                )}
                {lastSyncedAt && (
                  <span className="last-sync-time">
                    <Clock size={12} /> {t('Synced')}: {new Date(lastSyncedAt).toLocaleTimeString(locale)}
                  </span>
                )}
              </div>
            </div>

            <div className="header-actions d-flex align-center" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="filter-chips">
                <button
                  type="button"
                  className={`chip-btn ${filter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setFilter('ALL')}
                >
                  {t('All')} ({notifications.length})
                </button>
                <button
                  type="button"
                  className={`chip-btn ${filter === 'UNREAD' ? 'active' : ''}`}
                  onClick={() => setFilter('UNREAD')}
                >
                  {t('Unread')} ({unreadCount})
                </button>
                <button
                  type="button"
                  className={`chip-btn ${filter === 'CRITICAL' ? 'active' : ''}`}
                  onClick={() => setFilter('CRITICAL')}
                >
                  {t('Critical')}
                </button>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title={t('Refresh notifications')}
              >
                <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => dispatch(markAllAsRead())}
                disabled={unreadCount === 0}
              >
                <CheckCheck size={14} style={{ marginRight: '0.35rem' }} />
                {t('Mark all as read')}
              </button>
            </div>
          </div>

          {syncError && (
            <div className="notifications-sync-error">
              <AlertTriangle size={16} />
              <span>{t('Notification sync warning')}: {syncError}</span>
            </div>
          )}

          <div className="notifications-list">
            {filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                <p>{t('No notifications found for selected filter.')}</p>
              </div>
            ) : (
              filteredNotifications.map((note) => {
                const isReal = note.source === 'YOLO_EDGE';
                const timeString = note.time || note.createdAt || new Date().toISOString();

                return (
                  <div
                    key={note.id}
                    className={`notification-card ${note.type} ${note.read ? 'read' : 'unread'}`}
                    onClick={() => !note.read && dispatch(markAsRead(note.id))}
                  >
                    <div className="icon">
                      {note.type === 'critical' ? (
                        <ShieldAlert size={20} />
                      ) : note.type === 'warning' ? (
                        <AlertTriangle size={20} />
                      ) : (
                        <Bell size={20} />
                      )}
                    </div>
                    <div className="content">
                      <div className="card-top-row d-flex justify-between align-center">
                        <h4>
                          {note.incidentId ? (
                            <Link to={`/incidents/${note.incidentId}`} className="incident-link">
                              {renderNotificationTitle(note)}
                            </Link>
                          ) : (
                            renderNotificationTitle(note)
                          )}
                        </h4>
                        <span className={`source-badge ${isReal ? 'source-edge' : 'source-sim'}`}>
                          {isReal ? t('Edge AI') : t('Simulated')}
                        </span>
                      </div>
                      <p>{renderNotificationDesc(note)}</p>
                      <div className="card-bottom-row d-flex justify-between align-center">
                        <span className="time">{new Date(timeString).toLocaleString(locale)}</span>
                        {note.incidentId && (
                          <Link to={`/incidents/${note.incidentId}`} className="view-incident-btn">
                            {t('View Incident')} &rarr;
                          </Link>
                        )}
                      </div>
                    </div>
                    {!note.read && (
                      <div
                        className="unread-dot"
                        title={t('Unread notification')}
                        style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: 'var(--red-holberton)',
                          borderRadius: '50%',
                          alignSelf: 'center',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;

