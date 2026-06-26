import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  industry: null,
  isAuthenticated: false,
  isActive: false,
  registrationComplete: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.industry = action.payload.user_type || null;
      state.isAuthenticated = true;
      state.isActive = action.payload.is_active || false;
      state.registrationComplete = action.payload.registration_complete || false;
    },
    setIndustry: (state, action) => {
      state.industry = action.payload;
      if (state.user) {
        state.user.user_type = action.payload;
      }
    },
    logout: (state) => {
      state.user = null;
      state.industry = null;
      state.isAuthenticated = false;
      state.isActive = false;
      state.registrationComplete = false;
    },
  },
});

export const { setUser, setIndustry, logout } = userSlice.actions;
export default userSlice.reducer;
