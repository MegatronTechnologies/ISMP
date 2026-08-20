import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Building, ShieldCheck, Sparkles } from 'lucide-react';
import { login } from '../redux/slices/authSlice';
import Layout from '../components/Layout';
import './Auth.scss';

const Login = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1. Normal login creates regular USER
  const handleLogin = (e) => {
    e.preventDefault();
    const username = email ? email.split('@')[0] : 'user';
    const displayName = username.charAt(0).toUpperCase() + username.slice(1);
    dispatch(login({
      user: {
        name: displayName || 'Demo User',
        email: email || 'user@ismp.az',
        role: 'USER',
        organization: 'Baku Secondary School #23'
      },
      token: 'mock-jwt-token-demo'
    }));
    navigate('/dashboard');
  };

  // Demo Access Handlers
  const handleDemoUser = () => {
    dispatch(login({
      user: {
        name: 'Demo Operator',
        email: 'user@ismp.az',
        role: 'USER',
        organization: 'Baku Secondary School #23'
      },
      token: 'mock-jwt-token-demo-user'
    }));
    navigate('/dashboard');
  };

  const handleDemoOrgAdmin = () => {
    dispatch(login({
      user: {
        name: 'Leyla Qurbanova',
        email: 'admin@school23.edu.az',
        role: 'ORGANIZATION_ADMIN',
        organization: 'Baku Secondary School #23'
      },
      token: 'mock-jwt-token-demo-org'
    }));
    navigate('/org-admin/analytics');
  };

  const handleDemoSuperAdmin = () => {
    dispatch(login({
      user: {
        name: 'Aydın Sulxayev',
        email: 'superadmin@ismp.az',
        role: 'SUPERADMIN',
        organization: 'ISMP Central Administration'
      },
      token: 'mock-jwt-token-demo-super'
    }));
    navigate('/admin/dashboard');
  };

  return (
    <Layout>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <Shield size={48} className="auth-icon" />
            <h2>{t('Welcome Back')}</h2>
            <p>{t('Login to ISMP')}</p>
          </div>
          
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>{t('Email Address')}</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@ismp.az" 
                required 
              />
            </div>
            
            <div className="form-group">
              <div className="d-flex justify-between">
                <label>{t('Password')}</label>
                <a href="#" className="forgot-link">{t('Forgot Password?')}</a>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary w-100">{t('Sign in')}</button>
          </form>

          {/* DEMO ACCESS SECTION */}
          <div className="demo-access-section">
            <div className="demo-divider">
              <span>{t('or continue with demo access')}</span>
            </div>

            <div className="demo-role-buttons">
              <button 
                type="button" 
                className="demo-btn demo-btn-user"
                onClick={handleDemoUser}
              >
                <div className="demo-btn-icon">
                  <User size={18} />
                </div>
                <div className="demo-btn-text">
                  <span className="demo-btn-title">{t('Continue as User')}</span>
                  <span className="demo-btn-subtitle">Role: USER · /dashboard</span>
                </div>
              </button>

              <button 
                type="button" 
                className="demo-btn demo-btn-org"
                onClick={handleDemoOrgAdmin}
              >
                <div className="demo-btn-icon">
                  <Building size={18} />
                </div>
                <div className="demo-btn-text">
                  <span className="demo-btn-title">{t('Continue as Organization Admin')}</span>
                  <span className="demo-btn-subtitle">Role: ORGANIZATION_ADMIN · /org-admin</span>
                </div>
              </button>

              <button 
                type="button" 
                className="demo-btn demo-btn-super"
                onClick={handleDemoSuperAdmin}
              >
                <div className="demo-btn-icon">
                  <ShieldCheck size={18} />
                </div>
                <div className="demo-btn-text">
                  <span className="demo-btn-title">{t('Continue as SuperAdmin')}</span>
                  <span className="demo-btn-subtitle">Role: SUPERADMIN · /admin</span>
                </div>
              </button>
            </div>
          </div>
          
          <div className="auth-footer">
            {t("Don't have an account?")} <Link to="/register">{t('Get Started')}</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
