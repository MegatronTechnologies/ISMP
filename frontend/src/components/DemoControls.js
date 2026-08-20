import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, User, Settings, Video, AlertTriangle } from 'lucide-react';
import { setDemoRole } from '../redux/slices/authSlice';
import { simulateThreat, resolveThreat, setCameraStatus } from '../redux/slices/simulationSlice';
import './DemoControls.scss';

const DemoControls = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { isThreatActive, demoCameraStatus } = useSelector(state => state.simulation);

  if (!isAuthenticated) return null;

  return (
    <div className="demo-controls-global">
      <div className="demo-header">
        <AlertTriangle size={16} />
        <span>DEMO CONTROLS</span>
      </div>
      
      <div className="demo-section">
        <h4>Role Switcher</h4>
        <div className="btn-group">
          <button 
            className={user?.role === 'USER' ? 'active' : ''} 
            onClick={() => dispatch(setDemoRole('USER'))}
          >User</button>
          <button 
            className={user?.role === 'ORGANIZATION_ADMIN' ? 'active' : ''} 
            onClick={() => dispatch(setDemoRole('ORGANIZATION_ADMIN'))}
          >Org Admin</button>
          <button 
            className={user?.role === 'SUPERADMIN' ? 'active' : ''} 
            onClick={() => dispatch(setDemoRole('SUPERADMIN'))}
          >Super Admin</button>
        </div>
      </div>

      <div className="demo-section">
        <h4>Camera State</h4>
        <div className="btn-group">
          <button 
            className={demoCameraStatus === 'ONLINE' ? 'active' : ''} 
            onClick={() => dispatch(setCameraStatus('ONLINE'))}
          >Online</button>
          <button 
            className={demoCameraStatus === 'OFFLINE' ? 'active' : ''} 
            onClick={() => dispatch(setCameraStatus('OFFLINE'))}
          >Offline</button>
        </div>
      </div>

      <div className="demo-section">
        <h4>AI Simulation</h4>
        {!isThreatActive ? (
          <button className="btn btn-primary w-100" onClick={() => dispatch(simulateThreat())}>
            Simulate Threat
          </button>
        ) : (
          <button className="btn btn-outline w-100" onClick={() => dispatch(resolveThreat())}>
            Resolve Threat
          </button>
        )}
      </div>
    </div>
  );
};

export default DemoControls;
