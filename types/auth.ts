/**
 * Authentication related types
 */

export interface SignupFormStep1 {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userLogo?: string; // URI for the selected image
}

export interface SignupFormStep2 {
  phone: string;
  companyName: string;
  streetAddress: string;
  streetAddressLine2: string;
  city: string;
  postalCode: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface SignupData {
  userLogo?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  companyName?: string;
  address?: {
    streetAddress?: string;
    streetAddressLine2?: string;
    city?: string;
    postalCode?: string;
  };
}

export interface UserProfile {
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  userLogo?: string;
  phone?: string;
  companyName?: string;
  address?: {
    streetAddress?: string;
    streetAddressLine2?: string;
    city?: string;
    postalCode?: string;
  };
} 