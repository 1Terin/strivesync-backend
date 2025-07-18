// functions/habits/handler.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HabitService } from './habitservice';
import { getUserIdFromEvent } from '../../common/auth';
import { formatJSONResponse } from '../../common/api-gateway';
import { AppError, handleErrorResponse } from '../../common/errors';

import {
    CreateHabitRequest,
    CreateHabitResponse,
    ListHabitsResponse,
    UpdateHabitRequest,
    UpdateHabitResponse,
    DeleteHabitResponse,
} from '../../api-types/habits';

const habitService = new HabitService();

// This is the single entry point for all habit-related API requests
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const httpMethod = event.httpMethod;
    const path = event.path;

    try {
        let userId: string | undefined; // Initialize userId as undefined

        const requiresAuth = !((httpMethod === 'GET' || httpMethod === 'OPTIONS') && path === '/habits/public');

        if (requiresAuth) {
            userId = getUserIdFromEvent(event);
            if (!userId) {
                throw new AppError('Unauthorized: User ID not found.', 401);
            }
        }

        let result;
        let responseStatusCode: number;

        // --- ROUTING LOGIC based on HTTP Method and Path ---
        if (httpMethod === 'POST' && path === '/habits') {
            // Create Habit (requires auth, userId must be present)
            if (!event.body) {
                throw new AppError('Request body is missing', 400);
            }
            const { habitName, reminderTime, isPublic }: CreateHabitRequest = JSON.parse(event.body);
            // We can safely use userId! here because the `requiresAuth` check ensures it's set for this path.
            const newHabit = await habitService.createHabit(userId!, habitName, reminderTime, isPublic);
            result = { message: 'Habit created successfully', habit: newHabit } as CreateHabitResponse;
            responseStatusCode = 201;

        } else if (httpMethod === 'GET' && path === '/habits') {
            // List User's Habits (requires auth, userId must be present)
            // We can safely use userId! here.
            const habits = await habitService.listHabits(userId!);
            result = { habits } as ListHabitsResponse;
            responseStatusCode = 200;

        } else if (httpMethod === 'GET' && path === '/habits/public') {
            // List Public Habits (DOES NOT require auth, userId is NOT used here)
            const habits = await habitService.listPublicHabits();
            result = { habits } as ListHabitsResponse;
            responseStatusCode = 200;

        } else if (httpMethod === 'PUT' && path.startsWith('/habits/') && event.pathParameters?.habitId) {
            // Update Habit (requires auth, userId must be present)
            const habitId = event.pathParameters.habitId;
            if (!habitId) {
                throw new AppError('Habit ID is required in the path parameters.', 400);
            }
            if (!event.body) {
                throw new AppError('Request body is missing.', 400);
            }
            const updates: UpdateHabitRequest = JSON.parse(event.body);
            // We can safely use userId! here.
            const updatedHabit = await habitService.updateHabit(userId!, habitId, updates);
            result = { message: 'Habit updated successfully', updatedHabit } as UpdateHabitResponse;
            responseStatusCode = 200;

        } else if (httpMethod === 'DELETE' && path.startsWith('/habits/') && event.pathParameters?.habitId) {
            // Delete Habit (requires auth, userId must be present)
            const habitId = event.pathParameters.habitId;
            if (!habitId) {
                throw new AppError('Habit ID is required in the path parameters.', 400);
            }
            // We can safely use userId! here.
            await habitService.deleteHabit(userId!, habitId);
            result = { message: 'Habit deleted successfully.' } as DeleteHabitResponse;
            responseStatusCode = 204; // No content for successful deletion

        } else {
            // Catch-all for unsupported methods or paths
            throw new AppError('Not Found: The requested resource or method is not supported.', 404);
        }

        return formatJSONResponse(result, responseStatusCode);

    } catch (error) {
        // Centralized error handling for all operations
        return handleErrorResponse(error);
    }
};