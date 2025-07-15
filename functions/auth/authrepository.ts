// functions/auth/authRepository.ts
import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"; // Added QueryCommand
import { ddbDocClient } from "common/clients";
import { UserProfile } from "api-types/users";

const TABLE_NAME = process.env.USERS_TABLE_NAME;

export const createUserProfile = async (userProfile: UserProfile): Promise<UserProfile> => {
  if (!TABLE_NAME) {
    throw new Error("USERS_TABLE_NAME is not set.");
  }
  const params = {
    TableName: TABLE_NAME,
    Item: userProfile,
  };
  await ddbDocClient.send(new PutCommand(params));
  return userProfile;
};

export const getUserProfileById = async (userId: string): Promise<UserProfile | undefined> => {
  if (!TABLE_NAME) {
    throw new Error("USERS_TABLE_NAME is not set.");
  }
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
    },
  };
  const { Item } = await ddbDocClient.send(new GetCommand(params));
  return Item as UserProfile | undefined;
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | undefined> => {
  if (!TABLE_NAME) {
    throw new Error("USERS_TABLE_NAME is not set.");
  }
  const params = {
    TableName: TABLE_NAME,
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email,
    },
    Limit: 1
  };

  // FIX: Use QueryCommand and ddbDocClient.send()
  const { Items } = await ddbDocClient.send(new QueryCommand(params));
  return Items && Items.length > 0 ? Items[0] as UserProfile : undefined;
};