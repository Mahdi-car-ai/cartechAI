import { createSlice as createReduxSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VinHistoryState {
  searchHistory: string[];
  isLoading: boolean;
}

const initialState: VinHistoryState = {
  searchHistory: [],
  isLoading: true,
};

const STORAGE_KEY = 'vin_search_history';

export const vinHistorySlice = createReduxSlice({
  name: 'vinHistory',
  initialState,
  reducers: {
    setVinHistory: (state, action: PayloadAction<string[]>) => {
      state.searchHistory = action.payload;
      state.isLoading = false;
    },
    addVinToHistory: (state, action: PayloadAction<string>) => {
      // Prevent duplicates
      if (!state.searchHistory.includes(action.payload)) {
        // Add new VIN to the beginning of the array
        state.searchHistory = [action.payload, ...state.searchHistory].slice(0, 10); // Keep only 10 most recent
        
        // Save to AsyncStorage
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.searchHistory));
      }
    },
    clearVinHistory: (state) => {
      state.searchHistory = [];
      AsyncStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { setVinHistory, addVinToHistory, clearVinHistory } = vinHistorySlice.actions;

// Thunk to load VIN history from AsyncStorage
export const loadVinHistory = () => async (dispatch: any) => {
  try {
    const historyString = await AsyncStorage.getItem(STORAGE_KEY);
    const history = historyString ? JSON.parse(historyString) : [];
    dispatch(setVinHistory(history));
  } catch (error) {
    console.error('Failed to load VIN history:', error);
    dispatch(setVinHistory([]));
  }
};

export default vinHistorySlice.reducer; 