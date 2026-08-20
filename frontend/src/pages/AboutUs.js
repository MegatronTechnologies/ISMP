import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import './InfoPages.scss';

const team = [
  { name: 'Sulxayev Aydın', role: 'AI · Database · YOLO', file: '/Aydın.jpeg' },
  { name: 'Qurbanova Leyla', role: 'Backend', file: '/Leyla.jpeg' },
  { name: 'Əliyev Emil', role: 'Frontend', file: '/Emil.jpeg' },
];

const AboutUs = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="info-page">
        <div className="container">
          <div className="page-header text-center">
            <h2>{t('About Us')}</h2>
            <p style={{color: 'var(--text-secondary)', marginTop: '0.5rem'}}>{t('The engineering team behind ISMP') || 'The engineering team behind ISMP'}</p>
          </div>
          
          <div className="team-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '3rem'}}>
            {team.map(member => (
              <div className="team-card" key={member.name} style={{backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)'}}>
                <div className="avatar-wrapper" style={{width: '120px', height: '120px', margin: '0 auto 1.5rem', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)'}}>
                  <img src={member.file} alt={member.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  <div className="avatar-placeholder" style={{display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem'}}>
                    {member.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                </div>
                <h3 style={{marginBottom: '0.5rem', color: 'var(--text-primary)'}}>{member.name}</h3>
                <p className="role" style={{color: 'var(--red-holberton)', fontSize: '0.9rem', fontWeight: '500'}}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutUs;
