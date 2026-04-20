import {raw, transaction} from 'objection';

import {SessionModel, SessionModelColumn} from '../../db/models/session';
import type {BigIntId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';
import {Nullable} from '../../utils/utility-types';

import {generateTokens} from './generate-tokens';

export const startSession = async (
    {trx, ctx}: ServiceArgs,
    {
        userId,
        userAgent,
        userIp,
    }: {
        userId: BigIntId;
        userAgent?: string;
        userIp: Nullable<string>;
    },
) => {
    ctx.log('START_SESSION', {userId, userAgent});

    return await transaction(getPrimary(trx), async (transactionTrx) => {
        const session = await SessionModel.query(transactionTrx)
            .insert({
                userId,
                userAgent: userAgent ?? 'Unknown',
                userIp,
                expiredAt: raw(`NOW() + INTERVAL '?? SECOND'`, [ctx.config.sessionTTL]),
            })
            .returning(SessionModelColumn.SessionId)
            .timeout(SessionModel.DEFAULT_QUERY_TIMEOUT);

        const {accessToken, refreshToken} = await generateTokens(
            {trx: transactionTrx, ctx},
            {
                userId,
                sessionId: session.sessionId,
            },
        );

        return {accessToken, refreshToken, sessionId: session.sessionId};
    });
};
