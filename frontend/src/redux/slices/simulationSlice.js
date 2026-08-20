import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isThreatActive: false,
  demoCameraStatus: 'ONLINE',
};

const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    simulateThreat: (state) => {
      state.isThreatActive = true;
    },
    resolveThreat: (state) => {
      state.isThreatActive = false;
    },
    setCameraStatus: (state, action) => {
      state.demoCameraStatus = action.payload;
    }
  },
});

export const { simulateThreat, resolveThreat, setCameraStatus } = simulationSlice.actions;
export default simulationSlice.reducer;
