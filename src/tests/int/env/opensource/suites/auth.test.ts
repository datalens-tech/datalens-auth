import setCookieParser from 'set-cookie-parser';
import request from 'supertest';

import {JwtAuth} from '../../../../../components/jwt-auth';
import {AUTH_COOKIE_NAME, AUTH_EXP_COOKIE_NAME} from '../../../../../constants/cookie';
import {SET_COOKIE_HEADER} from '../../../../../constants/header';
import {app, appConfig, appCtx, auth} from '../../../auth';
import {testUserLogin, testUserPassword} from '../../../constants';
import {makeRoute} from '../../../routes';

let savedCookies: string[];
let accessToken: string;
const EXTRA_TIME = 2000; // 2 sec

function checkSettedCookies(responseHeader: Record<string, string | string[]>, save = false) {
    const setCookieHeader = responseHeader[SET_COOKIE_HEADER];

    expect(Array.isArray(setCookieHeader)).toBe(true);

    const settedCookies = setCookieParser.parse(setCookieHeader);
    const authCookies = settedCookies.filter((cookie) =>
        [AUTH_COOKIE_NAME, AUTH_EXP_COOKIE_NAME].includes(cookie.name),
    );

    expect(authCookies.length).toBe(2);

    let cookieAccessToken = '';

    authCookies.forEach((cookie) => {
        const parsedCookie = JSON.parse(cookie.value);
        if (cookie.name === AUTH_EXP_COOKIE_NAME) {
            expect(parsedCookie).toStrictEqual(expect.any(Number));
        }
        if (cookie.name === AUTH_COOKIE_NAME) {
            expect(parsedCookie).toStrictEqual({
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
            });
            cookieAccessToken = parsedCookie.accessToken;
            let accessTokenPayload = {};
            let refreshTokenPayload = {};
            try {
                accessTokenPayload = JwtAuth.verifyAccessToken({
                    ctx: appCtx,
                    accessToken: parsedCookie.accessToken,
                });
                refreshTokenPayload = JwtAuth.verifyRefreshToken({
                    ctx: appCtx,
                    refreshToken: parsedCookie.refreshToken,
                });
            } catch {}

            expect(accessTokenPayload).toStrictEqual({
                exp: expect.any(Number),
                iat: expect.any(Number),
                userId: expect.any(String),
                sessionId: expect.any(String),
                roles: [appConfig.defaultRole],
            });

            expect(refreshTokenPayload).toStrictEqual({
                iat: expect.any(Number),
                userId: expect.any(String),
                sessionId: expect.any(String),
                refreshTokenId: expect.any(String),
            });
        }
    });

    if (save) {
        savedCookies = setCookieHeader as string[];
        accessToken = cookieAccessToken;
    }
}

describe('Auth', () => {
    test('Failed to call api with wrong access token', async () => {
        await auth(request(app).get(makeRoute('home')), {accessToken: 'wrong token'}).expect(401);
    });

    test('Failed to sign in without sign up', async () => {
        const response = await request(app).post(makeRoute('signin')).send({
            login: testUserLogin,
            password: testUserPassword,
        });

        const failureRedirect = '/signin';
        const setCookieHeader = response.header[SET_COOKIE_HEADER];

        expect(response.header['location']).toBe(failureRedirect);
        expect(Array.isArray(setCookieHeader)).toBe(false);
        expect(response.status).toBe(302);
    });

    test('Sign up', async () => {
        const response = await request(app).post(makeRoute('signup')).send({
            login: testUserLogin,
            displayName: testUserLogin,
            password: testUserPassword,
        });

        expect(response.header['location']).toBe('/');
        expect(response.status).toBe(302);

        checkSettedCookies(response.header, true);
    });

    test('Can call api after sign up', async () => {
        await auth(request(app).get(makeRoute('home')), {accessToken}).expect(200);
    });

    test('Sign in', async () => {
        const response = await request(app).post(makeRoute('signin')).send({
            login: testUserLogin,
            password: testUserPassword,
        });

        expect(response.header['location']).toBe('/');
        expect(response.status).toBe(302);

        checkSettedCookies(response.header, true);
    });

    test('Can call api after sign in', async () => {
        await auth(request(app).get(makeRoute('home')), {accessToken}).expect(200);
    });

    test('Failed to refresh token without cookies', async () => {
        await request(app).post(makeRoute('refresh')).expect(401);
    });

    test('Refresh token', async () => {
        const response = await request(app).post(makeRoute('refresh')).set('Cookie', savedCookies);

        expect(response.status).toBe(200);
        checkSettedCookies(response.header, true);

        await auth(request(app).get(makeRoute('home')), {accessToken}).expect(200);
    });

    test('Failed to refresh token when time refreshTokenTTL expired', async () => {
        const {refreshTokenTTL} = appConfig;
        jest.useFakeTimers().setSystemTime(
            new Date(Date.now() + refreshTokenTTL * 1000 + EXTRA_TIME),
        );

        const response = await request(app).post(makeRoute('refresh')).set('Cookie', savedCookies);
        expect(response.status).toBe(401);

        jest.useRealTimers();
    });

    test('Failed to refresh token when time sessionTTL expired', async () => {
        const {sessionTTL} = appConfig;
        jest.useFakeTimers().setSystemTime(new Date(Date.now() + sessionTTL * 1000 + EXTRA_TIME));

        const response = await request(app).post(makeRoute('refresh')).set('Cookie', savedCookies);
        expect(response.status).toBe(401);

        jest.useRealTimers();
    });

    test('Logout', async () => {
        await auth(request(app).get(makeRoute('home')), {accessToken}).expect(200);

        const response = await request(app).get(makeRoute('logout')).set('Cookie', savedCookies);

        expect(response.header['location']).toBe('/');
        expect(response.status).toBe(302);
        const setCookieHeader = response.header[SET_COOKIE_HEADER] as unknown as string[];
        expect(Array.isArray(setCookieHeader)).toBe(true);

        const settedCookies = setCookieParser.parse(setCookieHeader);
        const authCookies = settedCookies.filter((cookie) =>
            [AUTH_COOKIE_NAME, AUTH_EXP_COOKIE_NAME].includes(cookie.name),
        );
        expect(authCookies.length).toBe(2);

        authCookies.forEach((cookie) => {
            expect(cookie.value).toStrictEqual('');
        });

        savedCookies = setCookieHeader;
    });

    test('Failed to refresh token after logout', async () => {
        const response = await request(app).post(makeRoute('refresh')).set('Cookie', savedCookies);
        expect(response.status).toBe(401);
    });

    test('Access token is valid after logout when time expired', async () => {
        await auth(request(app).get(makeRoute('home')), {accessToken}).expect(200);

        const {accessTokenTTL} = appConfig;
        jest.useFakeTimers().setSystemTime(
            new Date(Date.now() + accessTokenTTL * 1000 + EXTRA_TIME),
        );

        await auth(request(app).get(makeRoute('home')), {accessToken}).expect(401);

        jest.useRealTimers();
    });
});
