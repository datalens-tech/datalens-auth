import type {ValuesType} from 'utility-types';

import {Model} from '../';
import type {Nullable} from '../../utils/utility-types';

export const SessionModelColumn = {
    SessionId: 'sessionId',
    UserId: 'userId',
    UserAgent: 'userAgent',
    UserIp: 'userIp',
    CreatedAt: 'createdAt',
    UpdatedAt: 'updatedAt',
    ExpiredAt: 'expiredAt',
} as const;

type SessionModelColumnValues = ValuesType<typeof SessionModelColumn>;

export type SessionModelFields = Pick<SessionModel, SessionModelColumnValues>;

export class SessionModel extends Model implements Record<SessionModelColumnValues, unknown> {
    static get tableName() {
        return 'auth_sessions';
    }

    static get idColumn() {
        return SessionModelColumn.SessionId;
    }

    sessionId!: string;
    userId!: string;
    userAgent!: string;
    userIp!: Nullable<string>;
    createdAt!: string;
    updatedAt!: string;
    expiredAt!: string;
}
