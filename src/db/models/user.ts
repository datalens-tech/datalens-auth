import type {ValuesType} from 'utility-types';

import {Model} from '../';
import type {Nullable} from '../../utils/utility-types';

export const UserModelColumn = {
    UserId: 'userId',
    CreatedAt: 'createdAt',
    UpdatedAt: 'updatedAt',
    Login: 'login',
    Password: 'password',
    Email: 'email',
    FirstName: 'firstName',
    LastName: 'lastName',
    ProviderId: 'providerId',
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
    createdAt!: string;
    updatedAt!: string;
    login!: Nullable<string>;
    password!: Nullable<string>;
    firstName!: Nullable<string>;
    lastName!: Nullable<string>;
    email!: Nullable<string>;
    providerId!: Nullable<string>;
}
