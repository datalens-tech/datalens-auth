import type {UserRole} from '../constants/role';
import type {BigIntId} from '../db/types/id';

export interface PlatformCtxUser {
    type: 'user';
    subjectId: BigIntId;
    sessionId: BigIntId;
    roles: `${UserRole}`[];
    accessToken: string;
}

export interface PlatformCtxServiceAccount {
    type: 'service_account';
    subjectId: BigIntId;
    sessionId: null;
    roles: `${UserRole}`[];
    accessToken: string;
}

export type PlatformCtxSubject = PlatformCtxUser | PlatformCtxServiceAccount;

export interface PlatformCtxInfo {
    isPrivateRoute: boolean;
    readOnlyMode: boolean;
}
