import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  Building2, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  Trash2, 
  UserCheck, 
  Inbox,
  UserPlus, 
  Camera, 
  Info, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Shield, 
  ArrowRight
} from 'lucide-react';
import Layout from '../components/Layout';
import './AdminPanelPage.scss';

const AdminPanelPage = ({ title, sectionKey }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const { isThreatActive, demoCameraStatus } = useSelector(state => state.simulation);
  const { incidents } = useSelector(state => state.incidents);

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const roleType = isSuperAdmin ? 'SUPERADMIN' : 'ORGANIZATION_ADMIN';
  const roleTitle = isSuperAdmin ? t('SuperAdmin Panel') : t('Organization Panel');

  // Navigation items for Organization Admin
  const orgNavItems = [
    { key: 'analytics', label: t('Analytics'), path: '/org-admin/analytics', icon: BarChart3, count: '3 active metrics' },
    { key: 'users', label: t('Users'), path: '/org-admin/users', icon: Users, count: '14 staff members' },
    { key: 'registration-requests', label: t('Registration Requests'), path: '/org-admin/registration-requests', icon: UserPlus, count: '2 pending' },
    { key: 'audit-log', label: t('Audit Log'), path: '/org-admin/audit-log', icon: FileText, count: '128 events logged' }
  ];

  // Navigation items for SuperAdmin
  const superAdminNavItems = [
    { key: 'dashboard', label: t('Dashboard'), path: '/admin/dashboard', icon: BarChart3, count: 'Live Overview' },
    { key: 'organizations', label: t('Organizations Management'), path: '/admin/organizations', icon: Building2, count: '8 registered' },
    { key: 'users', label: t('Global Users'), path: '/admin/users', icon: Users, count: '142 users' },
    { key: 'organization-admins', label: t('Org Admins'), path: '/admin/organization-admins', icon: UserCheck, count: '16 administrators' },
    { key: 'cameras', label: t('Global Cameras'), path: '/admin/cameras', icon: Camera, count: '34 connected' },
    { key: 'incidents', label: t('All Incidents'), path: '/admin/incidents', icon: ShieldAlert, count: `${incidents.length} total` },
    { key: 'contact-requests', label: t('Contact Requests'), path: '/admin/contact-requests', icon: Inbox, count: '5 new' },
    { key: 'audit-logs', label: t('Global Audit Logs'), path: '/admin/audit-logs', icon: FileText, count: '1,420 events' },
    { key: 'trash', label: t('Trash / Archive'), path: '/admin/trash', icon: Trash2, count: '3 items' },
    { key: 'settings', label: t('System Settings'), path: '/admin/settings', icon: Settings, count: 'v1.4.0 Engine' }
  ];

  const currentNavItems = isSuperAdmin ? superAdminNavItems : orgNavItems;

  // Mock table data generator according to title/section
  const renderSectionSpecificPreview = () => {
    switch (sectionKey) {
      case 'organizations':
        return (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Type</th>
                  <th>Active Cameras</th>
                  <th>Admin Contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Baku Secondary School #23</strong></td>
                  <td>Education (K-12)</td>
                  <td>6 Cameras</td>
                  <td>admin@school23.edu.az</td>
                  <td><span className="status-badge status-active">Active</span></td>
                </tr>
                <tr>
                  <td><strong>Ganja Lyceum of Exact Sciences</strong></td>
                  <td>Education (Lyceum)</td>
                  <td>8 Cameras</td>
                  <td>contact@ganja-lyceum.az</td>
                  <td><span className="status-badge status-active">Active</span></td>
                </tr>
                <tr>
                  <td><strong>Sumgayit Technical Gymnasium</strong></td>
                  <td>Gymnasium</td>
                  <td>4 Cameras</td>
                  <td>admin@stg.edu.az</td>
                  <td><span className="status-badge status-active">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'users':
      case 'org-users':
      case 'organization-admins':
        return (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Assigned Role</th>
                  <th>Organization</th>
                  <th>Last Active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Aydın Sulxayev</strong><br/><small>superadmin@ismp.az</small></td>
                  <td><span className="role-badge role-superadmin">SUPERADMIN</span></td>
                  <td>ISMP Central Administration</td>
                  <td>Just now</td>
                  <td><span className="status-badge status-active">Active</span></td>
                </tr>
                <tr>
                  <td><strong>Leyla Qurbanova</strong><br/><small>admin@school23.edu.az</small></td>
                  <td><span className="role-badge role-org-admin">ORGANIZATION_ADMIN</span></td>
                  <td>Baku Secondary School #23</td>
                  <td>5 mins ago</td>
                  <td><span className="status-badge status-active">Active</span></td>
                </tr>
                <tr>
                  <td><strong>Demo Operator</strong><br/><small>user@ismp.az</small></td>
                  <td><span className="role-badge role-user">USER</span></td>
                  <td>Baku Secondary School #23</td>
                  <td>Online</td>
                  <td><span className="status-badge status-active">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'cameras':
        return (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Camera ID</th>
                  <th>Location / Sector</th>
                  <th>RTSP Stream URL</th>
                  <th>AI Detection Model</th>
                  <th>Feed Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>CAM-01</strong></td>
                  <td>Main School Gate (Entrance North)</td>
                  <td><code>rtsp://stream.ismp.internal/live/cam01</code></td>
                  <td>ISMP Threat-v2 (YOLOv8)</td>
                  <td>
                    <span className={`status-badge ${demoCameraStatus === 'ONLINE' ? 'status-active' : 'status-offline'}`}>
                      {demoCameraStatus}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>CAM-02</strong></td>
                  <td>East Perimeter Courtyard</td>
                  <td><code>rtsp://stream.ismp.internal/live/cam02</code></td>
                  <td>ISMP Threat-v2 (YOLOv8)</td>
                  <td><span className="status-badge status-active">ONLINE</span></td>
                </tr>
                <tr>
                  <td><strong>CAM-03</strong></td>
                  <td>South Sports Hall & Hallway</td>
                  <td><code>rtsp://stream.ismp.internal/live/cam03</code></td>
                  <td>ISMP Threat-v2 (YOLOv8)</td>
                  <td><span className="status-badge status-active">ONLINE</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'audit-log':
      case 'audit-logs':
        return (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User / Initiator</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Security Level</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{new Date().toLocaleTimeString()}</td>
                  <td>{user?.name} ({user?.role})</td>
                  <td>Role Simulation / Page Access</td>
                  <td>{location.pathname}</td>
                  <td><span className="status-badge status-info">AUDIT_PASS</span></td>
                </tr>
                <tr>
                  <td>10 mins ago</td>
                  <td>System Daemon</td>
                  <td>Threat Detection Heartbeat</td>
                  <td>CAM-01 Main Gate</td>
                  <td><span className="status-badge status-active">OK</span></td>
                </tr>
                <tr>
                  <td>25 mins ago</td>
                  <td>Leyla Qurbanova</td>
                  <td>Acknowledge Incident #2301</td>
                  <td>Security Incident #1</td>
                  <td><span className="status-badge status-warning">SECURITY_ACK</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div className="admin-default-overview">
            <div className="overview-summary-card">
              <div className="overview-icon-box">
                <Activity size={24} />
              </div>
              <div className="overview-text">
                <h3>{t(title)}</h3>
                <p>{t('All sections are discoverable and pre-connected to the live simulation engine.')}</p>
                <div className="overview-meta">
                  <span>Scope: <strong>{user?.organization || 'ISMP Global Network'}</strong></span>
                  <span>Permission Level: <strong>{user?.role}</strong></span>
                  <span>Active Live Incidents: <strong>{incidents.length}</strong></span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="admin-panel-page">
        <div className="container">
          {/* Breadcrumb Header */}
          <div className="admin-breadcrumb">
            <Link to="/">{t('ISMP')}</Link>
            <span className="separator">/</span>
            <span>{roleTitle}</span>
            <span className="separator">/</span>
            <span className="current">{t(title)}</span>
          </div>

          {/* Page Title & Role Badge */}
          <div className="admin-page-header">
            <div className="header-left">
              <h1>{t(title)}</h1>
              <p className="admin-subtitle">
                {t('Administrative Overview')} · {user?.organization || 'Central Administration'}
              </p>
            </div>
            <div className="header-right">
              <span className={`role-badge ${isSuperAdmin ? 'role-superadmin' : 'role-org-admin'}`}>
                {isSuperAdmin ? t('SuperAdmin') : t('Organization Admin')}
              </span>
            </div>
          </div>

          {/* Demo Mode Notice Banner */}
          <div className="demo-notice-banner">
            <div className="banner-icon">
              <Info size={20} />
            </div>
            <div className="banner-content">
              <strong>{t('Demo Mode Notice')}:</strong>{' '}
              {t('This administrative section is currently operating in Demo Mode.')}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="admin-metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">{t('Total Incidents')}</span>
                <ShieldAlert size={18} className="metric-icon red" />
              </div>
              <div className="metric-value">{incidents.length}</div>
              <div className="metric-sub">Redux state synchronized</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">{t('Simulated Threat Status')}</span>
                <Activity size={18} className={`metric-icon ${isThreatActive ? 'red' : 'green'}`} />
              </div>
              <div className="metric-value">
                {isThreatActive ? (
                  <span className="text-danger">ACTIVE THREAT</span>
                ) : (
                  <span className="text-success">NORMAL</span>
                )}
              </div>
              <div className="metric-sub">Live AI inference stream</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">{t('Camera Feed Status')}</span>
                <Camera size={18} className={`metric-icon ${demoCameraStatus === 'ONLINE' ? 'green' : 'amber'}`} />
              </div>
              <div className="metric-value">
                <span className={demoCameraStatus === 'ONLINE' ? 'text-success' : 'text-warning'}>
                  {demoCameraStatus}
                </span>
              </div>
              <div className="metric-sub">CAM-01 Main Gate Feed</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">{t('Active Role')}</span>
                <Shield size={18} className="metric-icon blue" />
              </div>
              <div className="metric-value metric-value-sm">{user?.role}</div>
              <div className="metric-sub">{user?.name}</div>
            </div>
          </div>

          {/* Navigation Section Cards */}
          <div className="admin-sections-block">
            <h3 className="section-block-title">{t('Accessible Sections')} ({roleTitle})</h3>
            <div className="admin-nav-cards-grid">
              {currentNavItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.key} 
                    to={item.path} 
                    className={`nav-card ${isActive ? 'nav-card-active' : ''}`}
                  >
                    <div className="nav-card-icon">
                      <IconComponent size={20} />
                    </div>
                    <div className="nav-card-info">
                      <div className="nav-card-title">{item.label}</div>
                      <div className="nav-card-count">{item.count}</div>
                    </div>
                    <div className="nav-card-arrow">
                      <ArrowRight size={14} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section Specific Live Content Preview */}
          <div className="admin-content-section">
            <div className="content-section-header">
              <h3>{t(title)} — {t('Simulated Backend Record')}</h3>
              <span className="badge badge-info">{t('Live Demo Metrics')}</span>
            </div>
            {renderSectionSpecificPreview()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanelPage;
