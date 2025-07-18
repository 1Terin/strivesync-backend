// functions/auth/authService.ts
import {
    SignUpCommand,
    AdminInitiateAuthCommand,
    AuthFlowType,
    ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient } from "common/clients";
import {
    LoginRequest,
    LoginResponse,
    SignupRequest,
    SignupResponse,
    ConfirmSignupRequest,
} from "api-types/auth";
// Importing specific functions from authRepository for clarity
import { createUserProfile, getUserProfileById } from "./authrepository";
import { AppError, UnauthorizedError } from "common/errors";
import { UserProfile } from "api-types/users"; // Still need this for LoginResponse userProfile type

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const ADMIN_CLIENT_ID = process.env.COGNITO_ADMIN_CLIENT_ID;

// Initial environment variable checks (good to have for early errors)
if (!USER_POOL_ID || !CLIENT_ID || !ADMIN_CLIENT_ID) {
    console.error("Critical: One or more Cognito environment variables are not set.");
    // In a production app, you might want to throw an error here to prevent the Lambda from running
    // For local development, this console.error is often sufficient to debug.
}

export const signupUser = async (data: SignupRequest): Promise<SignupResponse> => {
    if (!CLIENT_ID) {
        console.error("Missing CLIENT_ID for signup");
        throw new AppError("Server configuration error: CLIENT_ID is required for signup.", 500);
    }

    try {
        const signUpCommand = new SignUpCommand({
            ClientId: CLIENT_ID,
            Username: data.email,
            Password: data.password,
            UserAttributes: [
                { Name: "email", Value: data.email },
                { Name: "preferred_username", Value: data.username },
            ],
        });

        const response = await cognitoClient.send(signUpCommand);

        if (response.UserSub) {
            const userProfileDataToCreate = {
                userId: response.UserSub,
                username: data.username,
                email: data.email,
            };
            await createUserProfile(userProfileDataToCreate);
            // --- END FIX ---

            return {
                message: response.UserConfirmed
                    ? "User signed up and confirmed successfully!"
                    : "User signed up. Please check your email for a verification code.",
                userId: response.UserSub,
            };
        } else {
            throw new AppError("Signup failed: No user ID returned from Cognito.", 500);
        }
    } catch (error: any) {
        if (error.name === "UsernameExistsException") {
            throw new AppError("A user with this email already exists.", 409);
        } else if (error.name === "InvalidPasswordException") {
            throw new AppError(`Password does not meet requirements: ${error.message}`, 400);
        } else if (error.name === "AppError") {
            throw error; // Re-throw custom AppErrors
        } else {
            console.error("Cognito Signup Error:", error);
            throw new AppError(`Signup failed: ${error.message || 'Unknown error'}`, 500);
        }
    }
};

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
    if (!USER_POOL_ID || !ADMIN_CLIENT_ID) {
        console.error("Missing USER_POOL_ID or ADMIN_CLIENT_ID for login");
        throw new AppError("Server configuration error: USER_POOL_ID and ADMIN_CLIENT_ID are required for login.", 500);
    }

    console.log('LOGIN DEBUG: Using ENV variables:', {
        COGNITO_USER_POOL_ID: USER_POOL_ID,
        COGNITO_ADMIN_CLIENT_ID: ADMIN_CLIENT_ID,
    });

    try {
        const initiateAuthCommand = new AdminInitiateAuthCommand({
            AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
            ClientId: ADMIN_CLIENT_ID,
            UserPoolId: USER_POOL_ID,
            AuthParameters: {
                USERNAME: data.email,
                PASSWORD: data.password,
            },
        });

        const response = await cognitoClient.send(initiateAuthCommand);

        if (response.AuthenticationResult) {
            const { AccessToken, RefreshToken, ExpiresIn, IdToken } = response.AuthenticationResult;

            if (!AccessToken) {
                throw new AppError("Authentication failed: No access token received.", 500);
            }

            let userProfile: UserProfile | undefined;
            try {
                const payloadBase64 = IdToken ? IdToken.split('.')[1] : null;
                const decodedPayload = payloadBase64 ? JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8')) : null;
                const userIdFromToken = decodedPayload?.sub;
                const usernameFromToken = decodedPayload?.preferred_username || decodedPayload?.cognito_username;

                if (userIdFromToken) {
                    userProfile = await getUserProfileById(userIdFromToken);
                    if (!userProfile) {
                        // --- START FIX for loginUser's userProfile creation error ---
                        console.warn(`User profile not found in DB for Cognito sub: ${userIdFromToken}. Creating a fallback profile.`);
                        userProfile = {
                            userId: userIdFromToken,
                            username: usernameFromToken || data.email.split('@')[0],
                            email: data.email,
                            // When creating a UserProfile object directly that needs to conform to the interface,
                            // PK and SK MUST be included. These will be added but not saved if this is just a fallback.
                            PK: `USER#${userIdFromToken}`,
                            SK: 'PROFILE',
                            createdAt: new Date().toISOString(), // Or a default timestamp
                            updatedAt: new Date().toISOString(), // Or a default timestamp
                        };
                    }
                }
            } catch (decodeError) {
                console.error("Error decoding IdToken or fetching user profile:", decodeError);
                // --- START FIX for loginUser's error in catch block ---
                userProfile = {
                    userId: "unknown", // Fallback for unknown user ID
                    username: data.email.split('@')[0],
                    email: data.email,
                    PK: 'USER#unknown', // Must include PK/SK for UserProfile type
                    SK: 'PROFILE',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                // --- END FIX ---
            }

            // --- START FIX for loginUser's return userProfile type ---
            // Ensure the userProfile returned to the client omits PK and SK.
            const { PK, SK, ...profileForClient } = userProfile || {} as UserProfile; // Safely destructure
            // --- END FIX ---

            return {
                accessToken: AccessToken,
                refreshToken: RefreshToken,
                expiresIn: ExpiresIn,
                idToken: IdToken,
                userProfile: profileForClient, // Return the profile without internal DynamoDB keys
            };
        } else if (response.ChallengeName) {
            throw new AppError(`Authentication requires challenge: ${response.ChallengeName}. Please complete the challenge via your client app.`, 403);
        } else {
            throw new UnauthorizedError("Invalid username or password.");
        }
    } catch (error: any) {
        if (error.name === "NotAuthorizedException") {
            throw new UnauthorizedError("Invalid username or password or user not confirmed.");
        } else if (error.name === "UserNotFoundException") {
            throw new UnauthorizedError("User not found. Please sign up.");
        } else if (error.name === "UserNotConfirmedException") {
            throw new AppError("User not confirmed. Please verify your account.", 403);
        } else if (error.name === "AppError" || error.name === "UnauthorizedError") {
            throw error; // Re-throw custom AppErrors
        } else {
            console.error("Cognito Login Error:", error);
            throw new AppError(`Login failed: ${error.message || 'Unknown error'}`, 500);
        }
    }
};

