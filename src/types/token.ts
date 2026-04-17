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
    type?: undefined;
}

export interface ServiceAccountAccessTokenPayload extends ExpirableTokenPayload {
    serviceAccountId: StringId;
    roles: `${UserRole}`[];
    type: 'service_account';
}

export type VerifiedAccessTokenPayload = AccessTokenPayload | ServiceAccountAccessTokenPayload;

export interface RefreshTokenPayload {
    refreshTokenId: StringId;
    userId: StringId;
    sessionId: StringId;
}
