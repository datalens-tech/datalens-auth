import type {ValuesType} from 'utility-types';

import {Model} from '../';
import type {BigIntId} from '../types/id';

export const ServiceAccountKeyModelColumn = {
    KeyId: 'keyId',
    ServiceAccountId: 'serviceAccountId',
    PublicKey: 'publicKey',
    CreatedAt: 'createdAt',
} as const;

type ServiceAccountKeyModelColumnValues = ValuesType<typeof ServiceAccountKeyModelColumn>;

export type ServiceAccountKeyModelFields = Pick<
    ServiceAccountKeyModel,
    ServiceAccountKeyModelColumnValues
>;

export class ServiceAccountKeyModel
    extends Model
    implements Record<ServiceAccountKeyModelColumnValues, unknown>
{
    static get tableName() {
        return 'auth_service_account_keys';
    }

    static get idColumn() {
        return ServiceAccountKeyModelColumn.KeyId;
    }

    keyId!: BigIntId;
    serviceAccountId!: BigIntId;
    publicKey!: string;
    createdAt!: string;
}
