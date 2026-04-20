import request from 'supertest';

import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

async function createServiceAccount(
    accessToken: string,
    name: string,
    roles: `${UserRole}`[],
): Promise<string> {
    const response = await auth(request(app).post(makeRoute('createServiceAccount')), {
        accessToken,
    }).send({name, roles});
    expect(response.status).toBe(200);
    return response.body.serviceAccountId;
}

async function getServiceAccountRoles(accessToken: string, serviceAccountId: string) {
    const response = await auth(request(app).get(makeRoute('listServiceAccounts')), {accessToken});
    expect(response.status).toBe(200);
    const sa = response.body.serviceAccounts.find(
        (s: {serviceAccountId: string}) => s.serviceAccountId === serviceAccountId,
    );
    return sa?.roles ?? [];
}

describe('Service account roles', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    let serviceAccountId: string;

    beforeAll(async () => {
        admin = await createTestUsers({roles: [UserRole.Admin], login: 'sa-roles-admin'});
        user = await createTestUsers({login: 'sa-roles-user'});

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});

        serviceAccountId = await createServiceAccount(adminTokens.accessToken, 'sa-roles-fixture', [
            UserRole.Viewer,
        ]);
    });

    test('Access denied without token for add', async () => {
        const response = await request(app)
            .post(makeRoute('addServiceAccountRoles', {serviceAccountId}))
            .send({roles: [UserRole.Editor]});
        expect(response.status).toBe(401);
    });

    test('Access denied without token for update', async () => {
        const response = await request(app)
            .post(makeRoute('updateServiceAccountRoles', {serviceAccountId}))
            .send({deltas: [{oldRole: UserRole.Viewer, newRole: UserRole.Editor}]});
        expect(response.status).toBe(401);
    });

    test('Access denied without token for remove', async () => {
        const response = await request(app)
            .post(makeRoute('removeServiceAccountRoles', {serviceAccountId}))
            .send({roles: [UserRole.Viewer]});
        expect(response.status).toBe(401);
    });

    test("User can't add roles to service account", async () => {
        const response = await auth(
            request(app).post(makeRoute('addServiceAccountRoles', {serviceAccountId})),
            {accessToken: userTokens.accessToken},
        ).send({roles: [UserRole.Editor]});

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test("User can't update roles on service account", async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccountRoles', {serviceAccountId})),
            {accessToken: userTokens.accessToken},
        ).send({deltas: [{oldRole: UserRole.Viewer, newRole: UserRole.Editor}]});

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test("User can't remove roles from service account", async () => {
        const response = await auth(
            request(app).post(makeRoute('removeServiceAccountRoles', {serviceAccountId})),
            {accessToken: userTokens.accessToken},
        ).send({roles: [UserRole.Viewer]});

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test('Admin can add a role', async () => {
        const response = await auth(
            request(app).post(makeRoute('addServiceAccountRoles', {serviceAccountId})),
            {accessToken: adminTokens.accessToken},
        ).send({roles: [UserRole.Editor]});

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});

        const roles = await getServiceAccountRoles(adminTokens.accessToken, serviceAccountId);
        expect(roles).toIncludeSameMembers([UserRole.Viewer, UserRole.Editor]);
    });

    test('Admin can add roles that already exist (idempotent)', async () => {
        const response = await auth(
            request(app).post(makeRoute('addServiceAccountRoles', {serviceAccountId})),
            {accessToken: adminTokens.accessToken},
        ).send({roles: [UserRole.Viewer, UserRole.Creator]});

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});

        const roles = await getServiceAccountRoles(adminTokens.accessToken, serviceAccountId);
        expect(roles).toIncludeSameMembers([UserRole.Viewer, UserRole.Editor, UserRole.Creator]);
    });

    test('Admin can update a role', async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccountRoles', {serviceAccountId})),
            {accessToken: adminTokens.accessToken},
        ).send({deltas: [{oldRole: UserRole.Creator, newRole: UserRole.Admin}]});

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});

        const roles = await getServiceAccountRoles(adminTokens.accessToken, serviceAccountId);
        expect(roles).toIncludeSameMembers([UserRole.Viewer, UserRole.Editor, UserRole.Admin]);
    });

    test("Admin can't update a non-existent old role", async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccountRoles', {serviceAccountId})),
            {accessToken: adminTokens.accessToken},
        ).send({deltas: [{oldRole: UserRole.Creator, newRole: UserRole.Visitor}]});

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ROLE_NOT_EXISTS,
        });
    });

    test("Admin can't update a role to one that already exists", async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccountRoles', {serviceAccountId})),
            {accessToken: adminTokens.accessToken},
        ).send({deltas: [{oldRole: UserRole.Viewer, newRole: UserRole.Editor}]});

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.NOT_CONSISTENT,
        });
    });

    test('Admin can remove a role', async () => {
        const response = await auth(
            request(app).post(makeRoute('removeServiceAccountRoles', {serviceAccountId})),
            {accessToken: adminTokens.accessToken},
        ).send({roles: [UserRole.Admin]});

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});

        const roles = await getServiceAccountRoles(adminTokens.accessToken, serviceAccountId);
        expect(roles).toIncludeSameMembers([UserRole.Viewer, UserRole.Editor]);
    });

    test('Admin can remove roles that do not exist (graceful)', async () => {
        const response = await auth(
            request(app).post(makeRoute('removeServiceAccountRoles', {serviceAccountId})),
            {accessToken: adminTokens.accessToken},
        ).send({roles: [UserRole.Admin, UserRole.Creator]});

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});

        const roles = await getServiceAccountRoles(adminTokens.accessToken, serviceAccountId);
        expect(roles).toIncludeSameMembers([UserRole.Viewer, UserRole.Editor]);
    });

    test('Returns 404 for non-existent service account on add', async () => {
        const fakeId = '7cweyb3kxxp8s';
        const response = await auth(
            request(app).post(makeRoute('addServiceAccountRoles', {serviceAccountId: fakeId})),
            {accessToken: adminTokens.accessToken},
        ).send({roles: [UserRole.Viewer]});

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    });

    test('Returns 404 for non-existent service account on update', async () => {
        const fakeId = '7cweyb3kxxp8s';
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccountRoles', {serviceAccountId: fakeId})),
            {accessToken: adminTokens.accessToken},
        ).send({deltas: [{oldRole: UserRole.Viewer, newRole: UserRole.Editor}]});

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    });

    test('Returns 404 for non-existent service account on remove', async () => {
        const fakeId = '7cweyb3kxxp8s';
        const response = await auth(
            request(app).post(makeRoute('removeServiceAccountRoles', {serviceAccountId: fakeId})),
            {accessToken: adminTokens.accessToken},
        ).send({roles: [UserRole.Viewer]});

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    });

    test('Validation error when roles array is empty on add', async () => {
        const response = await auth(
            request(app).post(makeRoute('addServiceAccountRoles', {serviceAccountId})),
            {accessToken: adminTokens.accessToken},
        ).send({roles: []});

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.VALIDATION_ERROR,
            details: expect.any(Array),
        });
    });

    test('Validation error when deltas array is empty on update', async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccountRoles', {serviceAccountId})),
            {accessToken: adminTokens.accessToken},
        ).send({deltas: []});

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.VALIDATION_ERROR,
            details: expect.any(Array),
        });
    });

    test('Validation error when roles array is empty on remove', async () => {
        const response = await auth(
            request(app).post(makeRoute('removeServiceAccountRoles', {serviceAccountId})),
            {accessToken: adminTokens.accessToken},
        ).send({roles: []});

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.VALIDATION_ERROR,
            details: expect.any(Array),
        });
    });
});
