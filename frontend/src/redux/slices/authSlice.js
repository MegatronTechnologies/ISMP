import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null, // { name, role, organization }
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setDemoRole: (state, action) => {
      if (state.user) {
        state.user.role = action.payload;
      }
    }
  },
});

export const { login, logout, setDemoRole } = authSlice.actions;
export default authSlice.reducer;
