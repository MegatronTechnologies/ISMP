import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY_HANDLED = 'ismp_handled_incident_ids';
const STORAGE_KEY_ARMED = 'ismp_sos_armed';

const getInitialHandledIds = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HANDLED);
    return raw ? JSON.parse(raw) : [];
  } catch (_err) {
    return [];
  }
};

const getInitialArmedState = () => {
  try {
    return localStorage.getItem(STORAGE_KEY_ARMED) === 'true';
  } catch (_err) {
    return false;
  }
};

const saveHandledIds = (ids) => {
  try {
    const bounded = ids.slice(-200);
    localStorage.setItem(STORAGE_KEY_HANDLED, JSON.stringify(bounded));
  } catch (_err) {}
};

const saveArmedState = (isArmed) => {
  try {
    localStorage.setItem(STORAGE_KEY_ARMED, isArmed ? 'true' : 'false');
  } catch (_err) {}
};

const initialState = {
  activeAlert: null,
  isAlarmPlaying: false,
  isOverlayOpen: false,
  isBannerActive: false,
  isArmed: getInitialArmedState(),
  soundReady: false,
  notificationPermission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  handledIncidentIds: getInitialHandledIds(),
};

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    triggerAlert: (state, action) => {
      const incident = action.payload;
      if (!incident || !incident.id) return;

      state.activeAlert = {
        id: incident.id,
        cameraId: incident.cameraId || 'unknown-camera',
        cameraName: incident.cameraName || incident.cameraId || 'Camera',
        detectionType: incident.detectionType || incident.label || 'BOTTLE',
        confidence: incident.confidence !== undefined ? incident.confidence : 0.9,
        timestamp: incident.startedAt || incident.createdAt || new Date().toISOString(),
        source: incident.source || 'YOLO_EDGE',
      };
      state.isAlarmPlaying = true;
      state.isOverlayOpen = true;
      state.isBannerActive = true;

      if (!state.handledIncidentIds.includes(incident.id)) {
        state.handledIncidentIds.push(incident.id);
        saveHandledIds(state.handledIncidentIds);
      }
    },
    dismissOverlay: (state) => {
      state.isOverlayOpen = false;
      // Note: isBannerActive and isAlarmPlaying remain true until stopEmergencyAlert
    },
    stopEmergencyAlert: (state) => {
      state.isAlarmPlaying = false;
      state.isOverlayOpen = false;
      state.isBannerActive = false;
      state.activeAlert = null;
    },
    setArmed: (state, action) => {
      state.isArmed = !!action.payload;
      saveArmedState(state.isArmed);
    },
    setSoundReady: (state, action) => {
      state.soundReady = !!action.payload;
    },
    setNotificationPermission: (state, action) => {
      state.notificationPermission = action.payload;
    },
    markIncidentHandled: (state, action) => {
      const id = action.payload;
      if (id && !state.handledIncidentIds.includes(id)) {
        state.handledIncidentIds.push(id);
        saveHandledIds(state.handledIncidentIds);
      }
    },
  },
});

export const {
  triggerAlert,
  dismissOverlay,
  stopEmergencyAlert,
  setArmed,
  setSoundReady,
  setNotificationPermission,
  markIncidentHandled,
} = emergencySlice.actions;

export default emergencySlice.reducer;
