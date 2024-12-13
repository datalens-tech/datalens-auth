import type {ValuesType} from 'utility-types';

import {Model} from '../';
import type {Nullable} from '../../utils/utility-types';

export const UserModelColumn = {
    UserId: 'userId',
    DisplayName: 'displayName',
    CreatedAt: 'createdAt',
    UpdatedAt: 'updatedAt',
    Login: 'login',
    Password: 'password',
} as const;

type UserModelColumnValues = ValuesType<typeof UserModelColumn>;

export type UserModelFields = Pick<UserModel, UserModelColumnValues>;

export class UserModel extends Model implements Record<UserModelColumnValues, unknown> {
    static get tableName() {
        return 'auth_users';
    }

    static get idColumn() {
        return UserModelColumn.UserId;
    }

    userId!: string;
    displayName!: string;
    createdAt!: string;
    updatedAt!: string;
    login!: Nullable<string>;
    password!: Nullable<string>;
}
