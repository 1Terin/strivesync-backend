// src/api-types/auth.d.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number; // Changed to optional to match Cognito SDK's type
  userProfile?: {
    userId: string;
    username: string;
    email: string;
  };
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

export interface SignupResponse {
  message: string;
  userId: string;
}

export interface ConfirmSignupRequest {
    email: string;
    verificationCode: string;
}