import {AppContext} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';
import {raw, transaction} from 'objection';

import {
    RefreshTokenModel,
    RefreshTokenModelColumn,
    RefreshTokenModelFields,
} from '../db/models/refresh-token';
import {RoleModel, RoleModelColumn} from '../db/models/role';
import {SessionModel, SessionModelColumn} from '../db/models/session';
import type {BigIntId} from '../db/types/id';
import {getPrimary} from '../db/utils/db';
import {ServiceArgs} from '../types/service';
import {AccessTokenPayload, RefreshTokenPayload} from '../types/token';
import {decodeId, encodeId} from '../utils/ids';
import {Nullable, Optional} from '../utils/utility-types';

const algorithm = 'PS256';

export class JwtAuth {
    static generateTokens = async (
        {trx, ctx}: ServiceArgs,
        {userId, sessionId}: {userId: BigIntId; sessionId: BigIntId},
    ) => {
        ctx.log('GENERATE_TOKENS', {userId, sessionId});
        const {getId} = ctx.get('registry').getDbInstance();

        const roleModels = await RoleModel.query(getPrimary(trx))
            .select(RoleModelColumn.Role)
            .where(RoleModelColumn.UserId, userId)
            .timeout(RefreshTokenModel.DEFAULT_QUERY_TIMEOUT);

        const roles = roleModels.map((model) => model[RoleModelColumn.Role]);

        const encodedSessionId = encodeId(sessionId);
        const encodedUserId = encodeId(userId);

        const accessToken = jwt.sign(
            {
                userId: encodedUserId,
                sessionId: encodedSessionId,
                roles,
            },
            ctx.config.tokenPrivateKey,
            {algorithm, expiresIn: `${ctx.config.accessTokenTTL}s`},
        );

        const refreshTokenId = await getId();
        const encodedRefreshTokenId = encodeId(refreshTokenId);

        const refreshToken = jwt.sign(
            {
                refreshTokenId: encodedRefreshTokenId,
                userId: encodedUserId,
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

            await transaction(getPrimary(trx), async (transactionTrx) => {
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

                const result = await this.generateTokens(
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
