import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Video, Bell, HardDrive, ShieldCheck, Activity } from 'lucide-react';
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
            <motion.div 
              className="hero-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1>{t('Transform Passive CCTV Into Real-Time AI Intelligence')}</h1>
              <p className="subtitle">{t('Detect threats in milliseconds, automate recording, and trigger instant emergency response.')}</p>
              
              <div className="hero-actions">
                <Link to="/about-project" className="btn btn-primary">{t('Explore Platform')}</Link>
                <a href="#how-it-works" className="btn btn-outline">{t('How It Works')}</a>
              </div>
            </motion.div>
            
            <motion.div 
              className="hero-visual"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="visual-mockup">
                <div className="mockup-header">
                  <div className="rec-indicator"><span className="dot"></span> REC</div>
                  <div className="meta">DEMO-CAM-01 • GLOBAL</div>
                </div>
                <div className="mockup-body">
                  <div className="bounding-box">
                    <span className="label">WEAPON 91%</span>
                  </div>
                </div>
                <div className="mockup-footer">
                  <div className="status error"><ShieldAlert size={16} /> THREAT DETECTED</div>
                  <div className="engine">YOLOv8 ACTIVE</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="container">
          <h2>The Problem with Traditional CCTV</h2>
          <p>Traditional CCTV systems are primarily passive and depend heavily on continuous human observation. When an incident occurs, the footage is usually only reviewed after the fact, missing the critical window for intervention.</p>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2>{t('How It Works')}</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="icon-wrapper"><Video size={32} /></div>
              <h3>Camera Feed</h3>
              <p>Continuous monitoring via existing IP cameras.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="icon-wrapper accent"><Activity size={32} /></div>
              <h3>AI Detection</h3>
              <p>Edge-based YOLO models detect threats instantly.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="icon-wrapper error"><Bell size={32} /></div>
              <h3>Instant SOS</h3>
              <p>Alerts triggered with priority to assigned teams.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="icon-wrapper"><HardDrive size={32} /></div>
              <h3>Smart Recording</h3>
              <p>Automatic event recording with grace period logic.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Organizations */}
      <section className="organizations">
        <div className="container">
          <h2>Trusted By</h2>
          <div className="org-grid">
            <div className="org-card"><ShieldCheck size={24} /> Schools & Universities</div>
            <div className="org-card"><ShieldCheck size={24} /> Government Institutions</div>
            <div className="org-card"><ShieldCheck size={24} /> Corporate Offices</div>
            <div className="org-card"><ShieldCheck size={24} /> Shopping Centers</div>
            <div className="org-card"><ShieldCheck size={24} /> Warehouses</div>
            <div className="org-card"><ShieldCheck size={24} /> Industrial Facilities</div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2026 ISMP - Intelligent Security Monitoring Platform.</p>
        </div>
      </footer>
    </Layout>
  );
};

export default Home;
