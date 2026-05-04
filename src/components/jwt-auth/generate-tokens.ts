import jwt from 'jsonwebtoken';
import {raw} from 'objection';

import {USER_TYPE} from '../../constants/user';
import {RefreshTokenModel} from '../../db/models/refresh-token';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import type {BigIntId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';
import {RefreshTokenPayload, UserAccessTokenClaims} from '../../types/token';
import {encodeId} from '../../utils/ids';

import {SIGNATURE_ALGORITHM} from './constants';

export const generateTokens = async (
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

    const accessTokenPayload: UserAccessTokenClaims = {
        userId: encodedUserId,
        sessionId: encodedSessionId,
        roles,
        type: USER_TYPE.USER,
    };

    const accessToken = jwt.sign(accessTokenPayload, ctx.config.tokenPrivateKey, {
        algorithm: SIGNATURE_ALGORITHM,
        expiresIn: `${ctx.config.accessTokenTTL}s`,
    });

    const refreshTokenId = await getId();
    const encodedRefreshTokenId = encodeId(refreshTokenId);

    const refreshTokenPayload: RefreshTokenPayload = {
        refreshTokenId: encodedRefreshTokenId,
        userId: encodedUserId,
        sessionId: encodedSessionId,
    };

    const refreshToken = jwt.sign(refreshTokenPayload, ctx.config.tokenPrivateKey, {
        algorithm: SIGNATURE_ALGORITHM,
    });

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
