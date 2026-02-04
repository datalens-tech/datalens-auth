import {Request, Response} from '@gravity-ui/expresskit';
import type {AppContext} from '@gravity-ui/nodekit';
import {AppError} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';

import {AUTH_DEFAULT_COOKIE_NAME} from '../constants/cookie';
import {AUTH_ERROR} from '../constants/error-constants';
import {AccessTokenPayload} from '../types/token';
import type {Optional} from '../utils/utility-types';

type Tokens = {accessToken: string; refreshToken: string};
type SameSite = boolean | 'lax' | 'strict' | 'none';

const LOCALHOST = ['localhost', '127.0.0.1', '[::1]'];
const LOCALHOST_WILDCARD = '.localhost'; // RFC-6761: https://www.rfc-editor.org/rfc/rfc6761.html#section-6.3
const ONE_HOUR = 60 * 60 * 1000;
const SAME_SITE_MODE = ['strict', 'lax', 'none'];

function isSubdomainOrEqual({domain, subdomain}: {domain: string; subdomain: string}): boolean {
    if (domain === subdomain) {
        return true;
    }
    return domain.endsWith(`.${subdomain}`);
}

export const generateCookieName = (ctx: AppContext, postfix?: string) => {
    const baseCookieName = ctx.config.authCookieName || AUTH_DEFAULT_COOKIE_NAME;
    return baseCookieName + (postfix ? `_${postfix}` : '');
};

export const getAuthCookieName = (ctx: AppContext) => generateCookieName(ctx);
export const getAuthExpCookieName = (ctx: AppContext) => generateCookieName(ctx, 'exp');

export const setAuthCookie = ({
    req,
    res,
    tokens,
}: {
    req: Request;
    res: Response;
    tokens: Tokens;
}) => {
    const ctx = req.ctx;
    const {accessToken, refreshToken} = tokens;
    const refreshTokenTTLSec = ctx.config.refreshTokenTTL;
    const maxAge = refreshTokenTTLSec * 1000 + ONE_HOUR;

    const baseCookieOptions = getBaseCookieOptions(req);

    res.cookie(
        getAuthCookieName(ctx),
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

    res.cookie(getAuthExpCookieName(ctx), exp, {
        ...baseCookieOptions,
        httpOnly: false,
        maxAge,
    });
};

export const getAuthCookies = (req: Request) => {
    const ctx = req.ctx;
    const authCookie = req.cookies[getAuthCookieName(ctx)] as Optional<string>;
    const authExpCookie = req.cookies[getAuthExpCookieName(ctx)] as Optional<string>;

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
    const ctx = req.ctx;
    const baseCookieOptions = getBaseCookieOptions(req);
    const authCookieName = getAuthCookieName(ctx);
    const authExpCookieName = getAuthExpCookieName(ctx);

    res.clearCookie(authCookieName, {
        ...baseCookieOptions,
        httpOnly: true,
    })
        .clearCookie(authExpCookieName, {...baseCookieOptions, httpOnly: false})
        .clearCookie(authCookieName) // without params for correct clear if any params was changed
        .clearCookie(authExpCookieName); // without params for correct clear if any params was changed
};

export function getBaseCookieOptions(req: Request) {
    const disableWildcardCookie = Boolean(req.ctx.config.disableWildcardCookie);
    const cookieSameSiteMode = req.ctx.config.cookieSameSiteMode;

    const uiAppEndpoint = req.ctx.config.uiAppEndpoint || '';
    const uiAppHostname = new URL(uiAppEndpoint, 'http://localhost').hostname;

    const authCookieEndpoint = req.ctx.config.authCookieEndpoint;
    let targetHostname = uiAppHostname;

    if (authCookieEndpoint) {
        const authCookieHostname = new URL(authCookieEndpoint, 'http://localhost').hostname;

        if (!isSubdomainOrEqual({domain: uiAppHostname, subdomain: authCookieHostname})) {
            throw new AppError(AUTH_ERROR.INVALID_AUTH_COOKIE_ENDPOINT, {
                code: AUTH_ERROR.INVALID_AUTH_COOKIE_ENDPOINT,
            });
        }

        targetHostname = authCookieHostname;
    }

    const isCookieWithoutDomain =
        LOCALHOST.includes(targetHostname) ||
        targetHostname.endsWith(LOCALHOST_WILDCARD) ||
        disableWildcardCookie;

    let originUrl: URL | undefined;

    if (req.headers.origin) {
        // check header origin for get real request domain and protocol
        originUrl = new URL(req.headers.origin, 'http://localhost');
    }

    const secure = Boolean(
        uiAppEndpoint ? uiAppEndpoint.startsWith('https') : originUrl?.protocol === 'https',
    );
    let domain = isCookieWithoutDomain ? undefined : targetHostname;

    if (
        disableWildcardCookie &&
        uiAppEndpoint &&
        originUrl?.hostname &&
        uiAppHostname !== originUrl?.hostname
    ) {
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
