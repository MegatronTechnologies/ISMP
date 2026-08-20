import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  incidents: [
    { 
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
      responseTime: '2m'
    }
  ],
};

const incidentSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    addIncident: (state, action) => {
      state.incidents.unshift(action.payload);
    },
    updateIncidentStatus: (state, action) => {
      const { id, status, timestamp, responseTime } = action.payload;
      const incident = state.incidents.find(inc => inc.id === id);
      if (incident) {
        incident.status = status;
        if (status === 'ACKNOWLEDGED') {
          incident.acknowledgedAt = timestamp;
          incident.responseTime = responseTime;
        } else if (status === 'RESOLVED' || status === 'FALSE_POSITIVE') {
          incident.resolvedAt = timestamp;
        }
      }
    }
  }
});

export const { addIncident, updateIncidentStatus } = incidentSlice.actions;
export default incidentSlice.reducer;
