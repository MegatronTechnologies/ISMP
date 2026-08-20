import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Layout from '../components/Layout';
import './Auth.scss';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <Layout>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <Shield size={48} className="auth-icon" />
            <h2>{t('Get Started')}</h2>
            <p>Request an account for your organization</p>
          </div>
          
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" required />
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="name@organization.com" required />
            </div>
            
            <div className="form-group">
              <label>Organization</label>
              <select required defaultValue="">
                <option value="" disabled>Select your organization</option>
                <option value="1">Holberton School</option>
                <option value="2">Ministry of Education</option>
                <option value="3">Central Station</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" required />
            </div>
            
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="••••••••" required />
            </div>
            
            <button type="submit" className="btn btn-primary w-100">Request Account</button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login">{t('Login')}</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
