import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import './InfoPages.scss';

const AboutProject = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="info-page">
        <div className="container">
          <div className="page-header">
            <h2>{t('About Project')}</h2>
            <p>Intelligent Security Monitoring Platform Architecture & Vision</p>
          </div>

          <div className="content-blocks">
            <section className="block">
              <h3>Real-world Motivation</h3>
              <p>Recent events, such as the security incident at İdrak Liseyi in Baku, highlight the critical need for earlier warning systems in educational and institutional environments. Traditional security relies heavily on human response after an incident has already escalated. ISMP aims to detect threats autonomously before they escalate, providing security teams with crucial extra seconds to respond.</p>
            </section>

            <section className="block">
              <h3>Detection Workflow</h3>
              <p>The platform operates on a robust state machine from the edge to the cloud:</p>
              <ul>
                <li><strong>Camera:</strong> Continuous RTSP streaming to the edge node.</li>
                <li><strong>AI Detection:</strong> Python-based YOLO engine processes frames locally.</li>
                <li><strong>Incident Creation:</strong> If confidence exceeds threshold, a WebSockets/REST payload is sent to the backend.</li>
                <li><strong>Instant SOS:</strong> Active dashboards trigger visual and auditory alerts.</li>
              </ul>
            </section>
            
            <section className="block">
              <h3>Automatic Recording & Grace Period Logic</h3>
              <p>To avoid fragmented video files, the detector implements a grace period. When a threat is detected, recording begins. If the threat disappears from the frame, a configurable timer starts. If the threat reappears before expiration, the timer resets. If it expires, the recording stops and is uploaded as evidence.</p>
            </section>

            <section className="block">
              <h3>Multi-Tenant Architecture</h3>
              <p>The backend securely isolates data. Organizations have their own administrators and camera scopes. Global cameras (e.g., street-facing public cameras) can trigger alerts that are individually acknowledged or resolved by respective organizations.</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutProject;
