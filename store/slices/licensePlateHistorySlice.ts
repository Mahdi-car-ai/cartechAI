import { createSlice as createReduxSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LicensePlateEntry {
  plate: string;
  state: string;
}

interface LicensePlateHistoryState {
  searchHistory: LicensePlateEntry[];
  isLoading: boolean;
}

const initialState: LicensePlateHistoryState = {
  searchHistory: [],
  isLoading: true,
};

const STORAGE_KEY = 'license_plate_search_history';

export const licensePlateHistorySlice = createReduxSlice({
  name: 'licensePlateHistory',
  initialState,
  reducers: {
    setLicensePlateHistory: (state, action: PayloadAction<LicensePlateEntry[]>) => {
      state.searchHistory = action.payload;
      state.isLoading = false;
    },
    addLicensePlateToHistory: (state, action: PayloadAction<LicensePlateEntry>) => {
      // Remove if exists already
      const existingIndex = state.searchHistory.findIndex(
        item => item.plate === action.payload.plate && item.state === action.payload.state
      );
      
      if (existingIndex >= 0) {
        state.searchHistory.splice(existingIndex, 1);
      }
      
      // Add new entry to the beginning of the array
      state.searchHistory = [action.payload, ...state.searchHistory].slice(0, 10); // Keep only 10 most recent
      
      // Save to AsyncStorage
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.searchHistory));
    },
    clearLicensePlateHistory: (state) => {
      state.searchHistory = [];
      AsyncStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { 
  setLicensePlateHistory, 
  addLicensePlateToHistory, 
  clearLicensePlateHistory 
} = licensePlateHistorySlice.actions;

// Thunk to load license plate history from AsyncStorage
export const loadLicensePlateHistory = () => async (dispatch: any) => {
  try {
    const historyString = await AsyncStorage.getItem(STORAGE_KEY);
    const history = historyString ? JSON.parse(historyString) : [];
    dispatch(setLicensePlateHistory(history));
  } catch (error) {
    console.error('Failed to load license plate history:', error);
    dispatch(setLicensePlateHistory([]));
  }
};

export default licensePlateHistorySlice.reducer; 