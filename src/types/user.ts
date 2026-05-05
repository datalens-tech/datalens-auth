import type {ValuesType} from 'utility-types';

import {USER_TYPE} from '../constants/user';
import type {BigIntId} from '../db/types/id';

export type UserType = ValuesType<typeof USER_TYPE>;
export interface PlatformAuthorizedUser {
    userId: BigIntId;
    accessToken: string;
    refreshToken: string;
}
