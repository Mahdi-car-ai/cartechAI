import { configureStore } from '@reduxjs/toolkit';
import vinHistoryReducer from './slices/vinHistorySlice';
import licensePlateHistoryReducer from './slices/licensePlateHistorySlice';

export const store = configureStore({
  reducer: {
    vinHistory: vinHistoryReducer,
    licensePlateHistory: licensePlateHistoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 