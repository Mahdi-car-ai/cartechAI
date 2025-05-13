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
  phoneNumber: string;
  companyName: string;
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  postCode: string;
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
  phoneNumber: string;
  companyName?: string;
  address?: {
    streetAddress1?: string;
    streetAddress2?: string;
    city?: string;
    postCode?: string;
  };
}

export interface UserProfile {
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  userLogo?: string;
  phoneNumber?: string;
  companyName?: string;
  address?: {
    streetAddress1?: string;
    streetAddress2?: string;
    city?: string;
    postCode?: string;
  };
}
