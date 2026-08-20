import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Shield } from 'lucide-react';
import { login } from '../redux/slices/authSlice';
import Layout from '../components/Layout';
import './Auth.scss';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate API login
    dispatch(login({
      user: { name: 'Demo User', role: 'USER', organization: 'Holberton School' },
      token: 'demo-jwt-token'
    }));
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <Shield size={48} className="auth-icon" />
            <h2>{t('Login to ISMP')}</h2>
            <p>Enter your credentials to access the platform</p>
          </div>
          
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="name@organization.com" required />
            </div>
            
            <div className="form-group">
              <div className="d-flex justify-between">
                <label>Password</label>
                <a href="#" className="forgot-link">Forgot Password?</a>
              </div>
              <input type="password" placeholder="••••••••" required />
            </div>
            
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" /> Remember me
              </label>
            </div>
            
            <button type="submit" className="btn btn-primary w-100">{t('Login')}</button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/register">{t('Get Started')}</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
