import type {ValuesType} from 'utility-types';

import {Model} from '../';

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

    refreshTokenId!: string;
    sessionId!: string;
    createdAt!: string;
    expiredAt!: string;
}
