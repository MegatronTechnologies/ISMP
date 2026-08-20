import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, AlertTriangle, ShieldAlert } from 'lucide-react';
import Layout from '../components/Layout';
import './Notifications.scss';

const Notifications = () => {
  const { t } = useTranslation();

  const mockNotifications = [
    { id: 1, type: 'critical', title: 'Weapon Detected', time: '10 mins ago', desc: 'Camera: Main Gate (Cam-01). Confidence: 94%' },
    { id: 2, type: 'warning', title: 'Camera Offline', time: '1 hour ago', desc: 'Camera: Cafeteria (Cam-03) lost connection.' },
    { id: 3, type: 'info', title: 'System Update', time: '1 day ago', desc: 'ISMP Backend successfully updated to v1.2' },
  ];

  return (
    <Layout>
      <div className="notifications-page">
        <div className="container">
          <div className="page-header d-flex justify-between align-center">
            <h2>{t('Notifications')}</h2>
            <button className="btn btn-outline btn-sm">Mark all as read</button>
          </div>

          <div className="notifications-list">
            {mockNotifications.map(note => (
              <div key={note.id} className={`notification-card \${note.type}`}>
                <div className="icon">
                  {note.type === 'critical' ? <ShieldAlert /> : note.type === 'warning' ? <AlertTriangle /> : <Bell />}
                </div>
                <div className="content">
                  <h4>{note.title}</h4>
                  <p>{note.desc}</p>
                  <span className="time">{note.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
