import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Bell, Video, Activity, HardDrive, ShieldCheck, ShieldAlert } from 'lucide-react';
import Layout from '../components/Layout';
import './Home.scss';

const Home = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {t('Transform Passive CCTV Into Real-Time AI Intelligence')}
              </motion.h1>
              <motion.p
                className="subtitle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {t('Detect threats in milliseconds, automate recording, and trigger instant emergency response.')}
              </motion.p>
              <motion.div 
                className="hero-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Link to="/about-project" className="btn btn-primary btn-lg">{t('Explore Platform')}</Link>
                <a href="#how-it-works" className="btn btn-outline btn-lg">{t('How It Works')}</a>
              </motion.div>
            </div>
            
            <div className="hero-visual">
              <motion.div 
                className="visual-mockup"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <div className="mockup-header">
                  <div className="rec-indicator">
                    <span className="dot"></span>
                    <span>REC</span>
                  </div>
                  <div className="meta">1080P | 30FPS</div>
                </div>
                <div className="mockup-body">
                  <div className="bounding-box">
                    <span className="label">{t('WEAPON')} 94%</span>
                  </div>
                </div>
                <div className="mockup-footer">
                  <div className="status"><ShieldAlert size={16} /> {t('THREAT DETECTED')}</div>
                  <div className="engine">{t('YOLOv8 ACTIVE')}</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="container">
          <h2>{t('The Problem with Traditional CCTV')}</h2>
          <p>{t('Traditional CCTV systems are primarily passive and depend heavily on continuous human observation. When an incident occurs, the footage is usually only reviewed after the fact, missing the critical window for intervention.')}</p>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2>{t('How It Works')}</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="icon-wrapper"><Video size={32} /></div>
              <h3>{t('Camera Feed')}</h3>
              <p>{t('Continuous monitoring via existing IP cameras.')}</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="icon-wrapper accent"><Activity size={32} /></div>
              <h3>{t('AI Detection')}</h3>
              <p>{t('Edge-based YOLO models detect threats instantly.')}</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="icon-wrapper error"><Bell size={32} /></div>
              <h3>{t('Instant SOS')}</h3>
              <p>{t('Alerts triggered with priority to assigned teams.')}</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="icon-wrapper"><HardDrive size={32} /></div>
              <h3>{t('Smart Recording')}</h3>
              <p>{t('Automatic event recording with grace period logic.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Organizations */}
      <section className="organizations">
        <div className="container">
          <h2>{t('Trusted By')}</h2>
          <div className="org-grid">
            <div className="org-card"><ShieldCheck size={24} /> {t('Schools & Universities')}</div>
            <div className="org-card"><ShieldCheck size={24} /> {t('Government Institutions')}</div>
            <div className="org-card"><ShieldCheck size={24} /> {t('Corporate Offices')}</div>
            <div className="org-card"><ShieldCheck size={24} /> {t('Shopping Centers')}</div>
            <div className="org-card"><ShieldCheck size={24} /> {t('Warehouses')}</div>
            <div className="org-card"><ShieldCheck size={24} /> {t('Industrial Facilities')}</div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2026 {t('ISMP - Intelligent Security Monitoring Platform.')}</p>
        </div>
      </footer>
    </Layout>
  );
};

export default Home;
