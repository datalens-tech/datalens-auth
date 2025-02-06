import type {StringId} from '../db/types/id';

export interface PlatformAuthorizedUser {
    userId: StringId;
    accessToken: string;
    refreshToken: string;
}
