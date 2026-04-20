import request from 'supertest';

import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestUsers, generateTokens, isBigIntId} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

describe('Service account keys', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    let saId: string;
    let nonExistentSaId: string;

    beforeAll(async () => {
        admin = await createTestUsers({roles: [UserRole.Admin], login: 'keys-sa-admin'});
        user = await createTestUsers({login: 'keys-sa-user'});

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});

        const saResp = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({name: 'keys-sa-fixture', roles: [UserRole.Viewer]});
        saId = saResp.body.serviceAccountId;

        const deletedResp = await auth(request(app).post(makeRoute('createServiceAccount')), {
            accessToken: adminTokens.accessToken,
        }).send({name: 'keys-sa-deleted', roles: [UserRole.Viewer]});
        nonExistentSaId = deletedResp.body.serviceAccountId;

        await auth(
            request(app).delete(
                makeRoute('deleteServiceAccount', {serviceAccountId: nonExistentSaId}),
            ),
            {accessToken: adminTokens.accessToken},
        );
    });

    describe('Create key', () => {
        test('Access denied without token', async () => {
            const response = await request(app).post(
                makeRoute('createServiceAccountKey', {serviceAccountId: saId}),
            );

            expect(response.status).toBe(401);
        });

        test("User can't create key", async () => {
            const response = await auth(
                request(app).post(makeRoute('createServiceAccountKey', {serviceAccountId: saId})),
                {accessToken: userTokens.accessToken},
            );

            expect(response.status).toBe(403);
            expect(response.body).toStrictEqual({
                message: expect.any(String),
                code: AUTH_ERROR.ACCESS_DENIED,
            });
        });

        test('Admin can create key', async () => {
            const response = await auth(
                request(app).post(makeRoute('createServiceAccountKey', {serviceAccountId: saId})),
                {accessToken: adminTokens.accessToken},
            );

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({
                keyId: expect.any(String),
                privateKey: expect.any(String),
            });
            expect(isBigIntId(response.body.keyId)).toBe(false);
            expect(response.body.privateKey).toContain('BEGIN PRIVATE KEY');
        });

        test("Can't create key for non-existent service account", async () => {
            const response = await auth(
                request(app).post(
                    makeRoute('createServiceAccountKey', {serviceAccountId: nonExistentSaId}),
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

    describe('List keys', () => {
        let keyId: string;

        beforeAll(async () => {
            const keyResp = await auth(
                request(app).post(makeRoute('createServiceAccountKey', {serviceAccountId: saId})),
                {accessToken: adminTokens.accessToken},
            );
            keyId = keyResp.body.keyId;
        });

        test('Access denied without token', async () => {
            const response = await request(app).get(
                makeRoute('listServiceAccountKeys', {serviceAccountId: saId}),
            );

            expect(response.status).toBe(401);
        });

        test("User can't list keys", async () => {
            const response = await auth(
                request(app).get(makeRoute('listServiceAccountKeys', {serviceAccountId: saId})),
                {accessToken: userTokens.accessToken},
            );

            expect(response.status).toBe(403);
            expect(response.body).toStrictEqual({
                message: expect.any(String),
                code: AUTH_ERROR.ACCESS_DENIED,
            });
        });

        test('Admin can list keys', async () => {
            const response = await auth(
                request(app).get(makeRoute('listServiceAccountKeys', {serviceAccountId: saId})),
                {accessToken: adminTokens.accessToken},
            );

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({
                keys: expect.any(Array),
            });
        });

        test('List response contains created key with correct structure', async () => {
            const response = await auth(
                request(app).get(makeRoute('listServiceAccountKeys', {serviceAccountId: saId})),
                {accessToken: adminTokens.accessToken},
            );

            expect(response.status).toBe(200);

            const found = response.body.keys.find((k: {keyId: string}) => k.keyId === keyId);

            expect(found).toStrictEqual({
                keyId,
                serviceAccountId: saId,
                createdAt: expect.any(String),
            });
        });
    });

    describe('Delete key', () => {
        let keyToDeleteId: string;
        let keyToVerifyGoneId: string;

        beforeAll(async () => {
            const r1 = await auth(
                request(app).post(makeRoute('createServiceAccountKey', {serviceAccountId: saId})),
                {accessToken: adminTokens.accessToken},
            );
            keyToDeleteId = r1.body.keyId;

            const r2 = await auth(
                request(app).post(makeRoute('createServiceAccountKey', {serviceAccountId: saId})),
                {accessToken: adminTokens.accessToken},
            );
            keyToVerifyGoneId = r2.body.keyId;
        });

        test('Access denied without token', async () => {
            const response = await request(app).delete(
                makeRoute('deleteServiceAccountKey', {
                    serviceAccountId: saId,
                    keyId: keyToDeleteId,
                }),
            );

            expect(response.status).toBe(401);
        });

        test("User can't delete key", async () => {
            const response = await auth(
                request(app).delete(
                    makeRoute('deleteServiceAccountKey', {
                        serviceAccountId: saId,
                        keyId: keyToDeleteId,
                    }),
                ),
                {accessToken: userTokens.accessToken},
            );

            expect(response.status).toBe(403);
            expect(response.body).toStrictEqual({
                message: expect.any(String),
                code: AUTH_ERROR.ACCESS_DENIED,
            });
        });

        test('Admin can delete key', async () => {
            const response = await auth(
                request(app).delete(
                    makeRoute('deleteServiceAccountKey', {
                        serviceAccountId: saId,
                        keyId: keyToDeleteId,
                    }),
                ),
                {accessToken: adminTokens.accessToken},
            );

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({done: true});
        });

        test('Deleted key no longer appears in list', async () => {
            const response = await auth(
                request(app).get(makeRoute('listServiceAccountKeys', {serviceAccountId: saId})),
                {accessToken: adminTokens.accessToken},
            );

            expect(response.status).toBe(200);

            const found = response.body.keys.find(
                (k: {keyId: string}) => k.keyId === keyToDeleteId,
            );

            expect(found).toBeUndefined();
        });

        test("Can't delete non-existent key", async () => {
            const response = await auth(
                request(app).delete(
                    makeRoute('deleteServiceAccountKey', {
                        serviceAccountId: saId,
                        keyId: keyToVerifyGoneId,
                    }).replace(keyToVerifyGoneId, keyToDeleteId),
                ),
                {accessToken: adminTokens.accessToken},
            );

            expect(response.status).toBe(404);
            expect(response.body).toStrictEqual({
                message: expect.any(String),
                code: AUTH_ERROR.SERVICE_ACCOUNT_KEY_NOT_EXISTS,
            });
        });
    });
});
