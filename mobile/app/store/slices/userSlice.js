import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  users: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchUsersStart: (state) => {
      state.loading = true;
    },
    fetchUsersSuccess: (state, action) => {
      state.loading = false;
      state.users = action.payload;
    },
    fetchUsersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateUserStatus: (state, action) => {
      const { userId, isOnline } = action.payload;
      const user = state.users.find(u => u._id === userId);
      if (user) {
        user.isOnline = isOnline;
      }
    },
  },
});

export const { fetchUsersStart, fetchUsersSuccess, fetchUsersFailure, updateUserStatus } = userSlice.actions;
export default userSlice.reducer;
