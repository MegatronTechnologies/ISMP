import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [
    { id: 1, type: 'critical', title: 'Weapon Detected', time: new Date(Date.now() - 600000).toISOString(), desc: 'Camera: Main Gate (Cam-01). Confidence: 94%', read: false, incidentId: 'INC-1040' },
  ],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => { n.read = true; });
    }
  }
});

export const { addNotification, markAsRead, markAllAsRead } = notificationSlice.actions;
export default notificationSlice.reducer;
