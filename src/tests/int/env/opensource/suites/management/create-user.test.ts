import request from 'supertest';

import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {testUserPassword} from '../../../../constants';
import {createTestUsers, generateTokens, isBigIntId} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

describe('Create user', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    beforeAll(async () => {
        admin = await createTestUsers({roles: [UserRole.Admin]});
        user = await createTestUsers({login: 'test-user'});

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});
    });

    test('Access denied without the token', async () => {
        const response = await request(app).post(makeRoute('createUser')).send({
            login: 'new-login',
            password: testUserPassword,
        });

        expect(response.status).toBe(401);
    });

    test('Admin can create user', async () => {
        const response = await auth(request(app).post(makeRoute('createUser')), {
            accessToken: adminTokens.accessToken,
        }).send({
            login: 'new-login',
            password: testUserPassword,
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({userId: expect.any(String)});

        expect(isBigIntId(response.body?.userId)).toBe(false);
    });

    test('Admin can create user with roles', async () => {
        const response = await auth(request(app).post(makeRoute('createUser')), {
            accessToken: adminTokens.accessToken,
        }).send({
            login: 'new-login-2',
            password: testUserPassword,
            email: 'new-login-2@some.ru',
            firstName: 'New',
            lastName: 'Login 2',
            roles: [UserRole.Editor],
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({userId: expect.any(String)});

        expect(isBigIntId(response.body?.userId)).toBe(false);
    });

    test("Admin can't create user with the same login", async () => {
        const response = await auth(request(app).post(makeRoute('createUser')), {
            accessToken: adminTokens.accessToken,
        }).send({
            login: 'new-login',
            password: testUserPassword,
        });

        expect(response.status).toBe(409);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.USER_ALREADY_EXISTS,
        });
    });

    test("Admin can't create user without body", async () => {
        const response = await auth(request(app).post(makeRoute('createUser')), {
            accessToken: adminTokens.accessToken,
        }).send({});

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.VALIDATION_ERROR,
            details: expect.any(Array),
        });
    });

    test("User can't create new user", async () => {
        const response = await auth(request(app).post(makeRoute('createUser')), {
            accessToken: userTokens.accessToken,
        }).send({
            login: 'another-login',
            password: testUserPassword,
        });

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });
});
