// functions/users/userService.ts
import { GetUserProfileResponse, UserProfile } from "api-types/users";
import * as userRepository from "./userrepository";
import { AppError } from "common/errors";

export const getUserProfile = async (userId: string): Promise<GetUserProfileResponse> => {
    const userProfile = await userRepository.getUserProfileById(userId);

    if (!userProfile) {
        throw new AppError("User profile not found.", 404);
    }

    // Omit PK and SK before sending to the client
    const { PK, SK, ...profileForClient } = userProfile;
    return profileForClient;
};