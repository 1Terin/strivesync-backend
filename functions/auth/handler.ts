// functions/auth/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { parseBody, createApiResponse } from 'common/utils';
import { handleErrorResponse } from 'common/errors';
import { validateBody } from 'common/middleware/validator';
import { LoginRequestSchema, SignupRequestSchema, ConfirmSignupRequestSchema } from 'functions/auth/authschema';
import { loginUser, signupUser, confirmUser } from 'functions/auth/authservice';
import { LoginRequest, SignupRequest, ConfirmSignupRequest } from 'api-types/auth';

export const signupHandler = validateBody(SignupRequestSchema)(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const body = parseBody<SignupRequest>(event.body);
      const result = await signupUser(body);
      return createApiResponse(201, result);
    } catch (error) {
      return handleErrorResponse(error);
    }
  }
);

export const loginHandler = validateBody(LoginRequestSchema)(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // --- START DEBUG LOGS: Add these lines ---
      console.log('Login Handler: Raw event body received:', event.body);
      let body: LoginRequest;
      try {
        body = parseBody<LoginRequest>(event.body);
        console.log('Login Handler: Parsed body from parseBody utility:', body);
      } catch (parseError) {
        console.error('Login Handler: ERROR during body parsing:', parseError);
        // Re-throw to ensure it's caught by your existing error handling
        throw parseError;
      }
      // --- END DEBUG LOGS ---

      const result = await loginUser(body);
      return createApiResponse(200, result);
    } catch (error) {
      return handleErrorResponse(error);
    }
  }
);

export const confirmSignupHandler = validateBody(ConfirmSignupRequestSchema)(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const body = parseBody<ConfirmSignupRequest>(event.body);
      const result = await confirmUser(body); // Call the new confirmUser service function
      return createApiResponse(200, result);
    } catch (error) {
      return handleErrorResponse(error);
    }
  }
);