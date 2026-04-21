import type {ValuesType} from 'utility-types';

import {Model} from '../';
import {UserRole} from '../../constants/role';
import type {BigIntId} from '../types/id';

export const ServiceAccountRoleModelColumn = {
    RoleId: 'roleId',
    ServiceAccountId: 'serviceAccountId',
    Role: 'role',
    CreatedAt: 'createdAt',
    UpdatedAt: 'updatedAt',
} as const;

type ServiceAccountRoleModelColumnValues = ValuesType<typeof ServiceAccountRoleModelColumn>;

export type ServiceAccountRoleModelFields = Pick<
    ServiceAccountRoleModel,
    ServiceAccountRoleModelColumnValues
>;

export class ServiceAccountRoleModel
    extends Model
    implements Record<ServiceAccountRoleModelColumnValues, unknown>
{
    static get tableName() {
        return 'auth_service_account_roles';
    }

    static get idColumn() {
        return ServiceAccountRoleModelColumn.RoleId;
    }

    roleId!: BigIntId;
    serviceAccountId!: BigIntId;
    role!: `${UserRole}`;
    createdAt!: string;
    updatedAt!: string;
}
