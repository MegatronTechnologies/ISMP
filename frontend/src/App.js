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
import AdminPanelPage from './pages/AdminPanelPage';

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
          <Route path="/org-admin/users" element={<AdminPanelPage title="Organization Users" sectionKey="org-users" />} />
          <Route path="/org-admin/registration-requests" element={<AdminPanelPage title="Registration Requests" sectionKey="registration-requests" />} />
          <Route path="/org-admin/analytics" element={<AdminPanelPage title="Analytics" sectionKey="analytics" />} />
          <Route path="/org-admin/audit-log" element={<AdminPanelPage title="Organization Audit Log" sectionKey="audit-log" />} />
        </Route>

        {/* SuperAdmin Routes */}
        <Route element={<RoleGuard allowedRoles={['SUPERADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminPanelPage title="SuperAdmin Dashboard" sectionKey="dashboard" />} />
          <Route path="/admin/organizations" element={<AdminPanelPage title="Organizations Management" sectionKey="organizations" />} />
          <Route path="/admin/users" element={<AdminPanelPage title="Global Users" sectionKey="users" />} />
          <Route path="/admin/organization-admins" element={<AdminPanelPage title="Org Admins" sectionKey="organization-admins" />} />
          <Route path="/admin/cameras" element={<AdminPanelPage title="Global Cameras" sectionKey="cameras" />} />
          <Route path="/admin/incidents" element={<AdminPanelPage title="All Incidents" sectionKey="incidents" />} />
          <Route path="/admin/contact-requests" element={<AdminPanelPage title="Contact Requests" sectionKey="contact-requests" />} />
          <Route path="/admin/audit-logs" element={<AdminPanelPage title="Global Audit Logs" sectionKey="audit-logs" />} />
          <Route path="/admin/trash" element={<AdminPanelPage title="Trash / Archive" sectionKey="trash" />} />
          <Route path="/admin/settings" element={<AdminPanelPage title="System Settings" sectionKey="settings" />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
