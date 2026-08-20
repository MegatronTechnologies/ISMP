import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Sliders, X, ChevronUp, ChevronDown, Shield, Video, Flame } from 'lucide-react';
import { setDemoRole } from '../redux/slices/authSlice';
import { setCameraStatus } from '../redux/slices/simulationSlice';
import { triggerThreatSimulation, acknowledgeDemoIncident, resolveDemoIncident } from '../redux/actions/demoActions';
import './DemoControls.scss';

const DemoControls = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { isThreatActive, demoCameraStatus } = useSelector(state => state.simulation);
  const { incidents } = useSelector(state => state.incidents);

  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) return null;

  const activeIncident = incidents.find(i => i.status !== 'RESOLVED' && i.status !== 'FALSE_POSITIVE');
  const canResolve = user?.role === 'ORGANIZATION_ADMIN' || user?.role === 'SUPERADMIN';

  const handleRoleChange = (newRole) => {
    if (user?.role === newRole) return;
    dispatch(setDemoRole(newRole));
    
    // Auto-redirect based on selected role
    if (newRole === 'USER') {
      navigate('/dashboard');
    } else if (newRole === 'ORGANIZATION_ADMIN') {
      navigate('/org-admin/analytics');
    } else if (newRole === 'SUPERADMIN') {
      navigate('/admin/dashboard');
    }
  };

  const getRoleShortBadge = (role) => {
    switch (role) {
      case 'SUPERADMIN':
        return <span className="demo-badge-super">SuperAdmin</span>;
      case 'ORGANIZATION_ADMIN':
        return <span className="demo-badge-org">Org Admin</span>;
      case 'USER':
      default:
        return <span className="demo-badge-user">User</span>;
    }
  };

  return (
    <div className="demo-controls-wrapper">
      {!isOpen ? (
        <button 
          type="button"
          className="demo-fab-trigger" 
          onClick={() => setIsOpen(true)}
          title={t('Toggle Demo Controls')}
        >
          <Sliders size={16} className="fab-icon" />
          <span className="fab-title">{t('Demo Controls')}</span>
          {getRoleShortBadge(user?.role)}
        </button>
      ) : (
        <div className="demo-controls-panel">
          <div className="demo-header" onClick={() => setIsOpen(false)}>
            <div className="d-flex align-center" style={{ gap: '0.5rem' }}>
              <AlertTriangle size={16} />
              <span>{t('DEMO CONTROLS')}</span>
            </div>
            <button 
              type="button" 
              className="demo-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="demo-body">
            {/* Current Active Role Display */}
            <div className="demo-section demo-current-role-section">
              <span className="demo-label">{t('Current Active Role')}:</span>
              <div className="current-role-indicator">
                {getRoleShortBadge(user?.role)}
                <span className="current-role-detail">
                  {user?.role === 'SUPERADMIN' ? '/admin/*' : user?.role === 'ORGANIZATION_ADMIN' ? '/org-admin/*' : '/dashboard'}
                </span>
              </div>
            </div>
            
            {/* Role Switcher */}
            <div className="demo-section">
              <h4>{t('Role Switcher')}</h4>
              <div className="btn-group">
                <button 
                  type="button"
                  className={user?.role === 'USER' ? 'active' : ''} 
                  onClick={() => handleRoleChange('USER')}
                >
                  {t('User')} <span className="role-sub">→ /dashboard</span>
                </button>
                <button 
                  type="button"
                  className={user?.role === 'ORGANIZATION_ADMIN' ? 'active' : ''} 
                  onClick={() => handleRoleChange('ORGANIZATION_ADMIN')}
                >
                  {t('Org Admin')} <span className="role-sub">→ /org-admin</span>
                </button>
                <button 
                  type="button"
                  className={user?.role === 'SUPERADMIN' ? 'active' : ''} 
                  onClick={() => handleRoleChange('SUPERADMIN')}
                >
                  {t('Super Admin')} <span className="role-sub">→ /admin</span>
                </button>
              </div>
            </div>

            {/* Camera State */}
            <div className="demo-section">
              <h4>{t('Camera State')}</h4>
              <div className="btn-group-row">
                <button 
                  type="button"
                  className={demoCameraStatus === 'ONLINE' ? 'active' : ''} 
                  onClick={() => dispatch(setCameraStatus('ONLINE'))}
                >
                  {t('Online')}
                </button>
                <button 
                  type="button"
                  className={demoCameraStatus === 'OFFLINE' ? 'active' : ''} 
                  onClick={() => dispatch(setCameraStatus('OFFLINE'))}
                >
                  {t('Offline')}
                </button>
              </div>
            </div>

            {/* AI Simulation */}
            <div className="demo-section">
              <h4>{t('AI Simulation')}</h4>
              {!isThreatActive ? (
                <button 
                  type="button"
                  className="btn btn-primary w-100" 
                  onClick={() => dispatch(triggerThreatSimulation())}
                >
                  {t('Simulate Threat')}
                </button>
              ) : (
                activeIncident?.status === 'NEW' ? (
                  <button 
                    type="button"
                    className="btn btn-primary w-100 btn-pulse-threat" 
                    onClick={() => dispatch(acknowledgeDemoIncident(activeIncident.id))}
                  >
                    {t('Acknowledge Threat')}
                  </button>
                ) : (
                  <button 
                    type="button"
                    className="btn btn-outline w-100" 
                    disabled={!canResolve}
                    title={!canResolve ? t('You need ORGANIZATION_ADMIN or higher permissions to resolve.') : ''}
                    onClick={() => {
                      if (activeIncident && canResolve) {
                        dispatch(resolveDemoIncident(activeIncident.id, 'RESOLVED'));
                      }
                    }}
                  >
                    {t('Resolve Threat')}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoControls;
