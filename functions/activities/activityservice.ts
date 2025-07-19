// functions/activities/activityService.ts

import { ActivityRepository } from './activityrepository';
import { CreateActivityRequest, Activity } from '../../api-types/activities';
import { AppError } from '../../common/errors';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

export class ActivityService {
    private readonly activityRepository: ActivityRepository;

    constructor() {
        this.activityRepository = new ActivityRepository();
    }

    async createActivity(
        userId: string,
        request: CreateActivityRequest
    ): Promise<Activity> {
        const activityId = uuidv4();
        const createdAt = new Date().toISOString();

        const newActivity: Activity = {
            activityId,
            createdBy: userId,
            activityName: request.activityName,
            description: request.description,
            location: request.location,
            dateTime: request.dateTime,
            endTime: request.endTime,
            frequency: request.frequency,
            isPublic: request.isPublic,
            maxParticipants: request.maxParticipants,
            currentParticipantsCount: 0, // Always start at 0
            category: request.category,
            photoUrl: request.photoUrl,
            createdAt,
        };

        // Save the activity to DynamoDB
        const createdActivity = await this.activityRepository.createActivity(newActivity);

        // If the creator is also a participant, add them to RSVP
        await this.activityRepository.rsvpForActivity(userId, activityId, 'going');
        await this.activityRepository.addParticipant(activityId); // Increment count on activity details

        return createdActivity;
    }

    async listPublicActivities(): Promise<Activity[]> {
        return this.activityRepository.listPublicActivities();
    }

    async rsvpForActivity(userId: string, activityId: string, status: 'going' | 'declined'): Promise<void> {
        const activity = await this.activityRepository.getActivityById(activityId);
        if (!activity) {
            throw new AppError('Activity not found.', 404);
        }

        if (status === 'going') {
            if (activity.maxParticipants && activity.currentParticipantsCount >= activity.maxParticipants) {
                throw new AppError('Activity is full.', 409); // Conflict
            }
            await this.activityRepository.addParticipant(activityId);
        }
        // TODO: Implement logic for 'declined' if it reduces participant count

        await this.activityRepository.rsvpForActivity(userId, activityId, status);
    }
}