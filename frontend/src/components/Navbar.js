import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Shield, 
  Camera, 
  User, 
  LogOut, 
  Bell, 
  ChevronDown, 
  Building2, 
  ShieldAlert, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  Trash2, 
  UserCheck, 
  Inbox,
  UserPlus
} from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import './Navbar.scss';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { notifications } = useSelector(state => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const orgMenuRef = useRef(null);
  const adminMenuRef = useRef(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  // Close dropdowns on outside click or route change
  useEffect(() => {
    setOrgMenuOpen(false);
    setAdminMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target)) {
        setOrgMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;
  const isOrgAdmin = user?.role === 'ORGANIZATION_ADMIN' || user?.role === 'SUPERADMIN';
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const getRoleBadge = (role) => {
    switch(role) {
      case 'SUPERADMIN':
        return <span className="role-pill role-superadmin">{t('SuperAdmin')}</span>;
      case 'ORGANIZATION_ADMIN':
        return <span className="role-pill role-org-admin">{t('Organization Admin')}</span>;
      case 'USER':
      default:
        return <span className="role-pill role-user">{t('User')}</span>;
    }
  };

  return (
    <nav className="navbar">
      <div className="container d-flex justify-between align-center">
        <Link to="/" className="brand d-flex align-center">
          <Shield className="brand-icon" size={28} />
          <Camera className="brand-icon secondary" size={18} />
          <span className="brand-name">ISMP</span>
        </Link>
        
        <div className="nav-links d-flex align-center">
          {!isAuthenticated ? (
            <>
              <Link to="/">{t('Home')}</Link>
              <Link to="/about-project">{t('About Project')}</Link>
              <Link to="/about-us">{t('About Us')}</Link>
              <Link to="/contact">{t('Contact')}</Link>
            </>
          ) : (
            <>
              {/* Common Authenticated Links for all roles */}
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active-link' : ''}>
                {t('Dashboard')}
              </Link>
              <Link to="/live-monitoring" className={location.pathname === '/live-monitoring' ? 'active-link' : ''}>
                {t('Live Monitoring')}
              </Link>
              <Link to="/incidents" className={location.pathname.startsWith('/incidents') ? 'active-link' : ''}>
                {t('Incidents')}
              </Link>
              <Link to="/notifications" className={`d-flex align-center ${location.pathname === '/notifications' ? 'active-link' : ''}`} style={{gap: '0.25rem'}}>
                {t('Notifications')}
                {unreadCount > 0 && (
                  <span className="badge notification-badge" style={{backgroundColor: 'var(--red-holberton)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold'}}>{unreadCount}</span>
                )}
              </Link>

              {/* ORGANIZATION_ADMIN Navigation Menu */}
              {user?.role === 'ORGANIZATION_ADMIN' && (
                <div className="nav-dropdown" ref={orgMenuRef}>
                  <button 
                    type="button"
                    className={`dropdown-trigger d-flex align-center ${location.pathname.startsWith('/org-admin') ? 'active-link' : ''}`}
                    onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                  >
                    <Building2 size={16} />
                    <span>{t('Organization Panel')}</span>
                    <ChevronDown size={14} className={orgMenuOpen ? 'rotate-180' : ''} />
                  </button>

                  {orgMenuOpen && (
                    <div className="dropdown-menu">
                      <div className="dropdown-header">{t('Organization Panel')}</div>
                      <Link to="/org-admin/analytics" className="dropdown-item">
                        <BarChart3 size={15} /> {t('Analytics')}
                      </Link>
                      <Link to="/org-admin/cameras" className="dropdown-item">
                        <Camera size={15} /> {t('Cameras')}
                      </Link>
                      <Link to="/org-admin/users" className="dropdown-item">
                        <Users size={15} /> {t('Users')}
                      </Link>
                      <Link to="/org-admin/registration-requests" className="dropdown-item">
                        <UserPlus size={15} /> {t('Registration Requests')}
                      </Link>
                      <Link to="/org-admin/audit-log" className="dropdown-item">
                        <FileText size={15} /> {t('Audit Log')}
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* SUPERADMIN Navigation Menu */}
              {isSuperAdmin && (
                <div className="nav-dropdown" ref={adminMenuRef}>
                  <button 
                    type="button"
                    className={`dropdown-trigger d-flex align-center ${location.pathname.startsWith('/admin') ? 'active-link' : ''}`}
                    onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  >
                    <ShieldAlert size={16} />
                    <span>{t('SuperAdmin Panel')}</span>
                    <ChevronDown size={14} className={adminMenuOpen ? 'rotate-180' : ''} />
                  </button>

                  {adminMenuOpen && (
                    <div className="dropdown-menu dropdown-menu-wide">
                      <div className="dropdown-header">{t('SuperAdmin Panel')}</div>
                      <div className="dropdown-grid">
                        <Link to="/admin/dashboard" className="dropdown-item">
                          <BarChart3 size={15} /> {t('Dashboard')}
                        </Link>
                        <Link to="/admin/organizations" className="dropdown-item">
                          <Building2 size={15} /> {t('Organizations')}
                        </Link>
                        <Link to="/admin/users" className="dropdown-item">
                          <Users size={15} /> {t('Users')}
                        </Link>
                        <Link to="/admin/organization-admins" className="dropdown-item">
                          <UserCheck size={15} /> {t('Organization Admins')}
                        </Link>
                        <Link to="/admin/cameras" className="dropdown-item">
                          <Camera size={15} /> {t('Cameras')}
                        </Link>
                        <Link to="/admin/incidents" className="dropdown-item">
                          <ShieldAlert size={15} /> {t('Incidents')}
                        </Link>
                        <Link to="/admin/contact-requests" className="dropdown-item">
                          <Inbox size={15} /> {t('Contact Requests')}
                        </Link>
                        <Link to="/admin/audit-logs" className="dropdown-item">
                          <FileText size={15} /> {t('Audit Logs')}
                        </Link>
                        <Link to="/admin/trash" className="dropdown-item">
                          <Trash2 size={15} /> {t('Trash')}
                        </Link>
                        <Link to="/admin/settings" className="dropdown-item">
                          <Settings size={15} /> {t('Settings')}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          <div className="lang-switcher">
            <button onClick={() => changeLanguage('az')} className={i18n.language === 'az' ? 'active' : ''}>AZ</button>
            <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>EN</button>
            <button onClick={() => changeLanguage('ru')} className={i18n.language === 'ru' ? 'active' : ''}>RU</button>
          </div>
          
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-outline">{t('Login')}</Link>
              <Link to="/register" className="btn btn-primary">{t('Get Started')}</Link>
            </>
          ) : (
            <div className="user-menu d-flex align-center" style={{gap: '0.75rem', marginLeft: '0.5rem'}}>
              <Link to="/profile" className="user-profile-link d-flex align-center" style={{gap: '0.5rem', color: 'var(--text-primary)'}}>
                <div className="user-avatar-circle">
                  <User size={16} />
                </div>
                <div className="user-info-column d-flex flex-column">
                  <span className="user-display-name">{user?.name}</span>
                  {getRoleBadge(user?.role)}
                </div>
              </Link>
              <button onClick={handleLogout} className="btn-icon logout-btn" title={t('Logout')} style={{color: 'var(--text-secondary)'}}>
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
