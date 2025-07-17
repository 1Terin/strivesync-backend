// functions/habits/habitService.ts

import { HabitRepository } from './habitrepository';
import { AppError } from '../../common/errors';
import { v4 as uuidv4 } from 'uuid';
import { Habit, UpdateHabitRequest } from '../../api-types/habits';

export class HabitService {
    private habitRepository: HabitRepository;

    constructor() {
        this.habitRepository = new HabitRepository();
    }

    async createHabit(userId: string, habitName: string, reminderTime?: string, isPublic?: boolean): Promise<Omit<Habit, 'PK' | 'SK' | 'gsi1pk' | 'gsi1sk'>> {
        if (!habitName || habitName.trim() === '') {
            throw new AppError('Habit name cannot be empty', 400);
        }

        const habitId = uuidv4();
        const now = new Date().toISOString();

        const newHabit: Habit = {
            PK: `USER#${userId}`,
            SK: `HABIT#${habitId}`,
            habitId: habitId,
            userId: userId, // Explicitly set userId
            habitName: habitName,
            reminderTime: reminderTime !== undefined ? reminderTime : null,
            isPublic: isPublic ?? false,
            createdAt: now,
            updatedAt: now,
        };

        // Conditionally set GSI attributes for public habits
        if (newHabit.isPublic) {
            newHabit.gsi1pk = 'PUBLIC_HABIT';
            newHabit.gsi1sk = `CREATED_AT#${newHabit.createdAt}#HABIT#${newHabit.habitId}`;
        }

        const createdHabit = await this.habitRepository.createHabit(newHabit);

        // Omit internal DynamoDB keys before returning to the client
        const { PK, SK, gsi1pk, gsi1sk, ...habitForClient } = createdHabit;
        return habitForClient;
    }

    async listHabits(userId: string): Promise<Omit<Habit, 'PK' | 'SK' | 'gsi1pk' | 'gsi1sk'>[]> {
        if (!userId) {
            throw new AppError('User ID is required to list habits', 400);
        }

        const habits = await this.habitRepository.listHabitsByUserId(userId);
        // Omit internal DynamoDB keys for each habit before returning
        return habits.map(({ PK, SK, gsi1pk, gsi1sk, ...habitForClient }) => habitForClient);
    }

    async listPublicHabits(): Promise<Omit<Habit, 'PK' | 'SK' | 'gsi1pk' | 'gsi1sk'>[]> {
        const publicHabits = await this.habitRepository.listPublicHabits();
        // Omit internal DynamoDB keys for each habit before returning
        return publicHabits.map(({ PK, SK, gsi1pk, gsi1sk, ...habitForClient }) => habitForClient);
    }

    async updateHabit(userId: string, habitId: string, updates: UpdateHabitRequest): Promise<Omit<Habit, 'PK' | 'SK' | 'gsi1pk' | 'gsi1sk'>> {
        if (!userId) {
            throw new AppError('Unauthorized: User ID not found.', 401);
        }
        if (!habitId) {
            throw new AppError('Habit ID is required for update.', 400);
        }

        const existingHabit = await this.habitRepository.getHabitById(userId, habitId);

        if (!existingHabit) {
            throw new AppError('Habit not found or does not belong to user.', 404);
        }

        // Check if any actual updates are provided
        const hasUpdates = Object.keys(updates).some(key => updates[key as keyof UpdateHabitRequest] !== undefined);
        if (!hasUpdates) {
             throw new AppError('No valid fields provided for update.', 400);
        }

        // Perform the update
        const updatedHabit = await this.habitRepository.updateHabit(userId, habitId, updates, existingHabit);

        // Omit internal DynamoDB keys before returning to the client
        const { PK, SK, gsi1pk, gsi1sk, ...habitForClient } = updatedHabit;
        return habitForClient;
    }

    async deleteHabit(userId: string, habitId: string): Promise<void> {
        if (!userId) {
            throw new AppError('Unauthorized: User ID not found.', 401);
        }
        if (!habitId) {
            throw new AppError('Habit ID is required for deletion.', 400);
        }

        // Verify the habit exists and belongs to the user before attempting delete
        const existingHabit = await this.habitRepository.getHabitById(userId, habitId);
        if (!existingHabit) {
            throw new AppError('Habit not found or does not belong to user.', 404);
        }

        // The repository handles the actual deletion and removal of GSI entries automatically
        await this.habitRepository.deleteHabit(userId, habitId);
    }
}