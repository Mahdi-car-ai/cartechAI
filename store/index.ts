import { configureStore } from '@reduxjs/toolkit';
import vinHistoryReducer from './slices/vinHistorySlice';

export const store = configureStore({
  reducer: {
    vinHistory: vinHistoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 