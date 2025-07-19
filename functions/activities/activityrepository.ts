// functions/activities/activityRepository.ts

import { DynamoDBClient, ReturnValue } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { Activity } from '../../api-types/activities'; // Import the Activity interface
import { AppError } from '../../common/errors'; // Assuming AppError is defined here

export class ActivityRepository {
    private readonly docClient: DynamoDBDocumentClient;
    private readonly tableName: string;

    constructor() {
        const client = new DynamoDBClient({});
        this.docClient = DynamoDBDocumentClient.from(client);
        this.tableName = process.env.TABLE_NAME || 'strivesync-table'; // Make sure TABLE_NAME is set in your env
    }

    async createActivity(activity: Activity): Promise<Activity> {
        const params = {
            TableName: this.tableName,
            Item: {
                PK: `ACTIVITY#${activity.activityId}`,
                SK: 'DETAILS',
                ...activity,
                // Add GSI attributes if this is a public activity
                ...(activity.isPublic && {
                    gsi1pk: 'PUBLIC#ACTIVITY',
                    gsi1sk: `#${activity.location.address}#${activity.dateTime.split('T')[0]}`, // Example: #Chennai#2025-07-20
                }),
            },
        };

        try {
            await this.docClient.send(new PutCommand(params));
            return activity;
        } catch (error) {
            console.error('Error creating activity:', error);
            throw new AppError('Failed to create activity', 500);
        }
    }

    async getActivityById(activityId: string): Promise<Activity | undefined> {
        const params = {
            TableName: this.tableName,
            Key: {
                PK: `ACTIVITY#${activityId}`,
                SK: 'DETAILS',
            },
        };

        try {
            const { Item } = await this.docClient.send(new GetCommand(params));
            return Item as Activity | undefined;
        } catch (error) {
            console.error('Error getting activity by ID:', error);
            throw new AppError('Failed to retrieve activity', 500);
        }
    }

    async listPublicActivities(): Promise<Activity[]> {
        const params = {
            TableName: this.tableName,
            IndexName: 'GSI1', // This must match your GSI name in template.yaml
            KeyConditionExpression: 'gsi1pk = :pkValue',
            ExpressionAttributeValues: {
                ':pkValue': 'PUBLIC#ACTIVITY',
            },
            // Optional: Add FilterExpression for future filtering by date, location etc.
            // For MVP, we'll just list all public activities.
        };

        try {
            const { Items } = await this.docClient.send(new QueryCommand(params));
            return (Items || []) as Activity[];
        } catch (error) {
            console.error('Error listing public activities:', error);
            throw new AppError('Failed to list public activities', 500);
        }
    }

    async addParticipant(activityId: string): Promise<void> {
        const params: UpdateCommandInput = { // Explicitly type params as UpdateCommandInput
            TableName: this.tableName,
            Key: {
                PK: `ACTIVITY#${activityId}`,
                SK: 'DETAILS',
            },
            UpdateExpression: 'SET currentParticipantsCount = if_not_exists(currentParticipantsCount, :start) + :inc',
            ExpressionAttributeValues: {
                ':inc': 1,
                ':start': 0,
            },
            ReturnValues: 'UPDATED_NEW' as ReturnValue, // Cast to ReturnValue
        };

        try {
            await this.docClient.send(new UpdateCommand(params));
        } catch (error) {
            console.error('Error adding participant:', error);
            throw new AppError('Failed to update participant count for activity', 500);
        }
    }

    async rsvpForActivity(userId: string, activityId: string, status: 'going' | 'declined'): Promise<void> {
        const params = {
            TableName: this.tableName,
            Item: {
                PK: `USER#${userId}`,
                SK: `RSVP#${activityId}`,
                activityId: activityId,
                status: status,
                timestamp: new Date().toISOString(),
                // Add GSI for reverse lookup if needed later
                gsi1pk: `ACTIVITY#${activityId}`,
                gsi1sk: `PARTICIPANT#${userId}`,
            },
        };

        try {
            await this.docClient.send(new PutCommand(params));
        } catch (error) {
            console.error('Error saving RSVP for activity:', error);
            throw new AppError('Failed to RSVP for activity', 500);
        }
    }
}