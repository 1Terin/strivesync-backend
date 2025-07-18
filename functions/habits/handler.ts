// functions/habits/handler.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HabitService } from './habitservice';
// IMPORTANT: Ensure getUserIdFromEvent in common/auth.ts
// is designed to return null/undefined if no Authorization header is found,
// rather than throwing an error directly. If it *does* throw,
// the conditional call below (inside `if (requiresAuth)`) will catch it,
// but returning null/undefined is generally cleaner for such a utility.
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

        // Determine if the current API Gateway path/method combination requires authentication.
        // It requires authentication UNLESS it's a GET or OPTIONS request to '/habits/public'.
        const requiresAuth = !((httpMethod === 'GET' || httpMethod === 'OPTIONS') && path === '/habits/public');

        if (requiresAuth) {
            // Only attempt to get userId if authentication is required for this route.
            // If getUserIdFromEvent itself throws on a missing token (instead of returning null/undefined),
            // this `try` block will correctly catch it and pass it to `handleErrorResponse`.
            userId = getUserIdFromEvent(event);
            if (!userId) {
                // This check catches cases where getUserIdFromEvent returns null/undefined
                // when a token was expected (e.g., malformed token, or no token on an authenticated route).
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