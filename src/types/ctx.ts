import type {UserRole} from '../constants/role';
import type {BigIntId} from '../db/types/id';

export interface CtxUser {
    userId: BigIntId;
    sessionId: BigIntId;
    roles: `${UserRole}`[];
}

export interface CtxInfo {
    isPrivateRoute: boolean;
    readOnlyMode: boolean;
}
