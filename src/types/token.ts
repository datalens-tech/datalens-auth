import {UserRole} from '../constants/role';
import {ACCESS_TOKEN_TYPE} from '../constants/token';
import type {StringId} from '../db/types/id';

export interface ExpirableTokenPayload {
    iat: number;
    exp: number;
}

export type UserAccessTokenClaims = {
    type?: typeof ACCESS_TOKEN_TYPE.USER;
    userId: StringId;
    sessionId: StringId;
    roles: `${UserRole}`[];
};

export type UserAccessTokenPayload = ExpirableTokenPayload & UserAccessTokenClaims;

export type ServiceAccountAccessTokenClaims = {
    type: typeof ACCESS_TOKEN_TYPE.SERVICE_ACCOUNT;
    userId: StringId;
    roles: `${UserRole}`[];
};

export type ServiceAccountAccessTokenPayload = ExpirableTokenPayload &
    ServiceAccountAccessTokenClaims;

export type VerifiedAccessTokenPayload = UserAccessTokenPayload | ServiceAccountAccessTokenPayload;

export interface RefreshTokenPayload {
    refreshTokenId: StringId;
    userId: StringId;
    sessionId: StringId;
}
