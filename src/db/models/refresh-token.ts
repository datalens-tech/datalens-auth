import type {ValuesType} from 'utility-types';

import {Model} from '../';
import type {BigIntId} from '../types/id';

export const RefreshTokenModelColumn = {
    RefreshTokenId: 'refreshTokenId',
    SessionId: 'sessionId',
    CreatedAt: 'createdAt',
    ExpiredAt: 'expiredAt',
} as const;

type RefreshTokenModelColumnValues = ValuesType<typeof RefreshTokenModelColumn>;

export type RefreshTokenModelFields = Pick<RefreshTokenModel, RefreshTokenModelColumnValues>;

export class RefreshTokenModel
    extends Model
    implements Record<RefreshTokenModelColumnValues, unknown>
{
    static get tableName() {
        return 'auth_refresh_tokens';
    }

    static get idColumn() {
        return RefreshTokenModelColumn.RefreshTokenId;
    }

    refreshTokenId!: BigIntId;
    sessionId!: BigIntId;
    createdAt!: string;
    expiredAt!: string;
}
