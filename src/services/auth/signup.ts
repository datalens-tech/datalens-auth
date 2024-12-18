import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {JwtAuth} from '../../components/jwt-auth';
import {hashPassword} from '../../components/passwords';
import {makeSchemaValidator} from '../../components/validation/validation-schema-compiler';
import {AUTH_ERROR} from '../../constants/error-constants';
import {LOCAL_IDENTITY_ID} from '../../db/constants/id';
import {UserModel, UserModelColumn} from '../../db/models/user';
import {getPrimary, getReplica} from '../../db/utils/db';
import {makeCombinedUserId} from '../../db/utils/id';
import {ServiceArgs} from '../../types/service';
import {encodeId} from '../../utils/ids';
import {Nullable, Optional} from '../../utils/utility-types';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['login', 'displayName', 'password', 'userIp'],
    properties: {
        login: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
        },
        displayName: {
            type: 'string',
            minLength: 1,
            maxLength: 1000,
        },
        password: {
            type: 'string',
            verifyPassword: true,
        },
        userAgent: {
            type: 'string',
        },
        userIp: {
            type: ['string', 'null'],
        },
    },
});

export interface SignupArgs {
    login: string;
    displayName: string;
    password: string;
    userAgent: Optional<string>;
    userIp: Nullable<string>;
}

export const signup = async ({ctx, trx, skipValidation = false}: ServiceArgs, args: SignupArgs) => {
    const {login, displayName, password, userAgent, userIp} = args;

    const registry = ctx.get('registry');
    const {getId} = registry.getDbInstance();

    ctx.log('SIGNUP');

    if (!skipValidation) {
        validateArgs(args);
    }
    const user = await UserModel.query(getReplica(trx))
        .select(UserModelColumn.UserId)
        .where(UserModelColumn.Login, login)
        .first()
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    if (user) {
        throw new AppError('User already exists', {code: AUTH_ERROR.USER_ALREADY_EXISTS});
    }

    const hashedPassword = await hashPassword(password);

    const localUserId = await getId();
    const encodedLocalUserId = encodeId(localUserId);
    const userId = makeCombinedUserId({
        userId: encodedLocalUserId,
        identityId: LOCAL_IDENTITY_ID,
    });

    const result = await transaction(getPrimary(trx), async (transactionTrx) => {
        await UserModel.query(transactionTrx)
            .insert({
                [UserModelColumn.UserId]: userId,
                [UserModelColumn.DisplayName]: displayName,
                [UserModelColumn.Login]: login,
                [UserModelColumn.Password]: hashedPassword,
            })
            .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

        const tokens = await JwtAuth.startSession(
            {ctx, trx: transactionTrx},
            {
                userId,
                userAgent,
                userIp,
            },
        );

        return tokens;
    });

    ctx.log('SIGNUP_SUCCESS');

    return result;
};
