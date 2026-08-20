import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import './InfoPages.scss';

const team = [
  { name: 'Sulxayev Aydın', role: 'AI · Database · YOLO', file: 'Aydın.jpeg' },
  { name: 'Qurbanova Leyla', role: 'Backend', file: 'Leyla.jpeg' },
  { name: 'Əliyev Emil', role: 'Frontend', file: 'Emil.jpeg' },
];

const AboutUs = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="info-page">
        <div className="container">
          <div className="page-header text-center">
            <h2>{t('About Us')}</h2>
            <p>The engineering team behind ISMP</p>
          </div>

          <div className="team-grid">
            {team.map(member => (
              <div className="team-card" key={member.name}>
                <div className="avatar-placeholder">
                  {/* The real files will replace these placeholders */}
                  <span>{member.file}</span>
                </div>
                <h3>{member.name}</h3>
                <p className="role">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutUs;
