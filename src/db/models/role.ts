import type {ValuesType} from 'utility-types';

import {Model} from '../';
import {UserRole} from '../../constants/role';

export const RoleModelColumn = {
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
        return [RoleModelColumn.UserId, RoleModelColumn.Role];
    }

    userId!: string;
    role!: `${UserRole}`;
    createdAt!: string;
    updatedAt!: string;
}
