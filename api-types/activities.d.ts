// api-types/activities.d.ts

import { Activity } from './common'; // Assuming you'll have a common Activity type

export interface CreateActivityRequest {
    activityName: string;
    description?: string;
    location: { address: string; lat: number; lon: number };
    dateTime: string; // ISO 8601 string, e.g., "2025-07-20T10:00:00Z"
    endTime?: string; // ISO 8601 string
    frequency: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY'; // Simplified for MVP
    isPublic: boolean;
    maxParticipants?: number;
    category: string; // e.g., "Walk", "Football", "Yoga"
    photoUrl?: string; // S3 URL for a banner/cover image
}

export interface CreateActivityResponse {
    message: string;
    activity: Activity;
}

export interface ListActivitiesResponse {
    activities: Activity[];
}

export interface Activity {
    activityId: string;
    createdBy: string; // userId of the creator
    activityName: string;
    description?: string;
    location: { address: string; lat: number; lon: number };
    dateTime: string;
    endTime?: string;
    frequency: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    isPublic: boolean;
    maxParticipants?: number;
    currentParticipantsCount: number; // Will be 0 initially
    photoUrl?: string;
    category: string;
    createdAt: string; // ISO 8601 string
    // GSI attributes if included in the response
    gsi1pk?: string;
    gsi1sk?: string;
}

// For RSVP/Participation
export interface RSVPRequest {
    status: 'going' | 'declined'; // For MVP, we'll focus on 'going'
}

export interface RSVPResponse {
    message: string;
    rsvpStatus: 'going' | 'declined';
}