import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import aydinPhoto from '../assets/team/aydin.jpg';
import emilPhoto from '../assets/team/emil.jpg';
import leylaPhoto from '../assets/team/leyla.jpg';
import './InfoPages.scss';

const team = [
  { 
    name: 'Sulxayev Aydın', 
    role: 'AI · Database · YOLO',
    photo: aydinPhoto
  },
  { 
    name: 'Qurbanova Leyla', 
    role: 'Backend',
    photo: leylaPhoto
  },
  { 
    name: 'Əliyev Emil', 
    role: 'Frontend',
    photo: emilPhoto
  },
];

const TeamMemberCard = ({ member }) => {
  const [imageError, setImageError] = useState(false);
  const initials = member.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="team-card">
      <div className="avatar-wrapper">
        {!imageError && member.photo ? (
          <img 
            src={member.photo} 
            alt={member.name} 
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)} 
          />
        ) : (
          <span className="initials-fallback">{initials}</span>
        )}
      </div>
      <h3>{member.name}</h3>
      <p className="role">{member.role}</p>
    </div>
  );
};

const AboutUs = () => {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="info-page">
        <div className="container">
          <div className="page-header text-center">
            <h2>{t('About Us')}</h2>
            <p style={{color: 'var(--text-secondary)', marginTop: '0.5rem'}}>{t('The engineering team behind ISMP')}</p>
          </div>
          
          <div className="team-grid">
            {team.map(member => (
              <TeamMemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutUs;
