import type {BigIntId} from '../db/types/id';

export interface PlatformAuthorizedUser {
    userId: BigIntId;
    accessToken: string;
    refreshToken: string;
}
