import type {ValuesType} from 'utility-types';

import {Model} from '..';

export const ProviderModelColumn = {
    ProviderId: 'providerId',
    Name: 'name',
    Data: 'data',
    CreatedAt: 'createdAt',
    UpdatedAt: 'updatedAt',
} as const;

type ProviderModelColumnValues = ValuesType<typeof ProviderModelColumn>;

export type ProviderModelFields = Pick<ProviderModel, ProviderModelColumnValues>;

export class ProviderModel extends Model implements Record<ProviderModelColumnValues, unknown> {
    static get tableName() {
        return 'auth_providers';
    }

    static get idColumn() {
        return ProviderModelColumn.ProviderId;
    }

    providerId!: string;
    name!: string;
    data!: Record<string, unknown>;
    createdAt!: string;
    updatedAt!: string;
}
