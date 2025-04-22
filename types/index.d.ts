/**
 * Type definitions for Cartechai application
 */

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  text?: string;
  message?: string;
  sender: string;
  images?: string[];
  youtubeVideo?: {
    title: string;
    link: string;
    thumbnail: string;
  } | null;
  [key: string]: any;
}

/**
 * Props for the RenderChat component
 */
export interface RenderChatProps {
  item: ChatMessage;
  loadingStates: Record<string, boolean>;
  setLoadingStates: (prev: Record<string, boolean>) => void;
} 