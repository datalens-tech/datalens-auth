import {AppContext, AppError} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';
import {raw, transaction} from 'objection';

import {AUTH_ERROR} from '../constants/error-constants';
import {
    RefreshTokenModel,
    RefreshTokenModelColumn,
    RefreshTokenModelFields,
} from '../db/models/refresh-token';
import {RoleModel, RoleModelColumn} from '../db/models/role';
import {ServiceAccountModel, ServiceAccountModelColumn} from '../db/models/service-account';
import {SessionModel, SessionModelColumn} from '../db/models/session';
import type {BigIntId} from '../db/types/id';
import {getPrimary} from '../db/utils/db';
import {ServiceArgs} from '../types/service';
import {
    RefreshTokenPayload,
    ServiceAccountAccessTokenPayload,
    VerifiedAccessTokenPayload,
} from '../types/token';
import {decodeId, encodeId} from '../utils/ids';
import {Nullable, Optional} from '../utils/utility-types';

const MAX_CLIENT_JWT_TTL_SECONDS = 600;

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

            return {accessToken, refreshToken, sessionId: session.sessionId};
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

    static verifyAccessToken = ({
        ctx,
        accessToken,
    }: {
        ctx: AppContext;
        accessToken: string;
    }): VerifiedAccessTokenPayload => {
        ctx.log('VERIFY_ACCESS_TOKEN');

        try {
            const result = jwt.verify(accessToken, ctx.config.tokenPublicKey, {
                algorithms: [algorithm],
            }) as VerifiedAccessTokenPayload;
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

    static generateServiceAccountAccessToken = (
        {ctx}: {ctx: AppContext},
        {
            serviceAccountId,
            roles,
        }: {serviceAccountId: BigIntId; roles: ServiceAccountAccessTokenPayload['roles']},
    ) => {
        ctx.log('GENERATE_SA_ACCESS_TOKEN', {serviceAccountId});

        const encodedServiceAccountId = encodeId(serviceAccountId);

        return jwt.sign(
            {
                serviceAccountId: encodedServiceAccountId,
                roles,
                type: 'service_account',
            },
            ctx.config.tokenPrivateKey,
            {algorithm, expiresIn: `${ctx.config.serviceAccountAccessTokenTTL}s`},
        );
    };

    static exchangeServiceAccountToken = async (
        {trx, ctx}: ServiceArgs,
        {clientJwt}: {clientJwt: string},
    ) => {
        ctx.log('EXCHANGE_SA_TOKEN');

        const invalidJwt = (message: string) =>
            new AppError(message, {code: AUTH_ERROR.INVALID_SERVICE_ACCOUNT_JWT});

        let decoded: jwt.Jwt | null;
        try {
            decoded = jwt.decode(clientJwt, {complete: true});
        } catch (err) {
            ctx.logError('EXCHANGE_SA_TOKEN_DECODE_ERROR', err);
            throw invalidJwt('Malformed client JWT');
        }

        const rawPayload =
            decoded?.payload && typeof decoded.payload === 'object' ? decoded.payload : null;
        const iss = rawPayload ? (rawPayload as {iss?: unknown}).iss : undefined;

        if (typeof iss !== 'string' || iss.length === 0) {
            throw invalidJwt('Missing or invalid iss claim in client JWT');
        }

        let decodedServiceAccountId: BigIntId;
        try {
            decodedServiceAccountId = decodeId(iss as Parameters<typeof decodeId>[0]);
        } catch (err) {
            ctx.logError('EXCHANGE_SA_TOKEN_ISS_DECODE_ERROR', err);
            throw invalidJwt('Invalid iss claim in client JWT');
        }

        const sa = await ServiceAccountModel.query(getPrimary(trx))
            .select([
                ServiceAccountModelColumn.ServiceAccountId,
                ServiceAccountModelColumn.PublicKey,
                ServiceAccountModelColumn.Roles,
            ])
            .where(ServiceAccountModelColumn.ServiceAccountId, decodedServiceAccountId)
            .first()
            .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

        if (!sa) {
            throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS, {
                code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
            });
        }

        let payload: jwt.JwtPayload;
        try {
            payload = jwt.verify(clientJwt, sa.publicKey, {
                algorithms: ['RS256'],
            }) as jwt.JwtPayload;
        } catch (err) {
            ctx.logError('EXCHANGE_SA_TOKEN_VERIFY_ERROR', err);
            throw invalidJwt('Client JWT signature verification failed');
        }

        if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
            throw invalidJwt('Client JWT must contain numeric iat and exp claims');
        }

        if (payload.exp - payload.iat > MAX_CLIENT_JWT_TTL_SECONDS) {
            throw invalidJwt(`Client JWT TTL exceeds ${MAX_CLIENT_JWT_TTL_SECONDS} seconds`);
        }

        ctx.log('EXCHANGE_SA_TOKEN_SUCCESS', {serviceAccountId: decodedServiceAccountId});

        return this.generateServiceAccountAccessToken(
            {ctx},
            {serviceAccountId: decodedServiceAccountId, roles: sa.roles},
        );
    };
}
