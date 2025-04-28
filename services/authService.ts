import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const login = async (credentials: LoginCredentials): Promise<boolean> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens and user data
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('userProfile', JSON.stringify(user));
    
    return true;
  } catch (error) {
    console.error('Login error:', error);
    return false;
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