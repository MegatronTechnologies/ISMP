import React from 'react';
import Navbar from './Navbar';
import DemoControls from './DemoControls';
import './Layout.scss';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <DemoControls />
    </div>
  );
};

export default Layout;
