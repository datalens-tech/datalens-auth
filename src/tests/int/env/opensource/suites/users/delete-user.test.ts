import request from 'supertest';

import {encodeId} from '../../../../../../utils/ids';
import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

describe('Delete user', () => {
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
        const response = await request(app).delete(
            makeRoute('deleteUser', {userId: encodeId(admin.userId)}),
        );
        expect(response.status).toBe(401);
    });

    test("User can't delete the user", async () => {
        const response = await auth(
            request(app).delete(makeRoute('deleteUser', {userId: encodeId(admin.userId)})),
            {
                accessToken: userTokens.accessToken,
            },
        );

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test('Admin can delete the user', async () => {
        const response = await auth(
            request(app).delete(makeRoute('deleteUser', {userId: encodeId(user.userId)})),
            {
                accessToken: adminTokens.accessToken,
            },
        );
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});

        const responseProfile = await auth(
            request(app).get(makeRoute('getUserProfile', {userId: encodeId(user.userId)})),
            {
                accessToken: adminTokens.accessToken,
            },
        );
        expect(responseProfile.status).toBe(404);
        expect(responseProfile.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.USER_NOT_EXISTS,
        });
    });

    test('Admin can delete yourself', async () => {
        const response = await auth(
            request(app).delete(makeRoute('deleteUser', {userId: encodeId(admin.userId)})),
            {
                accessToken: adminTokens.accessToken,
            },
        );
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});

        const responseProfile = await auth(
            request(app).get(makeRoute('getUserProfile', {userId: encodeId(admin.userId)})),
            {
                accessToken: adminTokens.accessToken,
            },
        );
        expect(responseProfile.status).toBe(404);
        expect(responseProfile.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.USER_NOT_EXISTS,
        });
    });
});
