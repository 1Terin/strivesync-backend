// api-types/users.d.ts (UPDATE THIS FILE)

export interface UserProfile {
    // DynamoDB PK and SK for user items - THESE ARE NEW
    PK: string; // Format: USER#<userId>
    SK: string; // Format: PROFILE

    userId: string; // The Cognito sub (unique ID)
    email: string;
    username: string; // From your previous UserProfile
    firstName?: string; // From your previous UserProfile
    lastName?: string; // From your previous UserProfile
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
    // Add other user profile attributes here as needed from the blueprint
    // e.g., location, avatar, bio, totalPoints, etc.
}

export type UpdateUserProfileRequest = Partial<Omit<UserProfile, 'PK' | 'SK' | 'userId' | 'email' | 'createdAt' | 'updatedAt'>>;

export interface GetUserProfileResponse extends Omit<UserProfile, 'PK' | 'SK'> {}