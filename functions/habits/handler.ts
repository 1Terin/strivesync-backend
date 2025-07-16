// functions/habits/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HabitService } from './habitservice';
import { getUserIdFromEvent } from '../../common/auth';
// Import your existing helper functions from common/api-gateway and common/errors
import { formatJSONResponse } from '../../common/api-gateway';
import { AppError, UnauthorizedError, handleErrorResponse } from '../../common/errors'; // Import AppError and handleErrorResponse

// Import the new types for habits
import { CreateHabitRequest, CreateHabitResponse, ListHabitsResponse } from '../../api-types/habits';

const habitService = new HabitService();

export const createHabitHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const userId = getUserIdFromEvent(event); // This function throws AppError (Unauthorized) if userId is missing
        
        if (!event.body) {
            throw new AppError('Request body is missing', 400); // Use AppError for specific business logic errors
        }

        // Use the CreateHabitRequest type for parsing
        const { habitName, reminderTime, isPublic }: CreateHabitRequest = JSON.parse(event.body);

        const newHabit = await habitService.createHabit(userId, habitName, reminderTime, isPublic);

        // Use formatJSONResponse for success
        return formatJSONResponse({ message: 'Habit created successfully', habit: newHabit } as CreateHabitResponse, 201);
    } catch (error) {
        // Use your existing handleErrorResponse to process any errors
        return handleErrorResponse(error);
    }
};

export const listHabitsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const userId = getUserIdFromEvent(event); // This function throws AppError (Unauthorized) if userId is missing

        const habits = await habitService.listHabits(userId);

        // Use formatJSONResponse for success
        return formatJSONResponse({ habits } as ListHabitsResponse, 200);
    } catch (error) {
        // Use your existing handleErrorResponse to process any errors
        return handleErrorResponse(error);
    }
};