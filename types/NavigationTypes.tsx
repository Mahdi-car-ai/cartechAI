import { CarDetails } from './CarDetails';

/**
 * Type definitions for navigation parameters in the app
 */
export type RootStackParamList = {
  // Home screens
  Home: undefined;
  
  // Car screens
  CarDetails: { vin: string };
  EnterCarDetails: undefined;
  
  // Community screens
  CommunityScreen: undefined;
  CreatePostScreen: undefined;
  PostDetailsScreen: { postId: string };
  
  // Chat screens
  ChatScreen: { 
    carDetails?: CarDetails | null;
    chatId?: string; 
  };
  
  // User screens
  UserScreen: undefined;
  EditProfile: undefined;
  
  // Fallback for other screens
  [key: string]: undefined | object;
}; 