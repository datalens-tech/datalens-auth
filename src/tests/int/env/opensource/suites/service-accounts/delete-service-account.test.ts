import request from 'supertest';

import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestServiceAccount, createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

describe('Delete service account', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    let saToDeleteId: string;

    beforeAll(async () => {
        admin = await createTestUsers({roles: [UserRole.Admin], login: 'delete-sa-admin'});
        user = await createTestUsers({login: 'delete-sa-user'});

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});

        saToDeleteId = await createTestServiceAccount({
            accessToken: adminTokens.accessToken,
            name: 'delete-sa-target',
            roles: [UserRole.Viewer],
        });
    });

    test('Access denied without token', async () => {
        const response = await request(app).delete(
            makeRoute('deleteServiceAccount', {serviceAccountId: saToDeleteId}),
        );

        expect(response.status).toBe(401);
    });

    test("User can't delete service account", async () => {
        const response = await auth(
            request(app).delete(
                makeRoute('deleteServiceAccount', {serviceAccountId: saToDeleteId}),
            ),
            {accessToken: userTokens.accessToken},
        );

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test('Admin can delete service account', async () => {
        const response = await auth(
            request(app).delete(
                makeRoute('deleteServiceAccount', {serviceAccountId: saToDeleteId}),
            ),
            {accessToken: adminTokens.accessToken},
        );

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
    });

    test('Deleted service account no longer appears in list', async () => {
        const listResponse = await auth(request(app).get(makeRoute('listServiceAccounts')), {
            accessToken: adminTokens.accessToken,
        });

        expect(listResponse.status).toBe(200);

        const found = listResponse.body.serviceAccounts.find(
            (sa: {serviceAccountId: string}) => sa.serviceAccountId === saToDeleteId,
        );

        expect(found).toBeUndefined();
    });

    test("Can't delete non-existent service account", async () => {
        const response = await auth(
            request(app).delete(
                makeRoute('deleteServiceAccount', {serviceAccountId: saToDeleteId}),
            ),
            {accessToken: adminTokens.accessToken},
        );

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    });
});
