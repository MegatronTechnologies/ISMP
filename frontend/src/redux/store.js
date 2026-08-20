import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import simulationReducer from './slices/simulationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    simulation: simulationReducer,
  },
});
