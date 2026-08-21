import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Camera, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { getLocale } from '../utils/dateHelper';
import Layout from '../components/Layout';
import './Dashboard.scss';

const COLORS = ['#2ecc71', '#95a5a6', '#f39c12', '#e74c3c'];

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { incidents } = useSelector(state => state.incidents);
  const { demoCameraStatus } = useSelector(state => state.simulation);
  const locale = getLocale(i18n.language);
  
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const incidents24h = incidents.filter(i => new Date(i.startedAt) >= twentyFourHoursAgo);
  const newCount = incidents24h.filter(i => i.status === 'NEW').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED' && i.resolvedAt && new Date(i.resolvedAt) >= twentyFourHoursAgo).length;
  
  // Calculate average response time (from start to acknowledge)
  let totalResponseMs = 0;
  let respondedCount = 0;
  incidents.forEach(inc => {
    if (inc.acknowledgedAt) {
      const start = new Date(inc.startedAt).getTime();
      const ack = new Date(inc.acknowledgedAt).getTime();
      if (ack >= start) {
        totalResponseMs += (ack - start);
        respondedCount++;
      }
    }
  });

  const avgResponseSecs = respondedCount > 0 ? Math.floor(totalResponseMs / respondedCount / 1000) : 0;
  const avgResponseDisplay = avgResponseSecs > 60 ? `${Math.floor(avgResponseSecs/60)}m ${avgResponseSecs%60}s` : `${avgResponseSecs}s`;
  
  const statusData = [
    { name: 'RESOLVED', value: incidents.filter(i => i.status === 'RESOLVED').length },
    { name: 'FALSE_POSITIVE', value: incidents.filter(i => i.status === 'FALSE_POSITIVE').length },
    { name: 'ACKNOWLEDGED', value: incidents.filter(i => i.status === 'ACKNOWLEDGED').length },
    { name: 'NEW', value: incidents.filter(i => i.status === 'NEW').length },
  ];

  const pieData = statusData.filter(d => d.value > 0);

  const mockDailyData = [
    { name: t('Mon'), incidents: 2 },
    { name: t('Tue'), incidents: 0 },
    { name: t('Wed'), incidents: 1 },
    { name: t('Thu'), incidents: 4 },
    { name: t('Fri'), incidents: 2 },
    { name: t('Sat'), incidents: 0 },
    { name: t('Sun'), incidents: 1 },
  ];

  return (
    <Layout>
      <div className="dashboard">
        <div className="container">
          <div className="page-header">
            <h2>{t('Dashboard')}</h2>
            <div className="header-actions">
              <span className="last-updated">{t('Last updated: Just now')}</span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><Camera size={24} /></div>
              <div className="stat-details">
                <span className="stat-label">{t('Active Cameras')}</span>
                <span className="stat-value">{demoCameraStatus === 'ONLINE' ? '1 / 1' : '0 / 1'}</span>
              </div>
            </div>
            
            <div className="stat-card warning">
              <div className="stat-icon"><ShieldAlert size={24} /></div>
              <div className="stat-details">
                <span className="stat-label">{t('New Incidents (24h)')}</span>
                <span className="stat-value">{newCount}</span>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon"><CheckCircle size={24} /></div>
              <div className="stat-details">
                <span className="stat-label">{t('Resolved (24h)')}</span>
                <span className="stat-value">{resolvedCount}</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon"><AlertTriangle size={24} /></div>
              <div className="stat-details">
                <span className="stat-label">{t('Avg Response Time')}</span>
                <span className="stat-value">{avgResponseDisplay}</span>
              </div>
            </div>
          </div>

          <div className="charts-layout">
            <div className="chart-card">
              <h3>{t('Incidents by Day')}</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockDailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                    <XAxis dataKey="name" stroke="#9e9e9e" />
                    <YAxis stroke="#9e9e9e" allowDecimals={false} />
                    <Tooltip cursor={{fill: '#1c1c1f'}} contentStyle={{backgroundColor: '#121214', border: '1px solid #2a2a2e'}} />
                    <Bar dataKey="incidents" name={t('Incidents')} fill="#E03A3E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="chart-card">
              <h3>{t('Incident Status Distribution')}</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.length > 0 ? pieData : [{ name: 'NEW', value: 0 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={pieData.length > 1 ? 5 : 0}
                      dataKey="value"
                    >
                      {pieData.map((entry) => {
                        const idx = statusData.findIndex(s => s.name === entry.name);
                        return <Cell key={entry.name} fill={COLORS[idx >= 0 ? idx : 0]} />;
                      })}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, t(name)]} contentStyle={{backgroundColor: '#121214', border: '1px solid #2a2a2e'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pie-legend">
                {statusData.map((entry, index) => (
                  <div key={index} className="legend-item">
                    <span className="color-dot" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                    <span className="label">{t(entry.name)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="recent-incidents">
            <div className="card-header">
              <h3>{t('Recent Incidents')}</h3>
              <Link to="/incidents" className="view-all">{t('View All')}</Link>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('ID')}</th>
                    <th>{t('Camera')}</th>
                    <th>{t('Type')}</th>
                    <th>{t('Time')}</th>
                    <th>{t('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.slice(0, 5).map(inc => (
                    <tr key={inc.id}>
                      <td className="mono">{inc.id}</td>
                      <td>{inc.cameraName || t('Camera')}</td>
                      <td><span className="badge threat">{t(inc.detectionType)}</span></td>
                      <td>{new Date(inc.startedAt).toLocaleTimeString(locale)}</td>
                      <td><span className={`status-badge ${(inc.status || 'NEW').toLowerCase()}`}>{t(inc.status || 'NEW')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
