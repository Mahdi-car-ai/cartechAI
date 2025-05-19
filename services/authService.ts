import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

interface LoginResult {
  success: boolean;
  error?: {
    message: string;
    code?: string;
    isNetworkError?: boolean;
  };
}

export const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens and user data
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('userProfile', JSON.stringify(user));
    
    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error);

    // Provide detailed error information
    if (error && error.isAxiosError) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: {
            message: 'Connection timeout. Server is taking too long to respond.',
            code: 'TIMEOUT',
            isNetworkError: true
          }
        };
      }
      
      if (!error.response) {
        return {
          success: false,
          error: {
            message: 'No response from server. Please check your network connection.',
            code: 'NO_RESPONSE',
            isNetworkError: true
          }
        };
      }

      // Server returned an error response
      const statusCode = error.response.status;
      const errorData = error.response.data;
      const errorMessage = errorData?.message || 'An unknown error occurred';
      
      return {
        success: false,
        error: {
          message: errorMessage,
          code: `HTTP_${statusCode}`
        }
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        code: 'UNKNOWN_ERROR'
      }
    };
  }
};

export const logout = async (): Promise<boolean> => {
  try {
    // Call logout API if needed
    await api.post('/auth/logout');
    
    // Remove stored tokens and user data
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userProfile');
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if API call fails, clear local storage
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userProfile');
    
    return false;
  }
};

export const updateProfile = async (profileData: any): Promise<boolean> => {
  try {
    // This will automatically use the token refresh mechanism if needed
    await api.patch('/users', profileData);
    
    // Update local user profile
    const currentUserProfile = await AsyncStorage.getItem('userProfile');
    if (currentUserProfile) {
      const updatedProfile = {
        ...JSON.parse(currentUserProfile),
        ...profileData
      };
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    }
    
    // Also update email if changed
    if (profileData.email) {
      await AsyncStorage.setItem('userEmail', profileData.email);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
};

export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) return false;
    
    // Verify token validity with a lightweight API call
    const response = await api.get('/auth/verify');
    return response.status === 200;
  } catch (error) {
    console.error('Auth verification error:', error);
    return false;
  }
}; 