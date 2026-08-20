import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { login } from '../redux/slices/authSlice';
import Layout from '../components/Layout';
import './Auth.scss';

const Login = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(login({ email }));
    navigate('/dashboard');
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
                placeholder="admin@ismp.az" 
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
          
          <div className="auth-footer">
            {t("Don't have an account?")} <Link to="/register">{t('Get Started')}</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
