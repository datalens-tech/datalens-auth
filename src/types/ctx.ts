import type {UserRole} from '../constants/role';
import type {BigIntId} from '../db/types/id';

export interface PlatformCtxUser {
    userId: BigIntId;
    sessionId: BigIntId;
    roles: `${UserRole}`[];
}

export interface PlatformCtxInfo {
    isPrivateRoute: boolean;
    readOnlyMode: boolean;
}
