import {z} from '../../components/zod';
import {AUTHORIZATION_HEADER, SET_COOKIE_HEADER} from '../../constants/header';

export const cookieHeaderSchema = z
    .strictObject({
        cookie: z.string(),
    })
    .describe('Auth cookie');

export const setCookieHeaderSchema = z
    .strictObject({
        [SET_COOKIE_HEADER]: z.string(),
    })
    .describe('Set auth cookie');

export const autorizationHeaderSchema = z
    .strictObject({
        [AUTHORIZATION_HEADER]: z.string(),
    })
    .describe('Autorization header: [Bearer <token>]');
