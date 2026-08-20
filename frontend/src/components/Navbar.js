import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Shield, Camera, User, LogOut, Bell } from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import './Navbar.scss';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { notifications } = useSelector(state => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

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
              <Link to="/dashboard">{t('Dashboard')}</Link>
              <Link to="/live-monitoring">{t('Live Monitoring')}</Link>
              <Link to="/incidents">{t('Incidents')}</Link>
              <Link to="/notifications" className="d-flex align-center" style={{gap: '0.25rem'}}>
                {t('Notifications')}
                {unreadCount > 0 && (
                  <span className="badge notification-badge" style={{backgroundColor: 'var(--red-holberton)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold'}}>{unreadCount}</span>
                )}
              </Link>
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
            <div className="user-menu d-flex align-center" style={{gap: '1rem', marginLeft: '1rem'}}>
              <Link to="/profile" className="d-flex align-center" style={{gap: '0.5rem', color: 'var(--text-primary)'}}>
                <User size={18} /> {user?.name}
              </Link>
              <button onClick={handleLogout} className="btn-icon" title={t('Logout')} style={{color: 'var(--text-secondary)'}}>
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
