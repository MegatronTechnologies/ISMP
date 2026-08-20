import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Camera, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import './Dashboard.scss';

const mockDailyData = [
  { name: 'Mon', incidents: 2 },
  { name: 'Tue', incidents: 0 },
  { name: 'Wed', incidents: 1 },
  { name: 'Thu', incidents: 4 },
  { name: 'Fri', incidents: 2 },
  { name: 'Sat', incidents: 0 },
  { name: 'Sun', incidents: 1 },
];

const mockStatusData = [
  { name: 'Resolved', value: 400 },
  { name: 'False Positive', value: 300 },
  { name: 'Acknowledged', value: 100 },
  { name: 'New', value: 50 },
];
const COLORS = ['#2ecc71', '#95a5a6', '#f39c12', '#e74c3c'];

const Dashboard = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="dashboard">
        <div className="container">
          <div className="page-header">
            <h2>{t('Dashboard')}</h2>
            <div className="header-actions">
              <span className="last-updated">Last updated: Just now</span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><Camera size={24} /></div>
              <div className="stat-details">
                <span className="stat-label">Active Cameras</span>
                <span className="stat-value">1 / 1</span>
              </div>
            </div>
            
            <div className="stat-card warning">
              <div className="stat-icon"><ShieldAlert size={24} /></div>
              <div className="stat-details">
                <span className="stat-label">New Incidents (24h)</span>
                <span className="stat-value">3</span>
              </div>
            </div>
            
            <div className="stat-card success">
              <div className="stat-icon"><CheckCircle size={24} /></div>
              <div className="stat-details">
                <span className="stat-label">Resolved (24h)</span>
                <span className="stat-value">12</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon"><AlertTriangle size={24} /></div>
              <div className="stat-details">
                <span className="stat-label">Avg Response Time</span>
                <span className="stat-value">14s</span>
              </div>
            </div>
          </div>

          <div className="charts-layout">
            <div className="chart-card">
              <h3>Incidents by Day</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockDailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                    <XAxis dataKey="name" stroke="#9e9e9e" />
                    <YAxis stroke="#9e9e9e" allowDecimals={false} />
                    <Tooltip cursor={{fill: '#1c1c1f'}} contentStyle={{backgroundColor: '#121214', border: '1px solid #2a2a2e'}} />
                    <Bar dataKey="incidents" fill="#E03A3E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="chart-card">
              <h3>Incident Status Distribution</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {mockStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#121214', border: '1px solid #2a2a2e'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pie-legend">
                {mockStatusData.map((entry, index) => (
                  <div key={index} className="legend-item">
                    <span className="color-dot" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                    <span className="label">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="recent-incidents">
            <div className="card-header">
              <h3>Recent Incidents</h3>
              <Link to="/incidents" className="view-all">View All</Link>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Camera</th>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#INC-1042</td>
                    <td>Demo Camera</td>
                    <td><span className="badge threat">WEAPON</span></td>
                    <td>10 mins ago</td>
                    <td><span className="status-badge new">NEW</span></td>
                  </tr>
                  <tr>
                    <td>#INC-1041</td>
                    <td>Demo Camera</td>
                    <td><span className="badge threat">WEAPON</span></td>
                    <td>1 hour ago</td>
                    <td><span className="status-badge ack">ACKNOWLEDGED</span></td>
                  </tr>
                  <tr>
                    <td>#INC-1040</td>
                    <td>Demo Camera</td>
                    <td><span className="badge threat">WEAPON</span></td>
                    <td>5 hours ago</td>
                    <td><span className="status-badge resolved">RESOLVED</span></td>
                  </tr>
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
