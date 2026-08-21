import React from 'react';
import Navbar from './Navbar';
import DemoControls from './DemoControls';
import { EmergencyArmingBanner } from './EmergencyAlertManager';
import './Layout.scss';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <EmergencyArmingBanner />
        </div>
        {children}
      </main>
      <DemoControls />
    </div>
  );
};

export default Layout;

