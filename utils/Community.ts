import api from "../services/api";

export interface CommunityChat {
  id: string;
  type: string;
  topic: string;
  description: string;
  createdAt: string;
  usersCount?: number;
}

export interface Message {
  id: string;
  roomId: string | null;
  chatId: string;
  senderId: string;
  content: string;
  isOpen: boolean;
  timestamp: string;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
}

export const getCommunityChats = async (): Promise<CommunityChat[]> => {
  try {
    const response = await api.get("/chats/common");
    return response.data as CommunityChat[];
  } catch (error) {
    console.error("Error fetching community chats:", error);
    return [];
  }
};

export const getCommunityChat = async (
  chatId: string
): Promise<CommunityChat | null> => {
  try {
    // First try to find it in the common chats
    const communityChats = await getCommunityChats();
    const matchingChat = communityChats.find((chat) => chat.id === chatId);

    if (matchingChat) {
      return matchingChat;
    }

    // If not found, try the specific chat endpoint
    const response = await api.get(`/chats/${chatId}`);
    return response.data as CommunityChat;
  } catch (error) {
    console.error(`Error fetching community chat with ID ${chatId}:`, error);
    return null;
  }
};

export const createCommunityChat = async (
  topic: string,
  description: string
): Promise<CommunityChat | null> => {
  try {
    const response = await api.post("/chats/create-community", {
      topic,
      description,
    });
    return response.data as CommunityChat;
  } catch (error) {
    console.error("Error creating community chat:", error);
    return null;
  }
};

export const getChatMessages = async (
  chatId: string,
  page: number = 1,
  limit: number = 10
): Promise<MessagesResponse> => {
  try {
    const response = await api.get(
      `/chats/messages/${chatId}?page=${page}&limit=${limit}`
    );
    return response.data as MessagesResponse;
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return { messages: [], total: 0 };
  }
};
