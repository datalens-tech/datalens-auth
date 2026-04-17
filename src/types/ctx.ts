import type {UserRole} from '../constants/role';
import type {BigIntId} from '../db/types/id';
import type {Nullable} from '../utils/utility-types';

export interface PlatformCtxUser {
    userId: Nullable<BigIntId>;
    sessionId: Nullable<BigIntId>;
    roles: `${UserRole}`[];
    accessToken: string;
    isServiceAccount?: boolean;
    serviceAccountId?: BigIntId;
}

export interface PlatformCtxInfo {
    isPrivateRoute: boolean;
    readOnlyMode: boolean;
}
