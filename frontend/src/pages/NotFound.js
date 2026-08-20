import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '6rem', color: 'var(--red-holberton)', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>404</h1>
        <h2 style={{ marginBottom: '2rem' }}>{t('Page Not Found')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem' }}>
          {t('The page you are looking for does not exist or has been moved.')}
        </p>
        <Link to="/" className="btn btn-primary">{t('Return to Home')}</Link>
      </div>
    </Layout>
  );
};

export default NotFound;
