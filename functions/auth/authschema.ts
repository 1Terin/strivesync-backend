// functions/auth/authSchema.ts
import { z } from 'zod';
import { LoginRequest, SignupRequest } from 'api-types/auth';

export const LoginRequestSchema: z.ZodSchema<LoginRequest> = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const SignupRequestSchema: z.ZodSchema<SignupRequest> = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  username: z.string().min(3, "Username must be at least 3 characters long"),
});

export const ConfirmSignupRequestSchema = z.object({
    email: z.string().email("Invalid email format"),
    verificationCode: z.string().min(1, "Verification code is required").max(6, "Verification code is usually 6 digits"), // Assuming 6-digit code
});