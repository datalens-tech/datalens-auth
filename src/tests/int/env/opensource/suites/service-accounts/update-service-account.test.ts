import request from 'supertest';

import {encodeId} from '../../../../../../utils/ids';
import {AUTH_ERROR, UserRole, app, auth} from '../../../../auth';
import {createTestServiceAccount, createTestUsers, generateTokens} from '../../../../helpers';
import {makeRoute} from '../../../../routes';

describe('Update service account', () => {
    let admin = {} as Awaited<ReturnType<typeof createTestUsers>>,
        user = {} as Awaited<ReturnType<typeof createTestUsers>>,
        adminTokens = {} as Awaited<ReturnType<typeof generateTokens>>,
        userTokens = {} as Awaited<ReturnType<typeof generateTokens>>;

    let saId: string;
    let anotherSaId: string;

    beforeAll(async () => {
        admin = await createTestUsers({roles: [UserRole.Admin], login: 'update-sa-admin'});
        user = await createTestUsers({login: 'update-sa-user'});

        adminTokens = await generateTokens({userId: admin.userId});
        userTokens = await generateTokens({userId: user.userId});

        const sa = await createTestServiceAccount({
            name: 'update-sa-fixture',
            roles: [UserRole.Viewer],
        });
        saId = encodeId(sa.userId);

        const anotherSa = await createTestServiceAccount({
            name: 'update-sa-another',
            roles: [UserRole.Viewer],
        });
        anotherSaId = encodeId(anotherSa.userId);
    });

    test('Access denied without token', async () => {
        const response = await request(app)
            .post(makeRoute('updateServiceAccount', {serviceAccountId: saId}))
            .send({name: 'update-sa-new-name'});

        expect(response.status).toBe(401);
    });

    test("User can't update service account", async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccount', {serviceAccountId: saId})),
            {accessToken: userTokens.accessToken},
        ).send({name: 'update-sa-new-name'});

        expect(response.status).toBe(403);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.ACCESS_DENIED,
        });
    });

    test('Admin can update service account name', async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccount', {serviceAccountId: saId})),
            {accessToken: adminTokens.accessToken},
        ).send({name: 'update-sa-renamed'});

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({done: true});
    });

    test("Can't update with name already taken by another service account", async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccount', {serviceAccountId: saId})),
            {accessToken: adminTokens.accessToken},
        ).send({name: 'update-sa-another'});

        expect(response.status).toBe(409);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.SERVICE_ACCOUNT_NAME_EXISTS,
        });
    });

    test("Can't update with the same name the SA already has", async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccount', {serviceAccountId: anotherSaId})),
            {accessToken: adminTokens.accessToken},
        ).send({name: 'update-sa-another'});

        expect(response.status).toBe(409);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.SERVICE_ACCOUNT_NAME_EXISTS,
        });
    });

    test("Can't update non-existent service account", async () => {
        const deletedSa = await createTestServiceAccount({
            name: 'update-sa-to-delete',
            roles: [UserRole.Viewer],
        });
        const deletedSaId = encodeId(deletedSa.userId);

        await auth(request(app).delete(makeRoute('deleteUser', {userId: deletedSaId})), {
            accessToken: adminTokens.accessToken,
        });

        const response = await auth(
            request(app).post(makeRoute('updateServiceAccount', {serviceAccountId: deletedSaId})),
            {accessToken: adminTokens.accessToken},
        ).send({name: 'update-sa-ghost'});

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    });

    test("Can't update without body", async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccount', {serviceAccountId: saId})),
            {accessToken: adminTokens.accessToken},
        ).send({});

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.VALIDATION_ERROR,
            details: expect.any(Array),
        });
    });

    test("Can't update with empty name", async () => {
        const response = await auth(
            request(app).post(makeRoute('updateServiceAccount', {serviceAccountId: saId})),
            {accessToken: adminTokens.accessToken},
        ).send({name: ''});

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            message: expect.any(String),
            code: AUTH_ERROR.VALIDATION_ERROR,
            details: expect.any(Array),
        });
    });
});
