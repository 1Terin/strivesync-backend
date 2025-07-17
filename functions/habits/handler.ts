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

export const createHabitHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const userId = getUserIdFromEvent(event);
        if (!userId) {
            throw new AppError('Unauthorized: User ID not found.', 401);
        }

        if (!event.body) {
            throw new AppError('Request body is missing', 400);
        }

        const { habitName, reminderTime, isPublic }: CreateHabitRequest = JSON.parse(event.body);

        const newHabit = await habitService.createHabit(userId, habitName, reminderTime, isPublic);

        return formatJSONResponse({ message: 'Habit created successfully', habit: newHabit } as CreateHabitResponse, 201);
    } catch (error) {
        return handleErrorResponse(error);
    }
};

export const listHabitsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const userId = getUserIdFromEvent(event);
        if (!userId) {
            throw new AppError('Unauthorized: User ID not found.', 401);
        }

        const habits = await habitService.listHabits(userId);

        return formatJSONResponse({ habits } as ListHabitsResponse, 200);
    } catch (error) {
        return handleErrorResponse(error);
    }
};

export const listPublicHabitsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const habits = await habitService.listPublicHabits();

        return formatJSONResponse({ habits } as ListHabitsResponse, 200);
    } catch (error) {
        return handleErrorResponse(error);
    }
};

// NEW HANDLER: Update Habit
export const updateHabitHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const userId = getUserIdFromEvent(event);
        if (!userId) {
            throw new AppError('Unauthorized: User ID not found.', 401);
        }

        const habitId = event.pathParameters?.habitId;
        if (!habitId) {
            throw new AppError('Habit ID is required in the path parameters.', 400);
        }

        if (!event.body) {
            throw new AppError('Request body is missing.', 400);
        }

        const updates: UpdateHabitRequest = JSON.parse(event.body);

        const updatedHabit = await habitService.updateHabit(userId, habitId, updates);

        return formatJSONResponse({ message: 'Habit updated successfully', updatedHabit } as UpdateHabitResponse, 200);
    } catch (error) {
        return handleErrorResponse(error);
    }
};

// NEW HANDLER: Delete Habit
export const deleteHabitHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const userId = getUserIdFromEvent(event);
        if (!userId) {
            throw new AppError('Unauthorized: User ID not found.', 401);
        }

        const habitId = event.pathParameters?.habitId;
        if (!habitId) {
            throw new AppError('Habit ID is required in the path parameters.', 400);
        }

        await habitService.deleteHabit(userId, habitId);

        return formatJSONResponse({ message: 'Habit deleted successfully.' } as DeleteHabitResponse, 204);
    } catch (error) {
        return handleErrorResponse(error);
    }
};