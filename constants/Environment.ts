// Environment.ts - Access environment variables using Expo's approach
// This approach works with Expo Router and doesn't require react-native-dotenv

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// We need to determine if we're running in a development, preview or production build
const getApiUrl = () => {
  // Get the API URL from environment variable
  let apiUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // If running on a physical Android device, make sure to use the correct URL
  if (Platform.OS === 'android') {
    // For Android emulators, localhost or 127.0.0.1 should be replaced with 10.0.2.2
    if (apiUrl?.includes('localhost') || apiUrl?.includes('127.0.0.1')) {
      apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
    }
    
    // Log the API URL being used (helpful for debugging)
    console.log('Using API URL on Android:', apiUrl);
  }
  
  // If no API URL is found, use a default fallback
  if (!apiUrl) {
    apiUrl = 'http://31.172.73.162:4000';
    console.log('Using fallback API URL:', apiUrl);
  }
  
  return apiUrl;
};

export const API_URL = getApiUrl();
