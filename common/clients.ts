// common/clients.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

const dbClient = new DynamoDBClient({});
export const ddbDocClient = DynamoDBDocumentClient.from(dbClient);

export const cognitoClient = new CognitoIdentityProviderClient({});