export const confirmUser = async (data: ConfirmSignupRequest): Promise<{ message: string }> => {
    if (!CLIENT_ID) {
        console.error("Missing CLIENT_ID for confirm signup");
        throw new AppError("Server configuration error: CLIENT_ID is required for confirming signup.", 500);
    }

    try {
        const command = new ConfirmSignUpCommand({
            ClientId: CLIENT_ID,
            Username: data.email,
            ConfirmationCode: data.verificationCode,
        });

        await cognitoClient.send(command);

        return { message: "User confirmed successfully." };
    } catch (error: any) {
        if (error.name === "CodeMismatchException") {
            throw new AppError("Invalid verification code provided.", 400);
        } else if (error.name === "ExpiredCodeException") {
            throw new AppError("Verification code has expired. Please request a new one.", 400);
        } else if (error.name === "UserNotFoundException") {
            throw new AppError("User not found or already confirmed.", 404);
        } else if (error.name === "NotAuthorizedException") {
            throw new UnauthorizedError("User already confirmed or other authorization issue.");
        } else if (error.name === "AppError") {
            throw error; // Re-throw custom AppErrors
        } else {
            console.error("Confirm signup error:", error);
            throw new AppError(`Failed to confirm user: ${error.message || 'Unknown error'}`, 500);
        }
    }
};