import request from 'supertest';

import usApp from '../..';
import {
    AUTHORIZATION_HEADER,
    AUTHORIZATION_HEADER_VALUE_PREFIX,
    MASTER_TOKEN_HEADER,
} from '../../constants/header';

export {AUTH_ERROR} from '../../constants/error-constants';
export {UserRole} from '../../constants/role';

export type AuthArgs = {
    accessToken: string;
};

export {MASTER_TOKEN_HEADER};
export const app = usApp.express;
export const appConfig = usApp.config;
export const appCtx = usApp.nodekit.ctx;

export const authMasterToken = (req: request.Test) => {
    const token = process.env.MASTER_TOKEN_HEADER ?? '';
    req.set(MASTER_TOKEN_HEADER, token);
    return req;
};

export const auth = (req: request.Test, args: AuthArgs) => {
    const {accessToken} = args;
    req.set(AUTHORIZATION_HEADER, `${AUTHORIZATION_HEADER_VALUE_PREFIX} ${accessToken}`);
    return req;
};
