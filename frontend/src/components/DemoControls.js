import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { setDemoRole } from '../redux/slices/authSlice';
import { setCameraStatus } from '../redux/slices/simulationSlice';
import { triggerThreatSimulation, acknowledgeDemoIncident, resolveDemoIncident } from '../redux/actions/demoActions';
import './DemoControls.scss';

const DemoControls = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { isThreatActive, demoCameraStatus } = useSelector(state => state.simulation);
  const { incidents } = useSelector(state => state.incidents);

  if (!isAuthenticated) return null;

  const activeIncident = incidents.find(i => i.status !== 'RESOLVED' && i.status !== 'FALSE_POSITIVE');
  const canResolve = user?.role === 'ORGANIZATION_ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <div className="demo-controls-global">
      <div className="demo-header">
        <AlertTriangle size={16} />
        <span>{t('DEMO CONTROLS')}</span>
      </div>
      
      <div className="demo-section">
        <h4>{t('Role Switcher')}</h4>
        <div className="btn-group">
          <button 
             className={user?.role === 'USER' ? 'active' : ''} 
             onClick={() => dispatch(setDemoRole('USER'))}
          >{t('User')}</button>
          <button 
             className={user?.role === 'ORGANIZATION_ADMIN' ? 'active' : ''} 
             onClick={() => dispatch(setDemoRole('ORGANIZATION_ADMIN'))}
          >{t('Org Admin')}</button>
          <button 
             className={user?.role === 'SUPERADMIN' ? 'active' : ''} 
             onClick={() => dispatch(setDemoRole('SUPERADMIN'))}
          >{t('Super Admin')}</button>
        </div>
      </div>

      <div className="demo-section">
        <h4>{t('Camera State')}</h4>
        <div className="btn-group">
          <button 
             className={demoCameraStatus === 'ONLINE' ? 'active' : ''} 
             onClick={() => dispatch(setCameraStatus('ONLINE'))}
          >{t('Online')}</button>
          <button 
             className={demoCameraStatus === 'OFFLINE' ? 'active' : ''} 
             onClick={() => dispatch(setCameraStatus('OFFLINE'))}
          >{t('Offline')}</button>
        </div>
      </div>

      <div className="demo-section">
        <h4>{t('AI Simulation')}</h4>
        {!isThreatActive ? (
          <button className="btn btn-primary w-100" onClick={() => dispatch(triggerThreatSimulation())}>
            {t('Simulate Threat')}
          </button>
        ) : (
          activeIncident?.status === 'NEW' ? (
            <button 
              className="btn btn-primary w-100" 
              onClick={() => dispatch(acknowledgeDemoIncident(activeIncident.id))}
            >
              {t('Acknowledge Threat')}
            </button>
          ) : (
            <button 
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
  );
};

export default DemoControls;
