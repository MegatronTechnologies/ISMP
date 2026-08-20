import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Shield, User, MapPin, Building, Key, Bell, Camera } from 'lucide-react';
import Layout from '../components/Layout';
import './Profile.scss';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useSelector(state => state.auth);

  if (!user) return <Layout><div className="container"><p>Please log in.</p></div></Layout>;

  return (
    <Layout>
      <div className="profile-page">
        <div className="container">
          <div className="page-header">
            <h2>{t('My Profile')}</h2>
          </div>
          
          <div className="profile-layout">
            <div className="profile-card">
              <div className="avatar">
                <User size={64} />
              </div>
              <div className="info">
                <h3>{user.name}</h3>
                <span className={`role-badge \${user.role.toLowerCase()}`}>{user.role}</span>
                <p className="org-text"><Building size={16}/> {user.organization}</p>
              </div>
            </div>

            <div className="settings-grid">
              <div className="settings-card">
                <h4><Key size={18}/> Security</h4>
                <div className="setting-item">
                  <span>Change Password</span>
                  <button className="btn btn-outline btn-sm">Update</button>
                </div>
                <div className="setting-item">
                  <span>Two-Factor Auth</span>
                  <button className="btn btn-outline btn-sm">Enable</button>
                </div>
              </div>

              <div className="settings-card">
                <h4><Bell size={18}/> Notifications</h4>
                <div className="setting-item">
                  <span>Email Alerts</span>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <span>SMS Alerts</span>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-card">
                <h4><Camera size={18}/> Preferences</h4>
                <div className="setting-item">
                  <span>Default Camera Grid</span>
                  <select className="input">
                    <option>2x2</option>
                    <option>3x3</option>
                    <option>4x4</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
