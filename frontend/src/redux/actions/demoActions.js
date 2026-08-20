import { simulateThreat, resolveThreat as resolveSimulation } from '../slices/simulationSlice';
import { addIncident, updateIncidentStatus } from '../slices/incidentSlice';
import { addNotification } from '../slices/notificationSlice';
import { addAuditEvent } from '../slices/auditSlice';

export const triggerThreatSimulation = () => (dispatch, getState) => {
  const { auth, incidents } = getState();
  const actor = auth.user ? auth.user.name : 'System';
  const timestamp = new Date().toISOString();
  
  // 1. Simulate Threat
  dispatch(simulateThreat());
  
  // 2. Generate unique incident ID
  let newId;
  let isUnique = false;
  while (!isUnique) {
    newId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    isUnique = !incidents.incidents.find(i => i.id === newId);
  }

  const incidentId = newId;

  dispatch(addIncident({
    id: incidentId,
    cameraId: "cam-01",
    cameraName: "Main Gate (Cam-01)",
    cameraScope: "GLOBAL",
    detectionType: "WEAPON",
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
    title: 'SECURITY ALERT: Potential Weapon Detected',
    time: timestamp,
    desc: 'Camera: {{camera}}. Confidence: {{confidence}}%',
    read: false,
    incidentId: incidentId,
    payload: { confidence: 94, camera: "Main Gate (Cam-01)" }
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
  const userRole = auth.user ? auth.user.role : 'USER';
  
  const timestamp = new Date().toISOString();
  
  const incident = incidents.incidents.find(i => i.id === id);
  if (!incident) return;
  
  // Rules check
  if (incident.status !== 'NEW') return; // Only allow NEW -> ACKNOWLEDGED
  if (!['USER', 'ORGANIZATION_ADMIN', 'SUPERADMIN'].includes(userRole)) return;
  
  const startedAt = new Date(incident.startedAt).getTime();
  const responseTimeSecs = Math.floor((new Date().getTime() - startedAt) / 1000);
  const responseTime = responseTimeSecs > 60 ? `${Math.floor(responseTimeSecs / 60)}m ${responseTimeSecs % 60}s` : `${responseTimeSecs}s`;

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
  const { auth, incidents } = getState();
  const actor = auth.user ? auth.user.name : 'System';
  const userRole = auth.user ? auth.user.role : 'USER';
  
  const timestamp = new Date().toISOString();
  
  const incident = incidents.incidents.find(i => i.id === id);
  if (!incident) return;

  // Rules check
  if (incident.status !== 'ACKNOWLEDGED') return; // Only allow ACKNOWLEDGED -> RESOLVED/FALSE_POSITIVE
  if (!['ORGANIZATION_ADMIN', 'SUPERADMIN'].includes(userRole)) return;
  
  dispatch(updateIncidentStatus({ id, status, timestamp }));
  
  dispatch(addAuditEvent({
    id: Math.random().toString(36).substr(2, 9),
    actor,
    action: status === 'RESOLVED' ? 'Resolved Incident' : 'Marked False Positive',
    resource: id,
    timestamp
  }));
  
  dispatch(resolveSimulation());
};
