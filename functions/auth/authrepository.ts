// functions/auth/authRepository.ts (UPDATE THIS FILE)
import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "common/clients";
import { UserProfile } from "api-types/users"; // Ensure this import is correct

const TABLE_NAME = process.env.USERS_TABLE_NAME;

// Updated to use PK/SK for the DynamoDB item
export const createUserProfile = async (userProfileData: Omit<UserProfile, 'PK' | 'SK' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> => {
    if (!TABLE_NAME) {
        throw new Error("USERS_TABLE_NAME is not set.");
    }

    const now = new Date().toISOString();
    const newUserProfile: UserProfile = {
        PK: `USER#${userProfileData.userId}`, // NEW: PK format
        SK: 'PROFILE', // NEW: SK format
        ...userProfileData,
        createdAt: now,
        updatedAt: now,
    };

    const params = {
        TableName: TABLE_NAME,
        Item: newUserProfile,
    };
    await ddbDocClient.send(new PutCommand(params));
    return newUserProfile;
};

// Updated to use PK/SK for retrieving by ID
// IMPORTANT: We will move this function to functions/users/userRepository.ts later.
// For now, we update it here so LoginFunction can work with the new schema.
export const getUserProfileById = async (userId: string): Promise<UserProfile | undefined> => {
    if (!TABLE_NAME) {
        throw new Error("USERS_TABLE_NAME is not set.");
    }
    const params = {
        TableName: TABLE_NAME,
        Key: {
            PK: `USER#${userId}`, // NEW: PK format
            SK: 'PROFILE',        // NEW: SK format
        },
    };
    const { Item } = await ddbDocClient.send(new GetCommand(params));
    return Item as UserProfile | undefined;
};

// This function remains compatible as it uses the GSI, not the main table's PK/SK
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

    const { Items } = await ddbDocClient.send(new QueryCommand(params));
    return Items && Items.length > 0 ? Items[0] as UserProfile : undefined;
};