import type {UserRole} from '../constants/role';
import {ACCESS_TOKEN_TYPE} from '../constants/token';
import type {BigIntId} from '../db/types/id';

export type PlatformCtxUser = {
    type: typeof ACCESS_TOKEN_TYPE.USER;
    subjectId: BigIntId;
    sessionId: BigIntId;
    roles: `${UserRole}`[];
    accessToken: string;
};

export type PlatformCtxServiceAccount = {
    type: typeof ACCESS_TOKEN_TYPE.SERVICE_ACCOUNT;
    subjectId: BigIntId;
    sessionId: null;
    roles: `${UserRole}`[];
    accessToken: string;
};

export type PlatformCtxSubject = PlatformCtxUser | PlatformCtxServiceAccount;

export interface PlatformCtxInfo {
    isPrivateRoute: boolean;
    readOnlyMode: boolean;
}
