import {Request, Response} from '@gravity-ui/expresskit';
import {AppContext} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';

import {AUTH_COOKIE_NAME, AUTH_EXP_COOKIE_NAME} from '../constants/cookie';
import {AccessTokenPayload} from '../types/token';
import type {Optional} from '../utils/utility-types';

type Tokens = {accessToken: string; refreshToken: string};

const LOCALHOST = ['localhost', '127.0.0.1', '[::1]'];
const ONE_HOUR = 60 * 60 * 1000;

export const setAuthCookie = ({
    req,
    res,
    tokens,
}: {
    req: Request;
    res: Response;
    tokens: Tokens;
}) => {
    const {accessToken, refreshToken} = tokens;
    const refreshTokenTTLSec = req.ctx.config.refreshTokenTTL;
    const maxAge = refreshTokenTTLSec * 1000 + ONE_HOUR;

    const baseCoookieOptions = getBaseCookieOptions(req.ctx);

    res.cookie(
        AUTH_COOKIE_NAME,
        JSON.stringify({
            accessToken,
            refreshToken,
        }),
        {
            ...baseCoookieOptions,
            httpOnly: true,
            maxAge,
        },
    );

    const {exp} = jwt.decode(accessToken) as AccessTokenPayload;

    res.cookie(AUTH_EXP_COOKIE_NAME, exp, {
        ...baseCoookieOptions,
        httpOnly: false,
        maxAge,
    });
};

export const getAuthCookies = (req: Request) => {
    const authCookie = req.cookies[AUTH_COOKIE_NAME] as Optional<string>;
    const authExpCookie = req.cookies[AUTH_EXP_COOKIE_NAME] as Optional<string>;

    let parsedAuthCookie: Optional<Tokens>;
    if (authCookie) {
        try {
            parsedAuthCookie = JSON.parse(authCookie) as Tokens;
        } catch (err) {
            req.ctx.logError('Failed to parse auth cookie', err);
        }
    }

    let parsedAuthExpCookie: Optional<number>;
    if (authExpCookie) {
        parsedAuthExpCookie = Number(authExpCookie);
    }

    return {
        authCookie: parsedAuthCookie,
        authExpCookie: parsedAuthExpCookie,
    };
};

export const clearAuthCookies = (req: Request, res: Response) => {
    const baseCoookieOptions = getBaseCookieOptions(req.ctx);

    res.clearCookie(AUTH_COOKIE_NAME, {
        ...baseCoookieOptions,
        httpOnly: true,
    }).clearCookie(AUTH_EXP_COOKIE_NAME, {...baseCoookieOptions, httpOnly: false});
};

function getBaseCookieOptions(ctx: AppContext) {
    const uiAppEndpoint = ctx.config.uiAppEndpoint || '';
    const uiAppHostname = new URL(uiAppEndpoint, 'http://localhost').hostname;

    const secure = Boolean(uiAppEndpoint.startsWith('https'));
    const domain = LOCALHOST.includes(uiAppHostname) ? undefined : uiAppHostname;

    return {
        secure,
        path: '/',
        sameSite: true,
        domain,
    };
}
