import { HabitRepository } from './habitrepository';
import { AppError } from '../../common/errors';
import { v4 as uuidv4 } from 'uuid'; // For generating unique habit IDs
// Import the new Habit type
import { Habit } from '../../api-types/habits';

export class HabitService {
    private habitRepository: HabitRepository;

    constructor() {
        this.habitRepository = new HabitRepository();
    }

    async createHabit(userId: string, habitName: string, reminderTime?: string, isPublic?: boolean): Promise<Habit> {
        if (!habitName || habitName.trim() === '') {
            throw new AppError('Habit name cannot be empty', 400);
        }

        const habitId = uuidv4();
        const createdAt = new Date().toISOString();

        const newHabit: Habit = { // Explicitly type the newHabit object
            habitId,
            habitName,
            reminderTime: reminderTime || null, // Allow null if not provided
            isPublic: isPublic ?? false, // Default to false if not provided
            createdAt,
            userId // Store userId explicitly for ease of reference, though it's part of PK
        };

        await this.habitRepository.createHabit(userId, newHabit);

        return newHabit; // Return the created habit object
    }

    async listHabits(userId: string): Promise<Habit[]> { // Explicitly type the return
        if (!userId) {
            throw new AppError('User ID is required to list habits', 400);
        }

        const habits = await this.habitRepository.listHabitsByUserId(userId);
        return habits;
    }
}