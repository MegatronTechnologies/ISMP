import React from 'react';
import Navbar from './Navbar';
import DemoControls from './DemoControls';
import CentralSyncManager from './CentralSyncManager';
import './Layout.scss';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <CentralSyncManager />
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <DemoControls />
    </div>
  );
};

export default Layout;

