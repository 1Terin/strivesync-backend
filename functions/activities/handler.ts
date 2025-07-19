// functions/activities/handler.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ActivityService } from './activityservice';
import { getUserIdFromEvent } from '../../common/auth'; // Utility to get user ID from event
import { formatJSONResponse } from '../../common/api-gateway'; // Utility for consistent responses
import { AppError, handleErrorResponse } from '../../common/errors'; // Error handling utilities

import {
    CreateActivityRequest,
    CreateActivityResponse,
    ListActivitiesResponse,
    RSVPRequest,
    RSVPResponse,
} from '../../api-types/activities'; // All relevant types for activities

const activityService = new ActivityService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Received activity event:', JSON.stringify(event, null, 2));

    const httpMethod = event.httpMethod;
    const path = event.path;
    const pathParameters = event.pathParameters;

    try {
        let userId: string | undefined;

        // Determine if the current operation requires authentication
        // Public list of activities does NOT require auth. All other activity operations do.
        const requiresAuth = !(httpMethod === 'GET' && path === '/activities/public');

        if (requiresAuth) {
            userId = getUserIdFromEvent(event);
            if (!userId) {
                throw new AppError('Unauthorized: User ID not found.', 401);
            }
        }

        let result;
        let responseStatusCode: number;

        // --- ROUTING LOGIC ---

        // 1. Create Activity (POST /activities) - Requires Auth
        if (httpMethod === 'POST' && path === '/activities') {
            if (!event.body) {
                throw new AppError('Request body is missing for activity creation.', 400);
            }
            const requestBody: CreateActivityRequest = JSON.parse(event.body);
            // userId is guaranteed to be present here by the `requiresAuth` block above
            const newActivity = await activityService.createActivity(userId!, requestBody);
            result = { message: 'Activity created successfully.', activity: newActivity } as CreateActivityResponse;
            responseStatusCode = 201;

        }
        // 2. List Public Activities (GET /activities/public) - No Auth Required
        else if (httpMethod === 'GET' && path === '/activities/public') {
            const activities = await activityService.listPublicActivities();
            result = { activities } as ListActivitiesResponse;
            responseStatusCode = 200;

        }
        // 3. RSVP/Join Activity (POST /activities/{activityId}/rsvp) - Requires Auth
        else if (httpMethod === 'POST' && path.startsWith('/activities/') && path.endsWith('/rsvp') && pathParameters?.activityId) {
            const activityId = pathParameters.activityId;
            if (!event.body) {
                throw new AppError('Request body is missing for RSVP.', 400);
            }
            const { status }: RSVPRequest = JSON.parse(event.body);
            if (!['going', 'declined'].includes(status)) {
                throw new AppError('Invalid RSVP status. Must be "going" or "declined".', 400);
            }
            // userId is guaranteed to be present here
            await activityService.rsvpForActivity(userId!, activityId, status);
            result = { message: `Successfully set RSVP status to '${status}'.`, rsvpStatus: status } as RSVPResponse;
            responseStatusCode = 200;
        }
        // TODO: Add other activity routes like GET /activities/{activityId} (Get single activity details)
        // TODO: Add PUT /activities/{activityId} (Update activity)
        // TODO: Add DELETE /activities/{activityId} (Delete activity)
        // TODO: Add GET /activities (List user's joined activities)

        else {
            throw new AppError('Not Found: The requested resource or method is not supported for activities.', 404);
        }

        return formatJSONResponse(result, responseStatusCode);

    } catch (error) {
        return handleErrorResponse(error);
    }
};