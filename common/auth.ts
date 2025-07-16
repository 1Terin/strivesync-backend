// common/auth.ts

import { APIGatewayProxyEvent } from 'aws-lambda';
import { AppError } from './errors'; // Assuming AppError is defined in common/errors

/**
 * Extracts the user ID (Cognito 'sub') from an authenticated API Gateway event.
 * Throws AppError if the user ID cannot be determined, indicating an unauthenticated request.
 * @param event The API Gateway proxy event.
 * @returns The user ID string.
 * @throws AppError if user ID is missing (e.g., event is not authenticated).
 */
export function getUserIdFromEvent(event: APIGatewayProxyEvent): string {
    // For Cognito User Pool Authorizer, the 'sub' (user ID) is typically in claims
    const userId = event.requestContext.authorizer?.claims?.sub;

    if (!userId) {
        // This scenario should ideally be caught by API Gateway's authorizer setup (401 Unauthorized)
        // However, as a safety net or for local testing without full auth setup, this provides a clear error.
        console.error('User ID not found in event context. Likely an unauthenticated request.');
        throw new AppError('Unauthorized: User ID not found.', 401);
    }
    return userId;
}

// You might also have other auth-related utilities here
// e.g., for validating custom claims, etc.