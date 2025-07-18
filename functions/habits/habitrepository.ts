// functions/habits/habitRepository.ts
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { AppError } from '../../common/errors';
import { Habit } from '../../api-types/habits';
import { ddbDocClient } from '../../common/clients'; // Assuming this provides the doc client

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME!;

export class HabitRepository {

    constructor() {
        if (!USERS_TABLE_NAME) {
            console.error("USERS_TABLE_NAME environment variable is not set.");
            throw new Error('USERS_TABLE_NAME environment variable is not set.');
        }
    }

    async createHabit(habit: Habit): Promise<Habit> {
        const command = new PutCommand({
            TableName: USERS_TABLE_NAME,
            Item: habit,
            ConditionExpression: 'attribute_not_exists(PK)',
        });

        try {
            await ddbDocClient.send(command);
            return habit;
        } catch (error) {
            console.error('Error creating habit in DynamoDB:', error);
            throw new AppError('Failed to create habit in database', 500);
        }
    }

    async getHabitById(userId: string, habitId: string): Promise<Habit | undefined> {
        const command = new GetCommand({
            TableName: USERS_TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: `HABIT#${habitId}`,
            },
        });

        try {
            const { Item } = await ddbDocClient.send(command);
            return Item as Habit | undefined;
        } catch (error) {
            console.error('Error getting habit from DynamoDB:', error);
            throw new AppError('Failed to retrieve habit from database', 500);
        }
    }

    async listHabitsByUserId(userId: string): Promise<Habit[]> {
        const command = new QueryCommand({
            TableName: USERS_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':skPrefix': 'HABIT#',
            },
        });

        try {
            const { Items } = await ddbDocClient.send(command);
            return (Items as Habit[]) || [];
        } catch (error) {
            console.error('Error listing habits from DynamoDB:', error);
            throw new AppError('Failed to retrieve habits from database', 500);
        }
    }

    async listPublicHabits(): Promise<Habit[]> {
        const command = new QueryCommand({
            TableName: USERS_TABLE_NAME,
            IndexName: 'GSI1', // Use the GSI1 index for public habits
            KeyConditionExpression: 'gsi1pk = :gsi1pk',
            ExpressionAttributeValues: {
                ':gsi1pk': 'PUBLIC_HABIT',
            },
            ScanIndexForward: false, // Optional: list most recent public habits first
        });

        try {
            const { Items } = await ddbDocClient.send(command);
            return (Items as Habit[]) || [];
        } catch (error) {
            console.error('Error listing public habits from DynamoDB (GSI1):', error);
            throw new AppError('Failed to retrieve public habits from database', 500);
        }
    }

    async updateHabit(userId: string, habitId: string, updates: Partial<Habit>, currentHabit: Habit): Promise<Habit> {
        const now = new Date().toISOString();
        let UpdateExpression = 'SET #updatedAt = :updatedAt';
        const ExpressionAttributeValues: Record<string, any> = {
            ':updatedAt': now,
        };
        const ExpressionAttributeNames: Record<string, string> = {
            '#updatedAt': 'updatedAt',
        };

        // Track if isPublic is changing to manage GSI1 attributes
        const newIsPublic = updates.isPublic !== undefined ? updates.isPublic : currentHabit.isPublic;
        const isPublicChanged = updates.isPublic !== undefined && updates.isPublic !== currentHabit.isPublic;

        if (updates.habitName !== undefined) {
            UpdateExpression += ', #habitName = :habitName';
            ExpressionAttributeNames['#habitName'] = 'habitName';
            ExpressionAttributeValues[':habitName'] = updates.habitName;
        }
        if (updates.reminderTime !== undefined) {
            UpdateExpression += ', #reminderTime = :reminderTime';
            ExpressionAttributeNames['#reminderTime'] = 'reminderTime';
            ExpressionAttributeValues[':reminderTime'] = updates.reminderTime;
        }
        // isPublic is handled separately for GSI attributes, but also needs to be set on the item itself
        if (updates.isPublic !== undefined) {
            UpdateExpression += ', #isPublic = :isPublic';
            ExpressionAttributeNames['#isPublic'] = 'isPublic';
            ExpressionAttributeValues[':isPublic'] = updates.isPublic;
        }

        // Handle GSI1 attribute addition/removal based on the new 'isPublic' status
        if (isPublicChanged) {
            if (newIsPublic === true) {
                // If becomes public, add GSI attributes
                UpdateExpression += ', #gsi1pk = :gsi1pk, #gsi1sk = :gsi1sk';
                ExpressionAttributeNames['#gsi1pk'] = 'gsi1pk';
                ExpressionAttributeValues[':gsi1pk'] = 'PUBLIC_HABIT';
                ExpressionAttributeNames['#gsi1sk'] = `gsi1sk`; // Should be 'gsi1sk'
                ExpressionAttributeValues[':gsi1sk'] = `CREATED_AT#${currentHabit.createdAt}#HABIT#${currentHabit.habitId}`;
            } else {
                // If becomes private, remove GSI attributes
                UpdateExpression += ' REMOVE #gsi1pk, #gsi1sk';
                ExpressionAttributeNames['#gsi1pk'] = 'gsi1pk';
                ExpressionAttributeNames['#gsi1sk'] = 'gsi1sk';
            }
        } else if (newIsPublic === true && !currentHabit.gsi1pk) {
             // Edge case: it's public but gsi1pk was somehow missing (e.g. old data, or initial creation logic bug)
             // Ensure GSI attributes are present if habit is public.
             UpdateExpression += ', #gsi1pk = :gsi1pk, #gsi1sk = :gsi1sk';
             ExpressionAttributeNames['#gsi1pk'] = 'gsi1pk';
             ExpressionAttributeValues[':gsi1pk'] = 'PUBLIC_HABIT';
             ExpressionAttributeNames['#gsi1sk'] = 'gsi1sk';
             ExpressionAttributeValues[':gsi1sk'] = `CREATED_AT#${currentHabit.createdAt}#HABIT#${currentHabit.habitId}`;
        }


        const command = new UpdateCommand({
            TableName: USERS_TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: `HABIT#${habitId}`,
            },
            UpdateExpression: UpdateExpression,
            ExpressionAttributeValues: ExpressionAttributeValues,
            ExpressionAttributeNames: ExpressionAttributeNames,
            ReturnValues: 'ALL_NEW',
            ConditionExpression: 'attribute_exists(SK)', // Ensure the item exists
        });

        try {
            const { Attributes } = await ddbDocClient.send(command);
            return Attributes as Habit;
        } catch (error: any) {
            if (error.name === 'ConditionalCheckFailedException') {
                throw new AppError('Habit not found or does not belong to user.', 404);
            }
            console.error('Error updating habit in DynamoDB:', error);
            throw new AppError('Failed to update habit in database', 500);
        }
    }

    async deleteHabit(userId: string, habitId: string): Promise<void> {
        const command = new DeleteCommand({
            TableName: USERS_TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: `HABIT#${habitId}`,
            },
            ConditionExpression: 'attribute_exists(SK)', // Ensure the item exists
        });

        try {
            await ddbDocClient.send(command);
        } catch (error: any) {
            if (error.name === 'ConditionalCheckFailedException') {
                throw new AppError('Habit not found or does not belong to user.', 404);
            }
            console.error('Error deleting habit from DynamoDB:', error);
            throw new AppError('Failed to delete habit from database', 500);
        }
    }
}