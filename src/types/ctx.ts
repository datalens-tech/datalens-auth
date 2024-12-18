import type {UserRole} from '../constants/role';

export interface CtxUser {
    userId: string;
    sessionId: string;
    roles: `${UserRole}`[];
}

export interface CtxInfo {
    isPrivateRoute: boolean;
    readOnlyMode: boolean;
}
