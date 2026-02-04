import setCookieParser from 'set-cookie-parser';
import request from 'supertest';

import {getAuthCookieName, getAuthExpCookieName} from '../../../../../components/cookies';
import {JwtAuth} from '../../../../../components/jwt-auth';
import {SET_COOKIE_HEADER} from '../../../../../constants/header';
import {AUTH_ERROR, app, appConfig, appCtx, auth} from '../../../auth';
import {testUserLogin, testUserPassword} from '../../../constants';
import {makeRoute} from '../../../routes';

let savedCookies: string[];
let accessToken: string;
const EXTRA_TIME = 2000; // 2 sec

function checkSettedCookies(responseHeader: Record<string, string | string[]>, save = false) {
    const setCookieHeader = responseHeader[SET_COOKIE_HEADER] as string[];

    expect(Array.isArray(setCookieHeader)).toBe(true);

    const settedCookies = setCookieParser.parse(setCookieHeader);
    const authCookies = settedCookies.filter((cookie) =>
        [getAuthCookieName(appCtx), getAuthExpCookieName(appCtx)].includes(cookie.name),
    );

    expect(authCookies.length).toBe(2);

    let cookieAccessToken = '';

    authCookies.forEach((cookie) => {
        const parsedCookie = JSON.parse(cookie.value);
        if (cookie.name === getAuthExpCookieName(appCtx)) {
            expect(parsedCookie).toStrictEqual(expect.any(Number));
        }
        if (cookie.name === getAuthCookieName(appCtx)) {
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
        savedCookies = setCookieHeader;
        accessToken = cookieAccessToken;
    }

    return {savedCookies: setCookieHeader, accessToken: cookieAccessToken};
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

        const failureRedirect = '/signin-fail';
        const setCookieHeader = response.header[SET_COOKIE_HEADER];

        expect(response.header['location']).toBe(failureRedirect);
        expect(Array.isArray(setCookieHeader)).toBe(false);
        expect(response.status).toBe(302);
    });

    test('Sign up', async () => {
        const response = await request(app).post(makeRoute('signup')).send({
            login: testUserLogin,
            password: testUserPassword,
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});

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

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});

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
        expect(response.body?.code).toBe(AUTH_ERROR.NEED_RESET);

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

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
        const setCookieHeader = response.header[SET_COOKIE_HEADER] as unknown as string[];
        expect(Array.isArray(setCookieHeader)).toBe(true);

        const settedCookies = setCookieParser.parse(setCookieHeader);
        const authCookies = settedCookies.filter((cookie) =>
            [getAuthCookieName(appCtx), getAuthExpCookieName(appCtx)].includes(cookie.name),
        );
        expect(authCookies.length).toBe(4); // 2 with params, 2 without params

        authCookies.forEach((cookie) => {
            expect(cookie.value).toStrictEqual('');
        });

        savedCookies = setCookieHeader;
    });

    test('Failed to refresh token after logout', async () => {
        const response = await request(app).post(makeRoute('refresh')).set('Cookie', savedCookies);
        expect(response.status).toBe(401);
        expect(response.body?.code).toBe(AUTH_ERROR.NEED_RESET);
    });

    test('Access token is valid after logout until it expires', async () => {
        await auth(request(app).get(makeRoute('home')), {accessToken}).expect(200);

        const {accessTokenTTL} = appConfig;
        jest.useFakeTimers().setSystemTime(
            new Date(Date.now() + accessTokenTTL * 1000 + EXTRA_TIME),
        );

        await auth(request(app).get(makeRoute('home')), {accessToken}).expect(401);

        jest.useRealTimers();
    });

    test('Compromised session', async () => {
        const singinResponse = await request(app).post(makeRoute('signin')).send({
            login: testUserLogin,
            password: testUserPassword,
        });
        expect(singinResponse.status).toBe(200);
        expect(singinResponse.body).toStrictEqual({done: true});
        const signinData = checkSettedCookies(singinResponse.header, false);

        let refreshResponse = await request(app)
            .post(makeRoute('refresh'))
            .set('Cookie', signinData.savedCookies);
        expect(refreshResponse.status).toBe(200);
        let refreshedData = checkSettedCookies(refreshResponse.header, false);

        // call with singin refresh token
        await request(app)
            .post(makeRoute('refresh'))
            .set('Cookie', signinData.savedCookies)
            .expect(401);

        // call with actual refresh token
        refreshResponse = await request(app)
            .post(makeRoute('refresh'))
            .set('Cookie', refreshedData.savedCookies);
        expect(refreshResponse.status).toBe(200);
        refreshedData = checkSettedCookies(refreshResponse.header, false);

        // call with singin refresh token and changed ip
        await request(app)
            .post(makeRoute('refresh'))
            .set('Cookie', signinData.savedCookies)
            .set('X-Forwarded-For', '92.168.190.25')
            .expect(401);

        // failed to refresh because session was deleted
        refreshResponse = await request(app)
            .post(makeRoute('refresh'))
            .set('Cookie', refreshedData.savedCookies)
            .expect(401);
    });

    test('signin-fail route', async () => {
        const response = await request(app).get('/signin-fail');

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({message: 'Forbidden'});
    });
});
