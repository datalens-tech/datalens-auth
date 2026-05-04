import type {UserRole} from '../constants/role';
import {USER_TYPE} from '../constants/user';
import type {BigIntId} from '../db/types/id';

export type PlatformCtxUser = {
    type: typeof USER_TYPE.USER;
    subjectId: BigIntId;
    sessionId: BigIntId;
    roles: `${UserRole}`[];
    accessToken: string;
};

export type PlatformCtxServiceAccount = {
    type: typeof USER_TYPE.SERVICE_ACCOUNT;
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
