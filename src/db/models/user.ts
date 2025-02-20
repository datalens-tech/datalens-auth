import type {ValuesType} from 'utility-types';

import {Model} from '../';
import type {Nullable} from '../../utils/utility-types';
import type {BigIntId} from '../types/id';

export const UserModelColumn = {
    UserId: 'userId',
    CreatedAt: 'createdAt',
    UpdatedAt: 'updatedAt',
    Login: 'login',
    Password: 'password',
    Email: 'email',
    FirstName: 'firstName',
    LastName: 'lastName',
    IdpUserId: 'idpUserId',
    IdpSlug: 'idpSlug',
    IdpType: 'idpType',
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

    userId!: BigIntId;
    createdAt!: string;
    updatedAt!: string;
    login!: Nullable<string>;
    password!: Nullable<string>;
    firstName!: Nullable<string>;
    lastName!: Nullable<string>;
    email!: Nullable<string>;
    idpUserId!: Nullable<string>;
    idpSlug!: Nullable<string>;
    idpType!: Nullable<string>;
}
