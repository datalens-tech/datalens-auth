import {transaction} from 'objection';

import {RefreshTokenModel, RefreshTokenModelColumn} from '../../db/models/refresh-token';
import {SessionModel, SessionModelColumn} from '../../db/models/session';
import {getPrimary} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';
import {decodeId} from '../../utils/ids';

import {verifyRefreshToken} from './verify-refresh-token';

export const closeSession = async (
    {trx, ctx}: ServiceArgs,
    {refreshToken}: {refreshToken: string},
) => {
    ctx.log('CLOSE_SESSION');

    try {
        const token = verifyRefreshToken({ctx, refreshToken});

        const decodedRefreshTokenId = decodeId(token.refreshTokenId);

        await transaction(getPrimary(trx), async (transactionTrx) => {
            const refreshTokenModel = await RefreshTokenModel.query(transactionTrx)
                .select(RefreshTokenModelColumn.SessionId)
                .where(RefreshTokenModelColumn.RefreshTokenId, decodedRefreshTokenId)
                .first()
                .timeout(RefreshTokenModel.DEFAULT_QUERY_TIMEOUT);

            if (refreshTokenModel) {
                ctx.log('SESSION_INFO', {sessionId: refreshTokenModel.sessionId});

                await SessionModel.query(transactionTrx)
                    .delete()
                    .where(SessionModelColumn.SessionId, refreshTokenModel.sessionId)
                    .timeout(SessionModel.DEFAULT_QUERY_TIMEOUT);
            } else {
                ctx.log('REFRESH_TOKEN_NOT_EXISTS');
            }
        });
    } catch (err) {
        ctx.logError('CLOSE_SESSION_ERROR', err);
    }
};
