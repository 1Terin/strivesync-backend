// common/errors/index.ts

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation Error", details?: any) {
    super(message, 400);
    this.name = 'ValidationError';
    if (details) {
      console.log("Validation Details:", details);
    }
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource Not Found") {
    super(message, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export const handleErrorResponse = (error: unknown) => {
  if (error instanceof AppError) {
    console.error(`AppError [${error.name}]: ${error.message} (Status: ${error.statusCode})`);
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({ message: error.message }),
    };
  } else if (error instanceof Error) {
    console.error(`Unexpected Error: ${error.message}`, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "An unexpected error occurred." }),
    };
  } else {
    console.error("Unknown error type:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "An unknown error occurred." }),
    };
  }
};