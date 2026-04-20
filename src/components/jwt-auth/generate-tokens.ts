import jwt from 'jsonwebtoken';
import {raw} from 'objection';

import {RefreshTokenModel} from '../../db/models/refresh-token';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import type {BigIntId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';
import {encodeId} from '../../utils/ids';

const algorithm = 'PS256';

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
