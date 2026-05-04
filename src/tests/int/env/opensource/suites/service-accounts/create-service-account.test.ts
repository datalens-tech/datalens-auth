import request from 'supertest';

import {USER_TYPE} from '../../../../../../constants/user';
import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

describe('Create service account', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    beforeAll(async () => {
        admin = await createTestUsers({roles: [UserRole.Admin], login: 'create-sa-admin'});
        user = await createTestUsers({login: 'create-sa-user'});

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});
    });

    test('Access denied without token', async () => {
        const response = await request(app)
            .post(makeRoute('createServiceAccount'))
            .send({
                name: 'test-sa',
                roles: [UserRole.Viewer],
            });

        expect(response.status).toBe(401);
    });

    test("User can't create service account", async () => {
        const response = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: userTokens.accessToken,
        }).send({
            name: 'test-sa',
            roles: [UserRole.Viewer],
        });

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test('Admin can create service account', async () => {
        const response = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({
            name: 'create-sa-basic',
            roles: [UserRole.Viewer, UserRole.Editor],
        });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            userId: expect.any(String),
            name: 'create-sa-basic',
            type: USER_TYPE.SERVICE_ACCOUNT,
        });
    });

    test("Can't create service account with duplicate name", async () => {
        const response = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({
            name: 'create-sa-basic',
            roles: [UserRole.Viewer],
        });

        expect(response.status).toBe(409);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.SERVICE_ACCOUNT_NAME_EXISTS,
        });
    });

    test("Can't create service account without body", async () => {
        const response = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({});

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.VALIDATION_ERROR,
            details: expect.any(Array),
        });
    });

    test("Can't create service account without roles", async () => {
        const response = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({
            name: 'create-sa-no-roles',
        });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.VALIDATION_ERROR,
            details: expect.any(Array),
        });
    });

    test("Can't create service account with empty roles array", async () => {
        const response = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({
            name: 'create-sa-empty-roles',
            roles: [],
        });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.VALIDATION_ERROR,
            details: expect.any(Array),
        });
    });
});
