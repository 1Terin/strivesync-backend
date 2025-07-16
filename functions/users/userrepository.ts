// functions/users/userRepository.ts
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "common/clients";
import { UserProfile } from "api-types/users";

const TABLE_NAME = process.env.USERS_TABLE_NAME;

export const getUserProfileById = async (userId: string): Promise<UserProfile | undefined> => {
    if (!TABLE_NAME) {
        throw new Error("USERS_TABLE_NAME is not set.");
    }
    const params = {
        TableName: TABLE_NAME,
        Key: {
            PK: `USER#${userId}`, // Use the new PK format
            SK: 'PROFILE',        // Use the new SK format
        },
    };
    const { Item } = await ddbDocClient.send(new GetCommand(params));
    return Item as UserProfile | undefined;
};