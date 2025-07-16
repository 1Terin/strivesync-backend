// functions/users/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserProfile } from './userservice';
import { AppError } from 'common/errors';
import { formatJSONResponse } from 'common/api-gateway';

// Assuming common/api-gateway.ts has a helper like this:
// export const formatJSONResponse = (response: Record<string, any> | string, statusCode: number = 200) => {
//   return {
//     statusCode,
//     body: typeof response === 'string' ? response : JSON.stringify(response),
//     headers: {
//       'Content-Type': 'application/json',
//       'Access-Control-Allow-Origin': '*', // Adjust for your frontend domain in production
//       'Access-Control-Allow-Credentials': true,
//     },
//   };
// };


export const getUserProfileHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // The Cognito Authorizer places the authenticated user's ID (sub) in event.requestContext.authorizer.claims.sub
        const userId = event.requestContext.authorizer?.claims?.sub;

        if (!userId) {
            console.error('Unauthorized: User ID not found in authorizer claims.');
            return formatJSONResponse({ message: 'Unauthorized: User ID not provided.' }, 401);
        }

        const userProfile = await getUserProfile(userId);
        return formatJSONResponse(userProfile, 200);

    } catch (error: any) {
        if (error instanceof AppError) {
            console.error(`AppError: ${error.message} (Status: ${error.statusCode})`);
            return formatJSONResponse({ message: error.message }, error.statusCode);
        }
        console.error('Error fetching user profile:', error);
        return formatJSONResponse({ message: 'Internal Server Error' }, 500);
    }
};