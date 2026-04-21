import request from 'supertest';

import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestServiceAccount, createTestUsers, generateTokens} from '../../../../helpers';
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

        saId = await createTestServiceAccount({
            accessToken: adminTokens.accessToken,
            name: 'keys-sa-fixture',
            roles: [UserRole.Viewer],
        });

        nonExistentSaId = await createTestServiceAccount({
            accessToken: adminTokens.accessToken,
            name: 'keys-sa-deleted',
            roles: [UserRole.Viewer],
        });

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
        const additionalKeyIds: string[] = [];

        beforeAll(async () => {
            const keyResp = await auth(
                request(app).post(makeRoute('createServiceAccountKey', {serviceAccountId: saId})),
                {accessToken: adminTokens.accessToken},
            );
            keyId = keyResp.body.keyId;

            // Create additional keys for pagination tests
            for (let i = 0; i < 2; i++) {
                const resp = await auth(
                    request(app).post(
                        makeRoute('createServiceAccountKey', {serviceAccountId: saId}),
                    ),
                    {accessToken: adminTokens.accessToken},
                );
                additionalKeyIds.push(resp.body.keyId);
            }
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

        test('Admin can list keys. List response contains created key with correct structure', async () => {
            const response = await auth(
                request(app).get(makeRoute('listServiceAccountKeys', {serviceAccountId: saId})),
                {accessToken: adminTokens.accessToken},
            );

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({
                keys: expect.any(Array),
            });

            const found = response.body.keys.find((k: {keyId: string}) => k.keyId === keyId);

            expect(found).toStrictEqual({
                keyId,
                serviceAccountId: saId,
                createdAt: expect.any(String),
            });
        });

        test('Pagination works correctly', async () => {
            const pageSize = 3;
            const response = await auth(
                request(app)
                    .get(makeRoute('listServiceAccountKeys', {serviceAccountId: saId}))
                    .query({pageSize}),
                {
                    accessToken: adminTokens.accessToken,
                },
            );

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({
                keys: expect.any(Array),
                nextPageToken: '1',
            });
            expect(response.body.keys.length).toEqual(3);

            const response2 = await auth(
                request(app)
                    .get(makeRoute('listServiceAccountKeys', {serviceAccountId: saId}))
                    .query({pageSize, page: response.body.nextPageToken}),
                {
                    accessToken: adminTokens.accessToken,
                },
            );

            expect(response2.status).toBe(200);
            expect(response2.body).toStrictEqual({
                keys: expect.any(Array),
            });
            expect(response2.body.keys.length).toEqual(1);
        });
    });

    describe('Delete key', () => {
        let keyToDeleteId: string;
        let existentKeyId: string;

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
            existentKeyId = r2.body.keyId;
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

            const deletedKey = response.body.keys.find(
                (k: {keyId: string}) => k.keyId === keyToDeleteId,
            );

            const existentKey = response.body.keys.find(
                (k: {keyId: string}) => k.keyId === existentKeyId,
            );

            expect(deletedKey).toBeUndefined();
            expect(existentKey).toBeDefined();
        });
    });
});
