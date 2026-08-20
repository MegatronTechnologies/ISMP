import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, RoleGuard } from './components/ProtectedRoute';
import Home from './pages/Home';
import LiveMonitoring from './pages/LiveMonitoring';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetails from './pages/IncidentDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import AboutProject from './pages/AboutProject';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

import Layout from './components/Layout';
const AdminPlaceholder = ({ title }) => (
  <Layout><div className="container" style={{padding: '2rem 0'}}><h2>{title} (Admin Area)</h2><p>This section is restricted and under development.</p></div></Layout>
);

const App = () => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about-project" element={<AboutProject />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes (USER and above) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-monitoring" element={<LiveMonitoring />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/incidents/:id" element={<IncidentDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Organization Admin Routes */}
        <Route element={<RoleGuard allowedRoles={['ORGANIZATION_ADMIN', 'SUPERADMIN']} />}>
          <Route path="/org-admin/users" element={<AdminPlaceholder title="Organization Users" />} />
          <Route path="/org-admin/registration-requests" element={<AdminPlaceholder title="Registration Requests" />} />
          <Route path="/org-admin/analytics" element={<AdminPlaceholder title="Analytics" />} />
          <Route path="/org-admin/audit-log" element={<AdminPlaceholder title="Organization Audit Log" />} />
        </Route>

        {/* SuperAdmin Routes */}
        <Route element={<RoleGuard allowedRoles={['SUPERADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminPlaceholder title="SuperAdmin Dashboard" />} />
          <Route path="/admin/organizations" element={<AdminPlaceholder title="Organizations Management" />} />
          <Route path="/admin/users" element={<AdminPlaceholder title="Global Users" />} />
          <Route path="/admin/organization-admins" element={<AdminPlaceholder title="Org Admins" />} />
          <Route path="/admin/cameras" element={<AdminPlaceholder title="Global Cameras" />} />
          <Route path="/admin/incidents" element={<AdminPlaceholder title="All Incidents" />} />
          <Route path="/admin/contact-requests" element={<AdminPlaceholder title="Contact Requests" />} />
          <Route path="/admin/audit-logs" element={<AdminPlaceholder title="Global Audit Logs" />} />
          <Route path="/admin/trash" element={<AdminPlaceholder title="Trash / Archive" />} />
          <Route path="/admin/settings" element={<AdminPlaceholder title="System Settings" />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
