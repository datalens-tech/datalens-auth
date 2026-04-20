import {transaction} from 'objection';

import {
    RefreshTokenModel,
    RefreshTokenModelColumn,
    RefreshTokenModelFields,
} from '../../db/models/refresh-token';
import {SessionModel, SessionModelColumn} from '../../db/models/session';
import {getPrimary} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';
import {decodeId} from '../../utils/ids';
import {Nullable, Optional} from '../../utils/utility-types';

import {generateTokens} from './generate-tokens';
import {verifyRefreshToken} from './verify-refresh-token';

export const refreshTokens = async (
    {trx, ctx}: ServiceArgs,
    {
        refreshToken,
        userIp,
    }: {
        refreshToken: string;
        userIp: Nullable<string>;
    },
) => {
    ctx.log('REFRESH_TOKENS');

    try {
        const token = verifyRefreshToken({ctx, refreshToken});

        const decodedUserId = decodeId(token.userId);
        const decodedRefreshTokenId = decodeId(token.refreshTokenId);
        const decodedSessionId = decodeId(token.sessionId);

        const tokenExpiredAtColumn = 'tokenExpiredAt';

        const joinedModel = (await SessionModel.query(getPrimary(trx))
            .select([
                `${SessionModel.tableName}.${SessionModelColumn.UserIp}`,
                `${SessionModel.tableName}.${SessionModelColumn.ExpiredAt}`,
                `${RefreshTokenModel.tableName}.${RefreshTokenModelColumn.RefreshTokenId}`,
                `${RefreshTokenModel.tableName}.${RefreshTokenModelColumn.ExpiredAt} as token_expired_at`,
            ])
            .leftJoin(
                RefreshTokenModel.tableName,
                `${SessionModel.tableName}.${SessionModelColumn.SessionId}`,
                `${RefreshTokenModel.tableName}.${RefreshTokenModelColumn.SessionId}`,
            )
            .where({
                [`${SessionModel.tableName}.${SessionModelColumn.SessionId}`]: decodedSessionId,
                [`${SessionModel.tableName}.${SessionModelColumn.UserId}`]: decodedUserId,
            })
            .first()
            .timeout(SessionModel.DEFAULT_QUERY_TIMEOUT)) as Optional<
            SessionModel & {
                [tokenExpiredAtColumn]: RefreshTokenModelFields['expiredAt'];
            } & Pick<RefreshTokenModelFields, 'refreshTokenId'>
        >;

        if (!joinedModel) {
            throw new Error('Unknown session');
        }

        if (joinedModel[RefreshTokenModelColumn.RefreshTokenId] !== decodedRefreshTokenId) {
            if (joinedModel.userIp && joinedModel.userIp !== userIp) {
                // Delete compromised session
                await SessionModel.query(getPrimary(trx))
                    .delete()
                    .where(SessionModelColumn.SessionId, decodedSessionId)
                    .timeout(SessionModel.DEFAULT_QUERY_TIMEOUT);
            }

            throw new Error('Unknown refreshToken');
        }

        if (new Date(joinedModel[tokenExpiredAtColumn]).getTime() < new Date().getTime()) {
            throw new Error('Expired refreshToken');
        }

        if (new Date(joinedModel.expiredAt).getTime() < new Date().getTime()) {
            throw new Error('Expired session');
        }

        return await transaction(getPrimary(trx), async (transactionTrx) => {
            await RefreshTokenModel.query(transactionTrx)
                .delete()
                .where(RefreshTokenModelColumn.RefreshTokenId, decodedRefreshTokenId)
                .timeout(RefreshTokenModel.DEFAULT_QUERY_TIMEOUT);

            const result = await generateTokens(
                {trx: transactionTrx, ctx},
                {userId: decodedUserId, sessionId: decodedSessionId},
            );

            await SessionModel.query(transactionTrx)
                .patch({
                    [SessionModelColumn.UserIp]: userIp,
                })
                .where({
                    [SessionModelColumn.SessionId]: decodedSessionId,
                    [SessionModelColumn.UserId]: decodedUserId,
                })
                .timeout(SessionModel.DEFAULT_QUERY_TIMEOUT);

            return result;
        });
    } catch (err) {
        ctx.logError('REFRESH_TOKENS_ERROR', err);
        throw err;
    }
};
