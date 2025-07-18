// api-types/habits.d.ts

export interface CreateHabitRequest {
    habitName: string;
    reminderTime?: string; // Optional, e.g., "07:00"
    isPublic?: boolean;   // Optional, defaults to false
}

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

export interface CreateHabitResponse {
    message: string;
    habit: Omit<Habit, 'PK' | 'SK' | 'gsi1pk' | 'gsi1sk'>; // Omit internal DB keys
}

export interface ListHabitsResponse {
    habits: Omit<Habit, 'PK' | 'SK' | 'gsi1pk' | 'gsi1sk'>[]; // Omit internal DB keys
}

export interface UpdateHabitRequest {
    habitName?: string;
    reminderTime?: string | null;
    isPublic?: boolean;
}

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