import type {StringId} from '../db/types/id';

export interface AuthorizedUser {
    userId: StringId;
    accessToken: string;
    refreshToken: string;
}
