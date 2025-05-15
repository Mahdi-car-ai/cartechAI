import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Chat } from "@/utils/Chat";

interface ChatState {
  chats: Chat[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chats: [],
  isLoading: false,
  error: null,
};

export const storeChats = createAsyncThunk(
  "chat/storeChats",
  async (chats: Chat[], { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem("chats", JSON.stringify(chats));
      return chats;
    } catch (error) {
      return rejectWithValue("Failed to store chats in AsyncStorage");
    }
  },
);

export const loadChats = createAsyncThunk(
  "chat/loadChats",
  async (_, { rejectWithValue }) => {
    try {
      const storedChats = await AsyncStorage.getItem("chats");
      if (storedChats) {
        return JSON.parse(storedChats) as Chat[];
      }
      return [] as Chat[];
    } catch (error) {
      return rejectWithValue("Failed to load chats from AsyncStorage");
    }
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(storeChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(storeChats.fulfilled, (state, action) => {
        state.chats = action.payload;
        state.isLoading = false;
      })
      .addCase(storeChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loadChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadChats.fulfilled, (state, action) => {
        state.chats = action.payload;
        state.isLoading = false;
      })
      .addCase(loadChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setChats, addChat } = chatSlice.actions;
export default chatSlice.reducer;
