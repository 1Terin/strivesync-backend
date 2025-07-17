// functions/habits/habitservice.ts
import { HabitRepository } from './habitrepository';
import { AppError } from '../../common/errors';
import { v4 as uuidv4 } from 'uuid';
import { Habit } from '../../api-types/habits';

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
        const createdAt = new Date().toISOString();

        const newHabitPartial: Omit<Habit, 'PK' | 'SK' | 'updatedAt' | 'gsi1pk' | 'gsi1sk'> = {
            habitId,
            habitName,
            reminderTime: reminderTime || null,
            isPublic: isPublic ?? false,
            createdAt,
            userId,
        };

        const createdHabit = await this.habitRepository.createHabit(userId, newHabitPartial);

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

    // NEW FUNCTION: List all public habits
    async listPublicHabits(): Promise<Omit<Habit, 'PK' | 'SK' | 'gsi1pk' | 'gsi1sk'>[]> {
        const publicHabits = await this.habitRepository.listPublicHabits();
        // Omit internal DynamoDB keys for each habit before returning
        return publicHabits.map(({ PK, SK, gsi1pk, gsi1sk, ...habitForClient }) => habitForClient);
    }
}