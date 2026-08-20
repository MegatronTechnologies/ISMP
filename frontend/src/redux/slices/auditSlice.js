import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  events: [],
};

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    addAuditEvent: (state, action) => {
      state.events.unshift(action.payload);
    }
  }
});

export const { addAuditEvent } = auditSlice.actions;
export default auditSlice.reducer;
