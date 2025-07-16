// common/middleware-validator.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError, handleErrorResponse } from 'common/errors';
import { parseBody } from 'common/utils';

type Handler<TEvent, TResult> = (event: TEvent) => Promise<TResult>;

export const validateBody = (schema: ZodSchema) => {
  return (handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult>) => {
    return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      try {
        const body = parseBody(event.body);
        schema.parse(body);
        return await handler(event);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationErrors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }));
          return handleErrorResponse(new ValidationError("Validation failed", validationErrors));
        }
        return handleErrorResponse(error);
      }
    };
  };
};