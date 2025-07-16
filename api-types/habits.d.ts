// strivesync-backend-api/api-types/habits.d.ts

/**
 * Interface for the request body when creating a new habit.
 */
export interface CreateHabitRequest {
    habitName: string;
    reminderTime?: string; // Optional, e.g., "07:00"
    isPublic?: boolean;   // Optional, defaults to false
}

/**
 * Interface for a Habit item as stored in DynamoDB or returned by the API.
 */
export interface Habit {
    habitId: string;
    userId: string; // The user who owns this habit (from PK)
    habitName: string;
    reminderTime: string | null; // e.g., "07:00"
    isPublic: boolean;
    createdAt: string; // ISO 8601 string
}

/**
 * Interface for the response body when a habit is successfully created.
 */
export interface CreateHabitResponse {
    message: string;
    habit: Habit;
}

/**
 * Interface for the response body when listing habits.
 */
export interface ListHabitsResponse {
    habits: Habit[];
}