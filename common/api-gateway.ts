// common/api-gateway.ts
import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Helper function to format API Gateway Lambda proxy responses.
 * @param response The data to be returned in the response body.
 * @param statusCode The HTTP status code for the response.
 * @returns An APIGatewayProxyResult object.
 */
export const formatJSONResponse = (
    response: Record<string, any> | string,
    statusCode: number = 200
): APIGatewayProxyResult => {
    return {
        statusCode,
        body: typeof response === 'string' ? response : JSON.stringify(response),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // IMPORTANT: Adjust this for your frontend's domain in production
            'Access-Control-Allow-Credentials': true,
        },
    };
};

/**
 * Helper for returning 400 Bad Request responses.
 * @param message The error message.
 * @returns APIGatewayProxyResult
 */
export const formatBadRequestResponse = (message: string): APIGatewayProxyResult => {
    return formatJSONResponse({ message }, 400);
};

/**
 * Helper for returning 401 Unauthorized responses.
 * @param message The error message.
 * @returns APIGatewayProxyResult
 */
export const formatUnauthorizedResponse = (message: string): APIGatewayProxyResult => {
    return formatJSONResponse({ message }, 401);
};

/**
 * Helper for returning 404 Not Found responses.
 * @param message The error message.
 * @returns APIGatewayProxyResult
 */
export const formatNotFoundResponse = (message: string): APIGatewayProxyResult => {
    return formatJSONResponse({ message }, 404);
};

/**
 * Helper for returning 500 Internal Server Error responses.
 * @param message The error message.
 * @returns APIGatewayProxyResult
 */
export const formatInternalErrorResponse = (message: string): APIGatewayProxyResult => {
    return formatJSONResponse({ message }, 500);
};