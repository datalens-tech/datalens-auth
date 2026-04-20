import type {ValuesType} from 'utility-types';

import {Model} from '../';
import {UserRole} from '../../constants/role';
import type {Nullable} from '../../utils/utility-types';
import type {BigIntId} from '../types/id';

export const ServiceAccountModelColumn = {
    ServiceAccountId: 'serviceAccountId',
    Name: 'name',
    Description: 'description',
    PublicKey: 'publicKey',
    Roles: 'roles',
    CreatedAt: 'createdAt',
    UpdatedAt: 'updatedAt',
} as const;

type ServiceAccountModelColumnValues = ValuesType<typeof ServiceAccountModelColumn>;

export type ServiceAccountModelFields = Pick<ServiceAccountModel, ServiceAccountModelColumnValues>;

export class ServiceAccountModel
    extends Model
    implements Record<ServiceAccountModelColumnValues, unknown>
{
    static get tableName() {
        return 'auth_service_accounts';
    }

    static get idColumn() {
        return ServiceAccountModelColumn.ServiceAccountId;
    }

    serviceAccountId!: BigIntId;
    name!: string;
    description!: Nullable<string>;
    publicKey!: string;
    roles!: `${UserRole}`[];
    createdAt!: string;
    updatedAt!: string;
}
