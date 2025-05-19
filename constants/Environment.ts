// Environment.ts - Access environment variables using Expo's approach
// This approach works with Expo Router and doesn't require react-native-dotenv

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// We need to determine if we're running in a development, preview or production build
const getApiUrl = () => {
  // Get the API URL from environment variable
  let apiUrl = process.env.EXPO_PUBLIC_API_URL;
  
  console.log('Original API URL from env:', apiUrl);
  console.log('Platform:', Platform.OS);
  
  // If running on a physical Android device, make sure to use the correct URL
  if (Platform.OS === 'android') {
    // For Android emulators, localhost or 127.0.0.1 should be replaced with 10.0.2.2
    if (apiUrl?.includes('localhost') || apiUrl?.includes('127.0.0.1')) {
      apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
    }
    
    // Log the API URL being used (helpful for debugging)
    console.log('Using API URL on Android:', apiUrl);
    
    // Log network state for debugging
    NetInfo.fetch().then((state: NetInfoState) => {
      console.log('Current network state:');
      console.log('- Connected:', state.isConnected);
      console.log('- Connection type:', state.type);
      // Safely access potential IP address (available on some devices)
      console.log('- Network details:', JSON.stringify(state.details || {}));
      console.log('- Is connection expensive:', state.details?.isConnectionExpensive ? 'Yes' : 'No/Unknown');
    });
  }
  
  // If no API URL is found, use a default fallback
  if (!apiUrl) {
    apiUrl = 'http://31.172.73.162:4000';
    console.log('Using fallback API URL:', apiUrl);
  }
  
  return apiUrl;
};

// Check server reachability
const checkServerReachability = async () => {
  try {
    console.log('Checking server reachability...');
    const apiUrl = getApiUrl();
    
    // Add a timestamp to prevent caching
    const response = await fetch(`${apiUrl}/health?t=${Date.now()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Short timeout for quick check
      signal: AbortSignal.timeout(5000) 
    });
    
    if (response.ok) {
      console.log('Server is reachable!');
      return true;
    } else {
      console.log('Server returned error status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Server is not reachable:', error);
    return false;
  }
};

// Call this when app starts
setTimeout(() => {
  checkServerReachability();
}, 2000);

export const API_URL = getApiUrl();
