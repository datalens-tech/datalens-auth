import type {UserRole} from '../constants/role';
import type {StringId} from '../db/types/id';

export interface CtxUser {
    userId: StringId;
    sessionId: StringId;
    roles: `${UserRole}`[];
}

export interface CtxInfo {
    isPrivateRoute: boolean;
    readOnlyMode: boolean;
}
