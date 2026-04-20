import request from 'supertest';

import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

describe('Delete service account', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    let saToDeleteId: string;
    let saToVerifyId: string;

    beforeAll(async () => {
        admin = await createTestUsers({roles: [UserRole.Admin], login: 'delete-sa-admin'});
        user = await createTestUsers({login: 'delete-sa-user'});

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});

        const r1 = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({name: 'delete-sa-target', roles: [UserRole.Viewer]});
        saToDeleteId = r1.body.serviceAccountId;

        const r2 = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({name: 'delete-sa-verify', roles: [UserRole.Viewer]});
        saToVerifyId = r2.body.serviceAccountId;
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

    test("Can't delete service account with invalid ID", async () => {
        const response = await auth(
            request(app).delete(
                makeRoute('deleteServiceAccount', {serviceAccountId: saToVerifyId}).replace(
                    saToVerifyId,
                    'not-a-valid-id',
                ),
            ),
            {accessToken: adminTokens.accessToken},
        );

        expect(response.status).toBe(400);
    });
});
