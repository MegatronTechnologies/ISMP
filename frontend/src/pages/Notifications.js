import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, ShieldAlert } from 'lucide-react';
import { markAllAsRead, markAsRead } from '../redux/slices/notificationSlice';
import Layout from '../components/Layout';
import './Notifications.scss';

const Notifications = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { notifications } = useSelector(state => state.notifications);

  return (
    <Layout>
      <div className="notifications-page">
        <div className="container">
          <div className="page-header d-flex justify-between align-center">
            <h2>{t('Notifications')}</h2>
            <button className="btn btn-outline btn-sm" onClick={() => dispatch(markAllAsRead())}>{t('Mark all as read')}</button>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
               <div className="empty-state" style={{padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)'}}>{t('No notifications yet.')}</div>
            ) : notifications.map(note => (
              <div key={note.id} className={`notification-card ${note.type} ${note.read ? 'read' : 'unread'}`} onClick={() => !note.read && dispatch(markAsRead(note.id))}>
                <div className="icon">
                  {note.type === 'critical' ? <ShieldAlert /> : note.type === 'warning' ? <AlertTriangle /> : <Bell />}
                </div>
                <div className="content">
                  <h4>
                    {note.incidentId ? (
                       <Link to={`/incidents/${note.incidentId}`}>{t(note.title)}</Link>
                    ) : t(note.title)}
                  </h4>
                  <p>{t(note.desc)}</p>
                  <span className="time">{new Date(note.time).toLocaleString()}</span>
                </div>
                {!note.read && <div className="unread-dot" style={{width: '8px', height: '8px', backgroundColor: 'var(--red-holberton)', borderRadius: '50%', alignSelf: 'center'}}></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
