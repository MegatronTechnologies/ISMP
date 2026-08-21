import { createSlice } from '@reduxjs/toolkit';

const initialDemoNotification = {
  id: 'NOTIF-1',
  type: 'critical',
  title: 'SECURITY ALERT: Potential Weapon Detected',
  time: new Date(Date.now() - 600000).toISOString(),
  desc: 'Camera: {{camera}}. Confidence: {{confidence}}%',
  read: false,
  incidentId: 'INC-1040',
  payload: { confidence: 94, camera: "Main Gate (Cam-01)" },
  source: 'SIMULATED',
};

const mergeAndSortNotifications = (simulated = [], real = [], overrides = {}) => {
  const map = new Map();

  // First add real backend notifications
  real.forEach(n => {
    if (n && n.id) {
      const isRead = Boolean(overrides[n.id] || n.read);
      map.set(n.id, {
        ...n,
        read: isRead,
        source: n.source || 'YOLO_EDGE',
      });
    }
  });

  // Then add simulated notifications
  simulated.forEach(n => {
    if (n && n.id && !map.has(n.id)) {
      const isRead = Boolean(overrides[n.id] || n.read);
      map.set(n.id, {
        ...n,
        read: isRead,
        source: n.source || 'SIMULATED',
      });
    }
  });

  // Sort newest first by time
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.time || a.createdAt || 0).getTime();
    const timeB = new Date(b.time || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
};

const initialState = {
  notifications: [initialDemoNotification],
  simulatedNotifications: [initialDemoNotification],
  realNotifications: [],
  localReadOverrides: {},
  isLoading: false,
  error: null,
  lastSyncedAt: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const newSimulated = {
        ...action.payload,
        source: action.payload?.source || 'SIMULATED',
      };
      state.simulatedNotifications.unshift(newSimulated);
      state.notifications = mergeAndSortNotifications(
        state.simulatedNotifications,
        state.realNotifications,
        state.localReadOverrides
      );
    },
    markAsRead: (state, action) => {
      const id = action.payload;
      state.localReadOverrides[id] = true;

      const notif = state.notifications.find(n => n.id === id);
      if (notif) notif.read = true;

      const simNotif = state.simulatedNotifications.find(n => n.id === id);
      if (simNotif) simNotif.read = true;

      const realNotif = state.realNotifications.find(n => n.id === id);
      if (realNotif) realNotif.read = true;
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => {
        state.localReadOverrides[n.id] = true;
        n.read = true;
      });
      state.simulatedNotifications.forEach(n => {
        n.read = true;
      });
      state.realNotifications.forEach(n => {
        n.read = true;
      });
    },
    setRealNotifications: (state, action) => {
      state.realNotifications = Array.isArray(action.payload) ? action.payload : [];
      state.error = null;
      state.lastSyncedAt = new Date().toISOString();
      state.notifications = mergeAndSortNotifications(
        state.simulatedNotifications,
        state.realNotifications,
        state.localReadOverrides
      );
    },
    setNotificationSyncError: (state, action) => {
      state.error = action.payload;
    },
    clearNotificationSyncError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  setRealNotifications,
  setNotificationSyncError,
  clearNotificationSyncError,
} = notificationSlice.actions;

export default notificationSlice.reducer;

