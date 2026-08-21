import { createSlice } from '@reduxjs/toolkit';

const initialDemoIncident = {
  id: 'INC-1040',
  cameraId: 'demo-camera',
  cameraName: 'Demo Camera',
  cameraScope: 'GLOBAL',
  detectionType: 'WEAPON',
  confidence: 0.88,
  status: 'RESOLVED',
  startedAt: new Date(Date.now() - 18000000).toISOString(),
  acknowledgedAt: new Date(Date.now() - 17900000).toISOString(),
  resolvedAt: new Date(Date.now() - 17800000).toISOString(),
  responseTime: '2m',
  source: 'SIMULATED',
};

const mergeAndSortIncidents = (simulated = [], real = []) => {
  const map = new Map();

  // First add real backend incidents
  real.forEach(inc => {
    if (inc && inc.id) {
      map.set(inc.id, {
        ...inc,
        source: inc.source || 'YOLO_EDGE',
      });
    }
  });

  // Then add simulated incidents (without overwriting real incidents with same ID if any)
  simulated.forEach(inc => {
    if (inc && inc.id && !map.has(inc.id)) {
      map.set(inc.id, {
        ...inc,
        source: inc.source || 'SIMULATED',
      });
    }
  });

  // Sort newest first by startedAt / createdAt
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.startedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.startedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
};

const initialState = {
  incidents: [initialDemoIncident],
  simulatedIncidents: [initialDemoIncident],
  realIncidents: [],
  isLoading: false,
  error: null,
  lastSyncedAt: null,
};

const incidentSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    addIncident: (state, action) => {
      const newSimulated = {
        ...action.payload,
        source: action.payload?.source || 'SIMULATED',
      };
      state.simulatedIncidents.unshift(newSimulated);
      state.incidents = mergeAndSortIncidents(state.simulatedIncidents, state.realIncidents);
    },
    updateIncidentStatus: (state, action) => {
      const { id, status, timestamp, responseTime } = action.payload;
      const simIncident = state.simulatedIncidents.find(inc => inc.id === id);
      if (simIncident) {
        simIncident.status = status;
        if (status === 'ACKNOWLEDGED') {
          simIncident.acknowledgedAt = timestamp;
          simIncident.responseTime = responseTime;
        } else if (status === 'RESOLVED' || status === 'FALSE_POSITIVE') {
          simIncident.resolvedAt = timestamp;
        }
      }
      state.incidents = mergeAndSortIncidents(state.simulatedIncidents, state.realIncidents);
    },
    setRealIncidents: (state, action) => {
      state.realIncidents = Array.isArray(action.payload) ? action.payload : [];
      state.error = null;
      state.lastSyncedAt = new Date().toISOString();
      state.incidents = mergeAndSortIncidents(state.simulatedIncidents, state.realIncidents);
    },
    upsertSingleRealIncident: (state, action) => {
      const incident = action.payload;
      if (!incident || !incident.id) return;

      const idx = state.realIncidents.findIndex(i => i.id === incident.id);
      if (idx >= 0) {
        state.realIncidents[idx] = incident;
      } else {
        state.realIncidents.unshift(incident);
      }
      state.incidents = mergeAndSortIncidents(state.simulatedIncidents, state.realIncidents);
    },
    setIncidentSyncError: (state, action) => {
      state.error = action.payload;
    },
    clearIncidentSyncError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addIncident,
  updateIncidentStatus,
  setRealIncidents,
  upsertSingleRealIncident,
  setIncidentSyncError,
  clearIncidentSyncError,
} = incidentSlice.actions;

export default incidentSlice.reducer;

