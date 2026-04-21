import request from 'supertest';

import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestServiceAccount, createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

describe('List service accounts', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    let createdServiceAccountId: string;
    const createdServiceAccountIds: string[] = [];

    beforeAll(async () => {
        admin = await createTestUsers({roles: [UserRole.Admin], login: 'list-sa-admin'});
        user = await createTestUsers({login: 'list-sa-user'});

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});

        createdServiceAccountId = await createTestServiceAccount({
            accessToken: adminTokens.accessToken,
            name: 'list-sa-fixture',
            description: 'Fixture service account for list tests',
            roles: [UserRole.Viewer],
        });

        // Create additional service accounts for pagination tests
        for (let i = 0; i < 2; i++) {
            const id = await createTestServiceAccount({
                accessToken: adminTokens.accessToken,
                name: `list-sa-pagination-${i}`,
                description: `Service account ${i} for pagination tests`,
                roles: [UserRole.Viewer],
            });
            createdServiceAccountIds.push(id);
        }
    });

    test('Access denied without token', async () => {
        const response = await request(app).get(makeRoute('listServiceAccounts'));

        expect(response.status).toBe(401);
    });

    test("User can't list service accounts", async () => {
        const response = await auth(request(app).get(makeRoute('listServiceAccounts')), {
            accessToken: userTokens.accessToken,
        });

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test('Admin can list service accounts', async () => {
        const response = await auth(request(app).get(makeRoute('listServiceAccounts')), {
            accessToken: adminTokens.accessToken,
        });

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            serviceAccounts: expect.any(Array),
        });
        expect(response.body.serviceAccounts.length).toEqual(3);

        const found = response.body.serviceAccounts.find(
            (sa: {serviceAccountId: string}) => sa.serviceAccountId === createdServiceAccountId,
        );

        expect(found).toStrictEqual({
            serviceAccountId: createdServiceAccountId,
            name: 'list-sa-fixture',
            description: 'Fixture service account for list tests',
            roles: [UserRole.Viewer],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
        });
    });

    test('Pagination works correctly', async () => {
        const pageSize = 2;
        const response = await auth(
            request(app).get(makeRoute('listServiceAccounts')).query({pageSize}),
            {
                accessToken: adminTokens.accessToken,
            },
        );

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            serviceAccounts: expect.any(Array),
            nextPageToken: '1',
        });
        expect(response.body.serviceAccounts.length).toEqual(2);

        const response2 = await auth(
            request(app)
                .get(makeRoute('listServiceAccounts'))
                .query({pageSize, page: response.body.nextPageToken}),
            {
                accessToken: adminTokens.accessToken,
            },
        );

        expect(response2.status).toBe(200);
        expect(response2.body).toStrictEqual({
            serviceAccounts: expect.any(Array),
        });
        expect(response2.body.serviceAccounts.length).toEqual(1);
    });
});
