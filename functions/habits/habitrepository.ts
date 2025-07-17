// functions/habits/habitRepository.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AppError } from '../../common/errors';
import { Habit } from '../../api-types/habits';

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME!;
// It's generally better to import ddbDocClient from common/clients if you have it
// const client = new DynamoDBClient({});
// const docClient = DynamoDBDocumentClient.from(client);
import { ddbDocClient } from '../../common/clients'; // Assuming this provides the doc client

export class HabitRepository {
    async createHabit(userId: string, habit: Omit<Habit, 'PK' | 'SK' | 'updatedAt' | 'gsi1pk' | 'gsi1sk'>): Promise<Habit> {
        const now = new Date().toISOString();
        const habitId = habit.habitId; // Assuming habitId is passed in the partial Habit object

        const item: Habit = {
            PK: `USER#${userId}`,
            SK: `HABIT#${habitId}`,
            userId: userId, // Ensure userId is explicitly set
            habitId: habitId, // Ensure habitId is explicitly set
            habitName: habit.habitName,
            reminderTime: habit.reminderTime || null,
            isPublic: habit.isPublic ?? false,
            createdAt: habit.createdAt || now, // Use provided or generate
            updatedAt: now,
        };

        // Conditionally add GSI1 attributes for public habits
        if (item.isPublic) {
            item.gsi1pk = 'PUBLIC_HABIT';
            item.gsi1sk = `CREATED_AT#${item.createdAt}#HABIT#${item.habitId}`;
        }

        const command = new PutCommand({
            TableName: USERS_TABLE_NAME,
            Item: item,
        });

        try {
            await ddbDocClient.send(command);
            return item;
        } catch (error) {
            console.error('Error creating habit in DynamoDB:', error);
            throw new AppError('Failed to create habit', 500);
        }
    }

    async listHabitsByUserId(userId: string): Promise<Habit[]> {
        const command = new QueryCommand({
            TableName: USERS_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'HABIT#',
            },
        });

        try {
            const { Items } = await ddbDocClient.send(command);
            // Items are already of type Habit because the PutCommand stores full Habit objects
            return (Items as Habit[]) || [];
        } catch (error) {
            console.error('Error listing habits from DynamoDB:', error);
            throw new AppError('Failed to retrieve habits', 500);
        }
    }

    // NEW FUNCTION: List all public habits using GSI1
    async listPublicHabits(): Promise<Habit[]> {
        const command = new QueryCommand({
            TableName: USERS_TABLE_NAME,
            IndexName: 'GSI1', // Use the GSI1 index
            KeyConditionExpression: 'gsi1pk = :gsi1pk',
            ExpressionAttributeValues: {
                ':gsi1pk': 'PUBLIC_HABIT',
            },
            ScanIndexForward: false, // Optional: list most recent public habits first
        });

        try {
            const { Items } = await ddbDocClient.send(command);
            // Items are already of type Habit because the PutCommand stores full Habit objects
            return (Items as Habit[]) || [];
        } catch (error) {
            console.error('Error listing public habits from DynamoDB (GSI1):', error);
            throw new AppError('Failed to retrieve public habits', 500);
        }
    }
}