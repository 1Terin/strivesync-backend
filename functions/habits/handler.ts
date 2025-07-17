// functions/habits/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HabitService } from './habitservice';
import { getUserIdFromEvent } from '../../common/auth';
import { formatJSONResponse } from '../../common/api-gateway';
import { AppError, handleErrorResponse } from '../../common/errors';

import { CreateHabitRequest, CreateHabitResponse, ListHabitsResponse } from '../../api-types/habits';

const habitService = new HabitService();

export const createHabitHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const userId = getUserIdFromEvent(event);

        if (!event.body) {
            throw new AppError('Request body is missing', 400);
        }

        const { habitName, reminderTime, isPublic }: CreateHabitRequest = JSON.parse(event.body);

        // Pass all necessary fields to service for creating a complete habit item
        const newHabit = await habitService.createHabit(userId, habitName, reminderTime, isPublic);

        return formatJSONResponse({ message: 'Habit created successfully', habit: newHabit } as CreateHabitResponse, 201);
    } catch (error) {
        return handleErrorResponse(error);
    }
};

export const listHabitsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const userId = getUserIdFromEvent(event);

        const habits = await habitService.listHabits(userId);

        return formatJSONResponse({ habits } as ListHabitsResponse, 200);
    } catch (error) {
        return handleErrorResponse(error);
    }
};

// NEW HANDLER: List all public habits
export const listPublicHabitsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // No user ID needed as these are public habits
        const habits = await habitService.listPublicHabits();

        return formatJSONResponse({ habits } as ListHabitsResponse, 200);
    } catch (error) {
        return handleErrorResponse(error);
    }
};