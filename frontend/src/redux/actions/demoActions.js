import { simulateThreat, resolveThreat as resolveSimulation } from '../slices/simulationSlice';
import { addIncident, updateIncidentStatus } from '../slices/incidentSlice';
import { addNotification } from '../slices/notificationSlice';
import { addAuditEvent } from '../slices/auditSlice';

export const triggerThreatSimulation = () => (dispatch, getState) => {
  const { auth } = getState();
  const actor = auth.user ? auth.user.name : 'System';
  const timestamp = new Date().toISOString();
  
  // 1. Simulate Threat
  dispatch(simulateThreat());
  
  // 2. Create Incident
  const incidentId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
  dispatch(addIncident({
    id: incidentId,
    cameraId: "demo-camera",
    cameraName: "Demo Camera",
    cameraScope: "GLOBAL",
    detectionType: "Potential Weapon",
    confidence: 0.94,
    status: "NEW",
    startedAt: timestamp,
    acknowledgedAt: null,
    resolvedAt: null,
    responseTime: null,
    thumbnail: null,
    video: null
  }));
  
  // 3. Create Notification
  dispatch(addNotification({
    id: Math.random().toString(36).substr(2, 9),
    type: 'critical',
    title: 'Potential Weapon Detected',
    time: timestamp,
    desc: 'Camera: Demo Camera. Confidence: 94%',
    read: false,
    incidentId: incidentId
  }));
  
  // 4. Audit Event
  dispatch(addAuditEvent({
    id: Math.random().toString(36).substr(2, 9),
    actor,
    action: 'Simulated Threat',
    resource: incidentId,
    timestamp
  }));
};

export const acknowledgeDemoIncident = (id) => (dispatch, getState) => {
  const { auth, incidents } = getState();
  const actor = auth.user ? auth.user.name : 'System';
  const timestamp = new Date().toISOString();
  
  const incident = incidents.incidents.find(i => i.id === id);
  if (!incident) return;
  
  const startedAt = new Date(incident.startedAt).getTime();
  const responseTimeSecs = Math.floor((new Date().getTime() - startedAt) / 1000);
  const responseTime = `${Math.floor(responseTimeSecs / 60)}m ${responseTimeSecs % 60}s`;

  dispatch(updateIncidentStatus({ id, status: 'ACKNOWLEDGED', timestamp, responseTime }));
  
  dispatch(addAuditEvent({
    id: Math.random().toString(36).substr(2, 9),
    actor,
    action: 'Acknowledged Incident',
    resource: id,
    timestamp
  }));
};

export const resolveDemoIncident = (id, status = 'RESOLVED') => (dispatch, getState) => {
  const { auth } = getState();
  const actor = auth.user ? auth.user.name : 'System';
  const timestamp = new Date().toISOString();
  
  dispatch(updateIncidentStatus({ id, status, timestamp }));
  
  dispatch(addAuditEvent({
    id: Math.random().toString(36).substr(2, 9),
    actor,
    action: status === 'RESOLVED' ? 'Resolved Incident' : 'Marked False Positive',
    resource: id,
    timestamp
  }));
  
  // Also turn off simulation if we are resolving the demo one
  dispatch(resolveSimulation());
};
