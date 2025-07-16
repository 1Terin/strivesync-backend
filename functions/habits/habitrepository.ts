import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AppError } from '../../common/errors';
// Import the new Habit type
import { Habit } from '../../api-types/habits';

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME!;
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export class HabitRepository {
    async createHabit(userId: string, habit: Habit) { // Use the Habit type here
        const item = {
            PK: `USER#${userId}`,
            SK: `HABIT#${habit.habitId}`,
            ...habit // Spread other habit properties
        };

        const command = new PutCommand({
            TableName: USERS_TABLE_NAME,
            Item: item,
        });

        try {
            await docClient.send(command);
            // It's good practice to return the item as it was stored
            return item;
        } catch (error) {
            console.error('Error creating habit in DynamoDB:', error);
            throw new AppError('Failed to create habit', 500);
        }
    }

    async listHabitsByUserId(userId: string): Promise<Habit[]> { // Use the Habit[] type here
        const command = new QueryCommand({
            TableName: USERS_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'HABIT#',
            },
        });

        try {
            const { Items } = await docClient.send(command);
            // Ensure proper typing and transformation from DynamoDB item to Habit interface
            return Items ? Items.map(item => {
                const { PK, SK, ...rest } = item;
                // Dynamically ensure the structure matches Habit interface, or cast
                return {
                    habitId: SK.split('#')[1],
                    userId: PK.split('#')[1], // Extract userId from PK
                    habitName: rest.habitName,
                    reminderTime: rest.reminderTime || null,
                    isPublic: rest.isPublic ?? false,
                    createdAt: rest.createdAt,
                } as Habit;
            }) : [];
        } catch (error) {
            console.error('Error listing habits from DynamoDB:', error);
            throw new AppError('Failed to retrieve habits', 500);
        }
    }
}