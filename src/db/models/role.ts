import type {ValuesType} from 'utility-types';

import {Model} from '../';
import {UserRole} from '../../constants/role';
import type {BigIntId} from '../types/id';

export const RoleModelColumn = {
    RoleId: 'roleId',
    UserId: 'userId',
    Role: 'role',
    CreatedAt: 'createdAt',
    UpdatedAt: 'updatedAt',
} as const;

type RoleModelColumnValues = ValuesType<typeof RoleModelColumn>;

export type RoleModelFields = Pick<RoleModel, RoleModelColumnValues>;

export class RoleModel extends Model implements Record<RoleModelColumnValues, unknown> {
    static get tableName() {
        return 'auth_roles';
    }

    static get idColumn() {
        return RoleModelColumn.RoleId;
    }

    roleId!: BigIntId;
    userId!: BigIntId;
    role!: `${UserRole}`;
    createdAt!: string;
    updatedAt!: string;
}
