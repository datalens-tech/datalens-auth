import {AppContext} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';
import {raw, transaction} from 'objection';

import {RefreshTokenModel, RefreshTokenModelColumn} from '../db/models/refresh-token';
import {SessionModel, SessionModelColumn} from '../db/models/session';
import {getPrimary} from '../db/utils/db';
import {ServiceArgs} from '../types/service';
import {AccessTokenPayload, RefreshTokenPayload} from '../types/token';
import {decodeId, encodeId} from '../utils/ids';
import {Nullable} from '../utils/utility-types';

const algorithm = 'RS256';

export class JwtAuth {
    static generateTokens = async (
        {trx, ctx}: ServiceArgs,
        {userId, sessionId}: {userId: string; sessionId: string},
    ) => {
        ctx.log('GENERATE_TOKENS', {userId, sessionId});
        const {getId} = ctx.get('registry').getDbInstance();

        const encodedSessionId = encodeId(sessionId);

        const accessToken = jwt.sign(
            {
                userId,
                sessionId: encodedSessionId,
            },
            ctx.config.tokenPrivateKey,
            {algorithm, expiresIn: `${ctx.config.accessTokenTTL}s`},
        );

        const refreshTokenId = await getId();
        const encodedRefreshTokenId = encodeId(refreshTokenId);

        const refreshToken = jwt.sign(
            {
                refreshTokenId: encodedRefreshTokenId,
                userId,
                sessionId: encodedSessionId,
            },
            ctx.config.tokenPrivateKey,
            {algorithm},
        );

        await RefreshTokenModel.query(getPrimary(trx))
            .insert({
                refreshTokenId,
                sessionId,
                expiredAt: raw(`NOW() + INTERVAL '?? SECOND'`, [ctx.config.refreshTokenTTL]),
            })
            .timeout(RefreshTokenModel.DEFAULT_QUERY_TIMEOUT);

        return {
            accessToken,
            refreshToken,
        };
    };

    static startSession = async (
        {trx, ctx}: ServiceArgs,
        {
            userId,
            userAgent,
            userIp,
        }: {
            userId: string;
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

            const {accessToken, refreshToken} = await this.generateTokens(
                {trx: transactionTrx, ctx},
                {
                    userId,
                    sessionId: session.sessionId,
                },
            );

            return {accessToken, refreshToken};
        });
    };

    static closeSession = async (
        {trx, ctx}: ServiceArgs,
        {
            refreshToken,
        }: {
            refreshToken: string;
        },
    ) => {
        ctx.log('CLOSE_SESSION');

        try {
            const token = this.verifyRefreshToken({
                ctx,
                refreshToken,
            });

            const decodedRefreshTokenId = decodeId(token.refreshTokenId);

            return await transaction(getPrimary(trx), async (transactionTrx) => {
                const refreshTokenModel = await RefreshTokenModel.query(transactionTrx)
                    .select(RefreshTokenModelColumn.SessionId)
                    .where(RefreshTokenModelColumn.RefreshTokenId, decodedRefreshTokenId)
                    .first()
                    .timeout(RefreshTokenModel.DEFAULT_QUERY_TIMEOUT);

                if (refreshTokenModel) {
                    ctx.log('SESSION_INFO', {
                        sessionId: refreshTokenModel.sessionId,
                    });

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
            throw err;
        }
    };

    static refreshTokens = async (
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
            const token = this.verifyRefreshToken({
                ctx,
                refreshToken,
            });

            const userId = token.userId;
            const decodedRefreshTokenId = decodeId(token.refreshTokenId);
            const decodedSessionId = decodeId(token.sessionId);

            // TODO: left join
            const [refreshTokenModel, sessionModel] = await Promise.all([
                RefreshTokenModel.query(getPrimary(trx))
                    .select(RefreshTokenModelColumn.ExpiredAt)
                    .where(RefreshTokenModelColumn.RefreshTokenId, decodedRefreshTokenId)
                    .first()
                    .timeout(RefreshTokenModel.DEFAULT_QUERY_TIMEOUT),
                SessionModel.query(getPrimary(trx))
                    .select([SessionModelColumn.UserIp, SessionModelColumn.ExpiredAt])
                    .where({
                        [SessionModelColumn.SessionId]: decodedSessionId,
                        [SessionModelColumn.UserId]: userId,
                    })
                    .first()
                    .timeout(SessionModel.DEFAULT_QUERY_TIMEOUT),
            ]);

            if (!sessionModel) {
                throw new Error('Unknown session');
            }

            if (!refreshTokenModel) {
                if (sessionModel.userIp && sessionModel.userIp !== userIp) {
                    // Delete compromised session
                    await SessionModel.query(getPrimary(trx))
                        .delete()
                        .where(SessionModelColumn.SessionId, decodedSessionId)
                        .timeout(SessionModel.DEFAULT_QUERY_TIMEOUT);
                }

                throw new Error('Unknown refreshToken');
            }

            if (new Date(refreshTokenModel.expiredAt).getTime() < new Date().getTime()) {
                throw new Error('Expired refreshToken');
            }

            if (new Date(sessionModel.expiredAt).getTime() < new Date().getTime()) {
                throw new Error('Expired session');
            }

            return await transaction(getPrimary(trx), async (transactionTrx) => {
                await RefreshTokenModel.query(transactionTrx)
                    .delete()
                    .where(RefreshTokenModelColumn.RefreshTokenId, decodedRefreshTokenId)
                    .timeout(RefreshTokenModel.DEFAULT_QUERY_TIMEOUT);

                const result = await this.generateTokens(
                    {trx: transactionTrx, ctx},
                    {userId, sessionId: decodedSessionId},
                );

                await SessionModel.query(transactionTrx)
                    .patch({
                        [SessionModelColumn.UserIp]: userIp,
                    })
                    .where({
                        [SessionModelColumn.SessionId]: decodedSessionId,
                        [SessionModelColumn.UserId]: userId,
                    })
                    .timeout(SessionModel.DEFAULT_QUERY_TIMEOUT);

                return result;
            });
        } catch (err) {
            ctx.logError('REFRESH_TOKENS_ERROR', err);
            throw err;
        }
    };

    static verifyAccessToken = ({ctx, accessToken}: {ctx: AppContext; accessToken: string}) => {
        ctx.log('VERIFY_ACCESS_TOKEN');

        try {
            const result = jwt.verify(accessToken, ctx.config.tokenPublicKey, {
                algorithms: [algorithm],
            }) as AccessTokenPayload;
            ctx.log('VERIFY_ACCESS_TOKEN_SUCCESS');
            return result;
        } catch (err) {
            ctx.logError('VERIFY_ACCESS_TOKEN_ERROR', err);
            throw err;
        }
    };

    static verifyRefreshToken = ({ctx, refreshToken}: {ctx: AppContext; refreshToken: string}) => {
        ctx.log('VERIFY_REFRESH_TOKEN');

        try {
            const result = jwt.verify(refreshToken, ctx.config.tokenPublicKey, {
                algorithms: [algorithm],
            }) as RefreshTokenPayload;
            ctx.log('VERIFY_REFRESH_TOKEN_SUCCESS');
            return result;
        } catch (err) {
            ctx.logError('VERIFY_REFRESH_TOKEN_ERROR', err);
            throw err;
        }
    };
}
