import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import './InfoPages.scss';

const Contact = () => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Layout>
      <div className="info-page">
        <div className="container">
          <div className="contact-layout">
            <div className="contact-info">
              <h2>{t('Contact')}</h2>
              <p>Interested in deploying ISMP for your organization? Reach out to our team for a consultation and live demonstration.</p>
              
              <div className="contact-details mt-2">
                <p><strong>Email:</strong> contact@ismp.az</p>
                <p><strong>Location:</strong> Baku, Azerbaijan</p>
              </div>
            </div>
            
            <div className="contact-form-container">
              {submitted ? (
                <div className="success-message">
                  <h3>Thank you for your interest!</h3>
                  <p>Our team will contact you shortly.</p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Name</label>
                    <input type="text" required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" required />
                  </div>
                  <div className="form-group">
                    <label>Organization / Company</label>
                    <input type="text" required />
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input type="text" required />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea rows="4" required></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-100">Send Message</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
