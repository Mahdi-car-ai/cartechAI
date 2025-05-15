export interface ChatItem {
  id: string;
  type: string;
  createdAt: string;
}

export interface CategorizedChats {
  Today: ChatItem[];
  Yesterday: ChatItem[];
  "3 days ago": ChatItem[];
  "4 days ago": ChatItem[];
  "5 days ago": ChatItem[];
  "6 days ago": ChatItem[];
  "Last Week": ChatItem[];
  [key: string]: ChatItem[];
}

export interface ChatMessage {
  id: string;
  text?: string;
  message?: string;
  sender: string;
  images?: string[];
  type?: 'text' | 'image' | 'error' | 'system';
  youtubeVideo?: {
    title: string;
    link: string;
    thumbnail: string;
  } | null;
  timestamp?: Date;
  [key: string]: any;
}

export interface RenderChatProps {
  item: ChatMessage;
  loadingStates: Record<string, boolean>;
  setLoadingStates: (prev: Record<string, boolean>) => void;
}
