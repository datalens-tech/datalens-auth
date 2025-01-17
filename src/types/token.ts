import {UserRole} from '../constants/role';
import type {StringId} from '../db/types/id';

export interface ExpirableTokenPayload {
    iat: number;
    exp: number;
}

export interface AccessTokenPayload extends ExpirableTokenPayload {
    userId: StringId;
    sessionId: StringId;
    roles: `${UserRole}`[];
}

export interface RefreshTokenPayload {
    refreshTokenId: StringId;
    userId: StringId;
    sessionId: StringId;
}
