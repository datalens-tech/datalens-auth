import {Request, Response} from '@gravity-ui/expresskit';
import jwt from 'jsonwebtoken';

import {AUTH_COOKIE_NAME, AUTH_EXP_COOKIE_NAME} from '../constants/cookie';
import {AccessTokenPayload} from '../types/token';
import type {Optional} from '../utils/utility-types';

type Tokens = {accessToken: string; refreshToken: string};
type SameSite = boolean | 'lax' | 'strict' | 'none';

const LOCALHOST = ['localhost', '127.0.0.1', '[::1]'];
const LOCALHOST_WILDCARD = '.localhost'; // RFC-6761: https://www.rfc-editor.org/rfc/rfc6761.html#section-6.3
const ONE_HOUR = 60 * 60 * 1000;
const SAME_SITE_MODE = ['strict', 'lax', 'none'];

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

    const baseCookieOptions = getBaseCookieOptions(req);

    res.cookie(
        AUTH_COOKIE_NAME,
        JSON.stringify({
            accessToken,
            refreshToken,
        }),
        {
            ...baseCookieOptions,
            httpOnly: true,
            maxAge,
        },
    );

    const {exp} = jwt.decode(accessToken) as AccessTokenPayload;

    res.cookie(AUTH_EXP_COOKIE_NAME, exp, {
        ...baseCookieOptions,
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
    const baseCookieOptions = getBaseCookieOptions(req);

    res.clearCookie(AUTH_COOKIE_NAME, {
        ...baseCookieOptions,
        httpOnly: true,
    }).clearCookie(AUTH_EXP_COOKIE_NAME, {...baseCookieOptions, httpOnly: false});
};

export function getBaseCookieOptions(req: Request) {
    const disableWildcardCookie = Boolean(req.ctx.config.disableWildcardCookie);
    const cookieSameSiteMode = req.ctx.config.cookieSameSiteMode;

    const uiAppEndpoint = req.ctx.config.uiAppEndpoint || '';
    const uiAppHostname = new URL(uiAppEndpoint, 'http://localhost').hostname;

    const isCookieWithoutDomain =
        LOCALHOST.includes(uiAppHostname) ||
        uiAppHostname.endsWith(LOCALHOST_WILDCARD) ||
        disableWildcardCookie;

    const secure = Boolean(
        uiAppEndpoint ? uiAppEndpoint.startsWith('https') : req.protocol === 'https',
    );
    let domain = isCookieWithoutDomain ? undefined : uiAppHostname;

    if (disableWildcardCookie && uiAppEndpoint && uiAppHostname !== req.hostname) {
        // prevent set cookie to any domain, if uiAppEndpoint is set and uiAppEndpoint is not equal to hostname
        domain = uiAppHostname;
    }

    let sameSite: SameSite = true;
    if (cookieSameSiteMode && SAME_SITE_MODE.includes(cookieSameSiteMode)) {
        sameSite = cookieSameSiteMode as SameSite;
    }

    return {
        secure,
        path: '/',
        sameSite,
        domain,
    };
}
