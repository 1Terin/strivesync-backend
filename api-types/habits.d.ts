// api-types/habits.d.ts

/**
 * Interface for the request body when creating a new habit.
 */
export interface CreateHabitRequest {
    habitName: string;
    reminderTime?: string; // Optional, e.g., "07:00"
    isPublic?: boolean;   // Optional, defaults to false
}

/**
 * Interface for a Habit item as stored in DynamoDB.
 * This now includes PK, SK, and GSI attributes for consistency.
 */
export interface Habit {
    PK: string; // Format: USER#<userId>
    SK: string; // Format: HABIT#<habitId>

    habitId: string;
    userId: string; // The user who owns this habit
    habitName: string;
    reminderTime: string | null; // e.g., "07:00"
    isPublic: boolean;
    createdAt: string; // ISO 8601 string
    updatedAt: string; // For general good practice

    // GSI attributes for public habits
    gsi1pk?: string; // Will be 'PUBLIC_HABIT' if isPublic is true
    gsi1sk?: string; // Will be 'CREATED_AT#<createdAt>#HABIT#<habitId>' if isPublic is true
}

/**
 * Interface for the response body when a habit is successfully created.
 * The 'habit' returned to the client should omit PK/SK/GSI attributes.
 */
export interface CreateHabitResponse {
    message: string;
    habit: Omit<Habit, 'PK' | 'SK' | 'gsi1pk' | 'gsi1sk'>; // Omit internal DB keys
}

/**
 * Interface for the response body when listing habits.
 * Habits returned to the client should omit PK/SK/GSI attributes.
 */
export interface ListHabitsResponse {
    habits: Omit<Habit, 'PK' | 'SK' | 'gsi1pk' | 'gsi1sk'>[]; // Omit internal DB keys
}

/**
 * Interface for the request body when updating an existing habit.
 * All fields are optional as it's a partial update.
 */
export interface UpdateHabitRequest {
    habitName?: string;
    reminderTime?: string | null;
    isPublic?: boolean;
}

/**
 * Interface for the response body when a habit is successfully updated.
 * The 'updatedHabit' returned to the client should omit PK/SK/GSI attributes.
 */
export interface UpdateHabitResponse {
    message: string;
    updatedHabit: Omit<Habit, 'PK' | 'SK' | 'gsi1pk' | 'gsi1sk'>; // Omit internal DB keys
}

/**
 * Interface for the response body when a habit is successfully deleted.
 */
export interface DeleteHabitResponse {
    message: string;
}