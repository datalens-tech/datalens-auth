import {z} from '../../components/zod';
import {AUTH_COOKIE_NAME, AUTH_EXP_COOKIE_NAME} from '../../constants/cookie';
import {AUTHORIZATION_HEADER, SET_COOKIE_HEADER} from '../../constants/header';

export const cookieHeaderSchema = z
    .strictObject({
        cookie: z.string(),
    })
    .describe(`Auth cookie: ${AUTH_COOKIE_NAME}, ${AUTH_EXP_COOKIE_NAME}`);

export const setCookieHeaderSchema = z
    .strictObject({
        [SET_COOKIE_HEADER]: z.string(),
    })
    .describe(`Set auth cookie: ${AUTH_COOKIE_NAME}, ${AUTH_EXP_COOKIE_NAME}`);

export const autorizationHeaderSchema = z
    .strictObject({
        [AUTHORIZATION_HEADER]: z.string(),
    })
    .describe('Autorization header: [Bearer <token>]');
