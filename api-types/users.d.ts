// src/api-types/users.d.ts
export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}