import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import simulationReducer from './slices/simulationSlice';
import incidentReducer from './slices/incidentSlice';
import notificationReducer from './slices/notificationSlice';
import auditReducer from './slices/auditSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    simulation: simulationReducer,
    incidents: incidentReducer,
    notifications: notificationReducer,
    audit: auditReducer,
  },
});
