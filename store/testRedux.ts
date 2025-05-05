import { createSlice } from '@reduxjs/toolkit';

// Simple test slice
const testSlice = createSlice({
  name: 'test',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});

export const { increment } = testSlice.actions;
export default testSlice.reducer; 