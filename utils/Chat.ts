import api from "../services/api";
import { store } from "@/store";
import { storeChats } from "@/store/slices/chatSlice";

export interface Chat {
  id: string;
  type: string;
  createdAt: string;
}

export interface Message {
  id: string;
  roomId: string | null;
  chatId: string;
  senderId: string;
  content: string;
  isOpen: boolean;
  timestamp: string;
  type?: string;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
}

export const getChats = async (): Promise<Chat[]> => {
  try {
    const response = await api.get("/chats/all-chats");
    const chats = response.data as Chat[];
    store.dispatch(storeChats(chats));
    return chats;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
};

export const getChatMessages = async (
  chatId: string,
  page: number = 1,
  limit: number = 10,
): Promise<MessagesResponse> => {
  try {
    const response = await api.get(
      `/chats/messages/${chatId}?page=${page}&limit=${limit}`,
    );
    return response.data as MessagesResponse;
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return { messages: [], total: 0 };
  }
};
