// common/utils/index.ts

export const parseBody = <T>(body: string | null): T => {
  if (!body) {
    throw new Error("Request body is empty.");
  }
  try {
    return JSON.parse(body) as T;
  } catch (error) {
    throw new Error("Invalid JSON in request body.");
  }
};

export const createApiResponse = <T>(statusCode: number, body: T) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    },
    body: JSON.stringify(body),
  };
};